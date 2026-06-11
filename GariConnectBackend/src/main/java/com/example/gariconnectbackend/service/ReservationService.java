/*package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.PassagerDTO;
import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.NotificationRepository;
import com.example.gariconnectbackend.repository.ReservationRepository;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TrajetRepository trajetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private WhatsAppService whatsAppService;

    @Transactional
    public Reservation creerReservation(Reservation reservation) {
        if (reservation.getTrajet() == null || reservation.getTrajet().getId() == null) {
            throw new RuntimeException("L'ID du trajet est manquant");
        }
        if (reservation.getClient() == null || reservation.getClient().getId() == null) {
            throw new RuntimeException("L'ID du client est manquant");
        }

        Trajet trajet = trajetRepository.findById(reservation.getTrajet().getId())
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        User client = userRepository.findById(reservation.getClient().getId())
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        if (trajet.getPlacesDisponibles() <= 0) {
            throw new RuntimeException("Bus complet !");
        }

        reservation.setTrajet(trajet);
        reservation.setClient(client);
        reservation.setDateReservation(LocalDateTime.now());

        String code = "GARI-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        reservation.setCodeTicket(code);

        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - 1);
        trajetRepository.save(trajet);

        return reservationRepository.save(reservation);
    }

    public List<Reservation> listerToutes() {
        return reservationRepository.findAll();
    }

    public List<Reservation> recupererParClient(Long clientId) {
        List<Reservation> reservations = reservationRepository.findByClientId(clientId);
        if (reservations.isEmpty()) {
            System.out.println("Aucune réservation trouvée pour le client ID : " + clientId);
        }
        return reservations;
    }

    public Reservation recupererParId(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));
    }

    public List<PassagerDTO> obtenirPassagersParTrajet(Long trajetId) {
        return reservationRepository.findByTrajetId(trajetId).stream()
                .map(res -> new PassagerDTO(
                        res.getClient().getNom(),
                        res.getClient().getTelephone(),
                        res.getCodeTicket()))
                .collect(Collectors.toList());
    }


    @Transactional
    public Reservation changerStatut(Long id, String nouveauStatut) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        r.setStatut(nouveauStatut);
        Reservation reservationMiseAJour = reservationRepository.save(r);

        String statutLisible = nouveauStatut;
        if (nouveauStatut.equalsIgnoreCase("CONFIRMEE")) {
            statutLisible = "confirmée avec succès ✅";
        } else if (nouveauStatut.equalsIgnoreCase("ANNULEE")) {
            statutLisible = "annulée ❌";
        } else if (nouveauStatut.equalsIgnoreCase("TERMINEE")) {
            statutLisible = "terminée. Merci d'avoir voyagé avec GariConnect ! 🏁";
        }

        String detailsTrajet = "votre voyage";
        if (r.getTrajet() != null) {
            detailsTrajet = "votre trajet Réf #" + r.getTrajet().getId();
        }

        String message = "GariConnect : Le statut de votre réservation pour " + detailsTrajet + " a été mis à jour. Nouveau statut : " + statutLisible;

        notifierLeClient(r.getClient(), message);

        return reservationMiseAJour;
    }


    @Transactional
    public Reservation modifierReservation(Long id, Reservation details) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        if (details.getNumeroSiege() != null) {
            r.setNumeroSiege(details.getNumeroSiege());
        }
        if (details.getMontantPaye() != null) {
            r.setMontantPaye(details.getMontantPaye());
        }
        if (details.getStatut() != null) {
            r.setStatut(details.getStatut());
        }

        Reservation reservationModifiee = reservationRepository.save(r);

        String detailsTrajet = "votre voyage";
        if (r.getTrajet() != null) {
            detailsTrajet = "votre trajet Réf #" + r.getTrajet().getId();
        }

        String message = "GariConnect : Des modifications ont été apportées à votre réservation pour " + detailsTrajet + ". Veuillez consulter vos nouveaux détails directement sur l'application.";

        notifierLeClient(r.getClient(), message);

        return reservationModifiee;
    }

    @Transactional
    public void supprimerReservation(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        String detailsTrajet = "votre voyage";
        if (r.getTrajet() != null) {
            detailsTrajet = "votre trajet Réf #" + r.getTrajet().getId();
        }

        String message = "⚠️ GariConnect : Votre réservation pour " + detailsTrajet + " a été annulée ou supprimée par l'agence. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'agence.";

        // Notifier avant de supprimer !
        notifierLeClient(r.getClient(), message);

        if (r.getTrajet() != null && r.getTrajet().getPlacesDisponibles() != null) {
            r.getTrajet().setPlacesDisponibles(r.getTrajet().getPlacesDisponibles() + 1);
            trajetRepository.save(r.getTrajet());
        }

        reservationRepository.delete(r);
    }


    private void notifierLeClient(User client, String message) {
        if (client == null) {
            System.err.println("⚠️ [NOTIF RÉSERVATION] Échec : Aucun client n'est associé à cette réservation.");
            return;
        }

        if (client.getRole() == Role.CLIENT) {
            Notification notif = new Notification();
            notif.setDestinataire(client);
            notif.setMessage(message);
            notificationRepository.save(notif);
            System.out.println("🎉 [NOTIF APPLI] Enregistrée pour le client ID : " + client.getId());
        }

        if (client.getTelephone() != null && !client.getTelephone().trim().isEmpty()) {
            whatsAppService.envoyerMessage(client.getTelephone(), message);
        } else {
            System.err.println("⚠️ [WHATSAPP RÉSERVATION] Impossible d'envoyer : Téléphone manquant.");
        }
    }
}
*/
package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.PassagerDTO;
import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TrajetRepository trajetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private WhatsAppService whatsAppService;
    @Autowired
    private DemandeRecuperationRepository demandeRecuperationRepository;

    /**
     * 🟢 1. CHANGEMENT DE STATUT : Notifie le client du nouveau statut de son voyage
     */
    @Transactional
    public Reservation mettreAJourStatut(Long id, String nouveauStatut) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        String ancienStatut = reservation.getStatut();
        reservation.setStatut(nouveauStatut);
        Reservation reservationMiseAJour = reservationRepository.save(reservation);

        String detailsTrajet = (reservation.getTrajet() != null)
                ? "le trajet " + reservation.getTrajet().getDepart() + " - " + reservation.getTrajet().getDestination()
                : "votre voyage";

        String message = "🔔 Le statut de votre réservation pour " + detailsTrajet + " a changé de [" + ancienStatut + "] à [" + nouveauStatut + "].";

        notifierLeClient(reservation.getClient(), message);

        return reservationMiseAJour;
    }

    /**
     * 📝 2. MODIFICATION : Notifie le client des changements apportés à sa réservation (ex: changement de siège)
     */
    @Transactional
    public Reservation modifierReservation(Long id, Reservation details) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        Integer ancienSiege = reservation.getNumeroSiege();

        // Exemple de mise à jour des paramètres éligibles
        if (details.getNumeroSiege() != null) {
            reservation.setNumeroSiege(details.getNumeroSiege());
        }
        if (details.getMontantPaye() != null) {
            reservation.setMontantPaye(details.getMontantPaye());
        }

        Reservation reservationModifiee = reservationRepository.save(reservation);

        String detailsTrajet = (reservation.getTrajet() != null)
                ? "pour le trajet " + reservation.getTrajet().getDepart() + " - " + reservation.getTrajet().getDestination()
                : "";

        String message = "📝 Votre réservation " + detailsTrajet + " a été mise à jour. " +
                (details.getNumeroSiege() != null ? "Nouveau numéro de siège : " + reservationModifiee.getNumeroSiege() + " (Ancien : " + ancienSiege + ")." : "");

        notifierLeClient(reservation.getClient(), message);

        return reservationModifiee;
    }

    /**
     * ❌ 3. SUPPRESSION / ANNULATION : Notifie le client de la suppression avant de retirer la ligne de la BDD
     */
    @Transactional
    public void annulerReservation(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        String detailsTrajet = (r.getTrajet() != null)
                ? r.getTrajet().getDepart() + " - " + r.getTrajet().getDestination()
                : "votre voyage";

        String message = "❌ Votre réservation pour " + detailsTrajet + " a été annulée ou supprimée par l'agence. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'agence.";

        // /!\ CRUCIAL : Envoyer la notification AVANT d'exécuter la suppression physique en BDD
        notifierLeClient(r.getClient(), message);

        // Libérer la place sur le trajet concerné
        if (r.getTrajet() != null && r.getTrajet().getPlacesDisponibles() != null) {
            r.getTrajet().setPlacesDisponibles(r.getTrajet().getPlacesDisponibles() + 1);
            trajetRepository.save(r.getTrajet());
        }

        reservationRepository.delete(r);
    }



    public List<Reservation> listerToutes() {
        return reservationRepository.findAll();
    }

    public List<Reservation> recupererParClient(Long clientId) {
        return reservationRepository.findByClientId(clientId);
    }

    public Reservation recupererParId(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));
    }


    public List<PassagerDTO> obtenirPassagersParTrajet(Long trajetId) {
        return reservationRepository.findByTrajetId(trajetId).stream()
                .map(res -> new PassagerDTO(
                        res.getClient().getNom(),
                        res.getClient().getTelephone(),
                        res.getCodeTicket()))
                .collect(Collectors.toList());
    }
    /**
     * 🔐 MÉTHODE COMMUNE DE NOTIFICATION : ALERTE APPLI + ENVOI WHATSAPP
     */
    public void notifierLeClient(User client, String message) {
        if (client == null) {
            System.err.println("⚠️ [NOTIF RÉSERVATION] Échec : Aucun client n'est associé à cette réservation.");
            return;
        }

        // 1. Notification interne enregistrée pour l'interface utilisateur
        // -> ON A SUPPRIMÉ LA CONDITION 'if (client.getRole() == Role.CLIENT)'
        // pour être sûr que n'importe quel propriétaire de la réservation soit notifié.
        Notification notif = new Notification();
        notif.setDestinataire(client);
        notif.setMessage(message);
        notif.setLue(false);
        notif.setDate(LocalDateTime.now());
        notificationRepository.save(notif);
        System.out.println("🎉 [NOTIF APPLI] Enregistrée pour le client ID : " + client.getId());

        // 2. Notification externe instantanée via WhatsApp
        if (client.getTelephone() != null && !client.getTelephone().trim().isEmpty()) {
            whatsAppService.envoyerMessage(client.getTelephone(), message);
        } else {
            System.err.println("⚠️ [WHATSAPP] Impossible d'envoyer : Téléphone manquant pour client " + client.getId());
        }
    }

    @Transactional
    public Reservation creerReservation(Reservation reservation) {
        // 1. Vérifier que le trajet est bien fourni
        if (reservation.getTrajet() == null || reservation.getTrajet().getId() == null) {
            throw new RuntimeException("❌ Échec : Aucun trajet n'est associé à cette réservation.");
        }

        // 2. Recharger le trajet depuis la base de données pour avoir les données fraîches et réelles
        Trajet trajet = trajetRepository.findById(reservation.getTrajet().getId())
                .orElseThrow(() -> new RuntimeException("❌ Échec : Trajet introuvable."));

        // 3. Vérifier s'il reste des places disponibles
        if (trajet.getPlacesDisponibles() == null || trajet.getPlacesDisponibles() <= 0) {
            throw new RuntimeException("❌ Échec : Plus de places disponibles pour ce trajet !");
        }

        // 4. Déterminer dynamiquement le numéro de siège
        // On récupère la capacité totale depuis le véhicule de l'agence associé au trajet
        int capaciteTotale = 0;
        if (trajet.getVehicule() != null && trajet.getVehicule().getCapacite() != null) {
            capaciteTotale = trajet.getVehicule().getCapacite();
        } else {
            // Option de secours si la capacité du véhicule n'est pas renseignée
            capaciteTotale = 30;
        }

        // Calcul proportionnel du numéro de siège (ex: s'il reste 18 places sur 20, c'est le siège 3)
        int numeroSiegeCalcule = (capaciteTotale - trajet.getPlacesDisponibles()) + 1;
        reservation.setNumeroSiege(numeroSiegeCalcule);

        // 5. Diminuer le nombre de places disponibles du trajet de 1
        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - 1);
        trajetRepository.save(trajet); // Met à jour le trajet côté agence

        // 6. Rattacher le trajet mis à jour à la réservation
        reservation.setTrajet(trajet);

        // 7. Initialisation des autres paramètres de la réservation
        reservation.setDateReservation(LocalDateTime.now());
        reservation.setStatut("EN_ATTENTE"); // Ou "VALIDE" selon votre flux de paiement

        if (reservation.getCodeTicket() == null || reservation.getCodeTicket().isEmpty()) {
            reservation.setCodeTicket("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        // 8. Sauvegarde de la réservation
        Reservation nouvelleReservation = reservationRepository.save(reservation);
        System.out.println("🎉 [SUCCÈS] Réservation créée. Siège N°: " + numeroSiegeCalcule + ". Places restantes sur le trajet : " + trajet.getPlacesDisponibles());

        // 9. Notification automatique du client
        String messageNotification = "Bonjour, votre réservation pour le trajet " + trajet.getDepart() + " - " +
                trajet.getDestination() + " a été enregistrée. Siège réservé : N°" + numeroSiegeCalcule + ". Ticket : " + nouvelleReservation.getCodeTicket();
        notifierLeClient(nouvelleReservation.getClient(), messageNotification);

        return nouvelleReservation;
    }

    /**
     * Récupère l'historique unifié (Normal & VID) pour le client connecté
     */
    public List<com.example.gariconnectbackend.dto.HistoriqueVoyageDTO> obtenirHistoriqueClient(String emailClient) {
        // 1. Récupération de toutes les réservations du client triées par date décroissante
        List<Reservation> reservations = reservationRepository.findByClient_EmailOrderByDateReservationDesc(emailClient);

        // 2. Transformation en liste de DTOs enrichis
        return reservations.stream().map(res -> {
            com.example.gariconnectbackend.dto.HistoriqueVoyageDTO dto = new com.example.gariconnectbackend.dto.HistoriqueVoyageDTO();
            dto.setId(res.getId());
            dto.setDateReservation(res.getDateReservation() != null ? res.getDateReservation() : java.time.LocalDateTime.now());

            // Extraction des informations du trajet (Depart, Destination, Heure)
            if (res.getTrajet() != null) {
                dto.setVilleDepart(res.getTrajet().getDepart());       // Correspond à trajet.getDepart()
                dto.setVilleArrivee(res.getTrajet().getDestination()); // Correspond à trajet.getDestination()

                // CORRECTION : Utilisation de getDateHeureDepart() et formatage en String (HH:mm)
                if (res.getTrajet().getDateHeureDepart() != null) {
                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                    dto.setHeureDepart(res.getTrajet().getDateHeureDepart().format(formatter));
                } else {
                    dto.setHeureDepart("--:--");
                }
            }

            // Gestion des aspects financiers globaux de la réservation
            dto.setMontantTotal(res.getMontantPaye() != null ? res.getMontantPaye() : 0.0);
            dto.setStatutPaiement(res.getStatut()); // Ex: "PAYE", "EN_ATTENTE"

            // 3. Vérification s'il existe une demande de ramassage à domicile (VID) liée à cette réservation
            java.util.Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findByReservationId(res.getId());

            if (demandeOpt.isPresent()) {
                DemandeRecuperation dm = demandeOpt.get();
                dto.setTypeReservation("VID");
                dto.setAdresseRamassage(dm.getAdresseTextuelle());
                dto.setPrixSupplementaire(dm.getPrixSupplementaire() != null ? dm.getPrixSupplementaire() : 0.0);
            } else {
                dto.setTypeReservation("NORMAL");
                dto.setAdresseRamassage(null);
                dto.setPrixSupplementaire(0.0);
            }

            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }
}