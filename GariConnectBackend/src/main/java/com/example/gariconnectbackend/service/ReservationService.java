package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.PassagerDTO;
import com.example.gariconnectbackend.dto.HistoriqueVoyageDTO;
import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
        import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired private ReservationRepository reservationRepository;
    @Autowired private TrajetRepository trajetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private WhatsAppService whatsAppService;
    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private FinanceRepository financeRepository;
    @Autowired private ArretBusRepository arretBusRepository;

    @Transactional
    public Reservation creerReservation(Reservation reservation) {
        if (reservation.getTrajet() == null || reservation.getTrajet().getId() == null) {
            throw new IllegalArgumentException("L'ID du trajet est obligatoire.");
        }

        if (reservation.getClient() == null) {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User client = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));
            reservation.setClient(client);
        }

        Trajet trajet = trajetRepository.findById(reservation.getTrajet().getId())
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        int placesDemandees = (reservation.getNombrePlaces() != null && reservation.getNombrePlaces() > 0) ? reservation.getNombrePlaces() : 1;

        if (trajet.getPlacesDisponibles() < placesDemandees) {
            throw new RuntimeException("Désolé, il ne reste que " + trajet.getPlacesDisponibles() + " places disponibles.");
        }

        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - placesDemandees);
        trajetRepository.save(trajet);

        reservation.setTrajet(trajet);
        reservation.setDateReservation(LocalDateTime.now());
        reservation.setNombrePlaces(placesDemandees);
        reservation.setStatut("EN_ATTENTE_DE_PAIEMENT");
        reservation.setMontantPaye(0.0);

        // 🟢 MODIFICATION 1 : Vérification et attachement sécurisé de l'arrêt de bus (ArretBus)
        if (reservation.getArretMontage() != null && reservation.getArretMontage().getId() != null) {
            ArretBus arret = arretBusRepository.findById(reservation.getArretMontage().getId())
                    .orElseThrow(() -> new RuntimeException("Arrêt de bus spécifié introuvable"));
            reservation.setArretMontage(arret);
        }

        // 🟢 MODIFICATION 2 : Initialisation forcée du statut pour le traitement au quai/guichet
        // Évite que le champ soit stocké à NULL en Base de Données
        reservation.setStatutEmbarquement(StatutPassagerArret.EN_ATTENTE_A_L_ARRET);

        if (reservation.getTypeReservation() == null || reservation.getTypeReservation().trim().isEmpty()) {
            reservation.setTypeReservation("STANDARD");
        } else {
            reservation.setTypeReservation(reservation.getTypeReservation().toUpperCase());
        }

        if (reservation.getCodeTicket() == null || reservation.getCodeTicket().isEmpty()) {
            reservation.setCodeTicket("TICK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        Reservation savedReservation = reservationRepository.save(reservation);

        String typeTexte = "VIP".equals(savedReservation.getTypeReservation()) ? "avec ramassage VIP" : "standard";
        String msg = String.format("Votre réservation %s pour %s ➔ %s est enregistrée. Veuillez payer à l'agence pour confirmer votre place.",
                typeTexte, trajet.getDepart(), trajet.getDestination());
        notifierLeClient(savedReservation.getClient(), msg);

        return savedReservation;
    }
    @Transactional
    public Reservation finaliserPaiementGlobal(Long reservationId, Map<String, Object> payload) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        if ("PAYE".equals(reservation.getStatut())) {
            throw new RuntimeException("Cette réservation a déjà été payée.");
        }

        double montantTotalAttendu = reservation.getMontantTotal();
        double montantFinal = montantTotalAttendu;
        if (payload != null && payload.containsKey("montantTotal")) {
            montantFinal = Double.parseDouble(payload.get("montantTotal").toString());
        }

        reservation.setStatut("PAYE");
        reservation.setMontantPaye(montantFinal);

        if (payload != null && payload.containsKey("modePaiement")) {
            reservation.setModePaiement(payload.get("modePaiement").toString());
            reservation.setReferenceTransaction(payload.getOrDefault("referenceTransaction", "CAISSE").toString());
        }

        paiementRepository.findByReservationId(reservation.getId()).ifPresent(paiement -> {
            paiement.setStatut("SUCCES");
            paiementRepository.save(paiement);
        });

        User agence = reservation.getTrajet().getAgence();
        boolean isAbonnementDefinitif = agence != null && "DEFINITIF".equalsIgnoreCase(agence.getTypeAbonnement());

        double nouvelleCommission = 0.0;
        Double taux = 0.0;

        if (agence != null && !isAbonnementDefinitif) {
            taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
            nouvelleCommission = (montantFinal * taux) / 100;
        }

        reservation.setMontantCommission(nouvelleCommission);
        reservation.setPartAgence(montantFinal - nouvelleCommission);

        Reservation reservationMiseAJour = reservationRepository.save(reservation);
        enregistrerTransactionFinance(agence, reservation, montantFinal, nouvelleCommission, taux);

        demandeRecuperationRepository.findByReservationId(reservation.getId()).ifPresent(demande -> {
            demande.setStatut(StatutRecuperation.PAYE);
            demandeRecuperationRepository.save(demande);
            System.out.println("🚐 [VIP] Demande de ramassage N°" + demande.getId() + " validée automatiquement suite à l'encaissement.");
        });

        String detailsTrajet = (reservation.getTrajet() != null) ?
                "le trajet " + reservation.getTrajet().getDepart() + " - " + reservation.getTrajet().getDestination() : "votre voyage";

        notifierLeClient(reservation.getClient(), "🎉 Paiement confirmé ! Votre réservation pour " + detailsTrajet + " est validée. Bon voyage !");

        return reservationMiseAJour;
    }

    private void enregistrerTransactionFinance(User agence, Reservation reservation, double montantFinal, double commission, Double taux) {
        if (agence == null) return;

        String codeTicket = reservation.getCodeTicket() != null ? reservation.getCodeTicket() : "EN-ATTENTE";
        String nomClient = (reservation.getClient() != null) ? reservation.getClient().getNom() : "Client Inconnu";

        FinanceTransaction transactionEntree = new FinanceTransaction();
        transactionEntree.setAgence(agence);
        transactionEntree.setDate(java.time.LocalDate.now());
        transactionEntree.setTypeTransaction("ENTREE");
        transactionEntree.setDevise("CDF");
        transactionEntree.setMontant(montantFinal);
        transactionEntree.setDescription("Paiement Billet (" + reservation.getTypeReservation() + ") - Ticket : " + codeTicket);
        transactionEntree.setEntite(nomClient);
        transactionEntree.setDocumentRef(codeTicket);
        financeRepository.save(transactionEntree);

        if (commission > 0) {
            FinanceTransaction transactionSortie = new FinanceTransaction();
            transactionSortie.setAgence(agence);
            transactionSortie.setDate(java.time.LocalDate.now());
            transactionSortie.setTypeTransaction("SORTIE");
            transactionSortie.setDevise("CDF");
            transactionSortie.setMontant(commission);
            transactionSortie.setDescription("Commission Plateforme (" + taux + "%) - Ticket : " + codeTicket);
            transactionSortie.setEntite("GariConnect Platform");
            transactionSortie.setDocumentRef(codeTicket);
            financeRepository.save(transactionSortie);
        }
    }

    public void notifierLeClient(User client, String message) {
        if (client == null) return;
        try {
            Notification notif = new Notification();
            notif.setDestinataire(client);
            notif.setMessage(message);
            notif.setLue(false);
            notif.setDate(LocalDateTime.now());
            notificationRepository.save(notif);

            if (client.getTelephone() != null && !client.getTelephone().trim().isEmpty()) {
                whatsAppService.envoyerMessage(client.getTelephone(), message);
            }
        } catch (Exception e) {
            System.err.println("⚠️ [NOTIFICATION] Impossible d'envoyer : " + e.getMessage());
        }
    }

    @Transactional
    public Reservation modifierReservation(Long id, Reservation details) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        Integer ancienSiege = reservation.getNumeroSiege();
        if (details.getNumeroSiege() != null) reservation.setNumeroSiege(details.getNumeroSiege());
        if (details.getMontantPaye() != null) reservation.setMontantPaye(details.getMontantPaye());

        Reservation reservationModifiee = reservationRepository.save(reservation);

        String message = "📝 Votre réservation a été mise à jour. " +
                (details.getNumeroSiege() != null ? "Nouveau numéro de siège : " + reservationModifiee.getNumeroSiege() + " (Ancien : " + ancienSiege + ")." : "");
        notifierLeClient(reservation.getClient(), message);

        return reservationModifiee;
    }

    @Transactional
    public Reservation mettreAJourStatut(Long id, String nouveauStatut) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        String ancienStatut = reservation.getStatut();
        reservation.setStatut(nouveauStatut);
        Reservation reservationMiseAJour = reservationRepository.save(reservation);

        String message = "🔔 Le statut de votre réservation a changé de [" + ancienStatut + "] à [" + nouveauStatut + "].";
        notifierLeClient(reservation.getClient(), message);

        return reservationMiseAJour;
    }

    @Transactional
    public void annulerReservation(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        notifierLeClient(r.getClient(), "❌ Votre réservation a été annulée par l'agence.");

        if (r.getTrajet() != null && r.getTrajet().getPlacesDisponibles() != null) {
            int placesRendues = (r.getNombrePlaces() != null && r.getNombrePlaces() > 0) ? r.getNombrePlaces() : 1;
            r.getTrajet().setPlacesDisponibles(r.getTrajet().getPlacesDisponibles() + placesRendues);
            trajetRepository.save(r.getTrajet());
        }

        reservationRepository.delete(r);
    }

    public List<Reservation> listerToutes() { return reservationRepository.findAll(); }
    public List<Reservation> recupererParClient(Long clientId) { return reservationRepository.findByClientId(clientId); }
    public Reservation recupererParId(Long id) {
        return reservationRepository.findById(id).orElseThrow(() -> new RuntimeException("Réservation introuvable"));
    }

    public List<PassagerDTO> obtenirPassagersParTrajet(Long trajetId) {
        return reservationRepository.findByTrajetId(trajetId).stream()
                .map(res -> new PassagerDTO(
                        res.getClient().getNom(),
                        res.getClient().getTelephone(),
                        res.getCodeTicket(),
                        res.getNumeroSiege()
                )).collect(Collectors.toList());
    }

    public List<HistoriqueVoyageDTO> obtenirHistoriqueClient(String email) {
        List<Reservation> reservations = reservationRepository.findByClient_EmailOrderByDateReservationDesc(email);

        return reservations.stream().map(res -> {
            HistoriqueVoyageDTO dto = new HistoriqueVoyageDTO();
            dto.setId(res.getId());
            dto.setDateReservation(res.getDateReservation() != null ? res.getDateReservation() : LocalDateTime.now());

            if (res.getTrajet() != null) {
                dto.setVilleDepart(res.getTrajet().getDepart());
                dto.setVilleArrivee(res.getTrajet().getDestination());
                if (res.getTrajet().getDateHeureDepart() != null) {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
                    dto.setHeureDepart(res.getTrajet().getDateHeureDepart().format(formatter));
                } else {
                    dto.setHeureDepart("--:--");
                }
            }

            dto.setMontantTotal(res.getMontantTotal());
            int nbrPlaces = (res.getNombrePlaces() != null && res.getNombrePlaces() > 0) ? res.getNombrePlaces() : 1;
            dto.setNombrePlaces(nbrPlaces);

            Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findByReservationId(res.getId());
            if (demandeOpt.isPresent()) {
                DemandeRecuperation dm = demandeOpt.get();
                dto.setTypeReservation("VIP");
                dto.setAdresseRamassage(dm.getAdresseTextuelle());
                dto.setPrixSupplementaire(dm.getPrixSupplementaire() != null ? dm.getPrixSupplementaire() : 0.0);
            } else {
                dto.setTypeReservation("STANDARD");
                dto.setAdresseRamassage(null);
                dto.setPrixSupplementaire(0.0);
            }

            return dto;
        }).collect(Collectors.toList());
    }
}