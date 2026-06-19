package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.*;
import com.example.gariconnectbackend.service.ReservationService;
import com.example.gariconnectbackend.dto.PassagerDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.example.gariconnectbackend.model.DemandeRecuperation;
import com.example.gariconnectbackend.repository.*;

import com.example.gariconnectbackend.dto.HistoriqueVoyageDTO;


import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommissionDetteRepository commissionRepo;

    @Autowired
    private TrajetRepository trajetRepository;
    @Autowired
    private DemandeRecuperationRepository demandeRecuperationRepository;




    @PostMapping("/creer")
    public ResponseEntity<?> creerReservation(@RequestBody Reservation reservation) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                String emailConnecte = auth.getName();
                User clientConnecte = userRepository.findByEmail(emailConnecte)
                        .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

                reservation.setClient(clientConnecte);
            } else {
                throw new RuntimeException("Vous devez être connecté pour effectuer une réservation.");
            }

            Reservation nouvelleReservation = reservationService.creerReservation(reservation);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouvelleReservation);

        } catch (Exception e) {
            System.err.println("❌ ERREUR CRÉATION RÉSERVATION : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> annulerReservation(@PathVariable Long id) {
        try {
            reservationService.annulerReservation(id);
            return ResponseEntity.ok(Map.of("message", "Réservation annulée et notifiée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/trajet/{trajetId}/passagers")
    public ResponseEntity<List<PassagerDTO>> obtenirPassagersParTrajet(@PathVariable Long trajetId) {
        return ResponseEntity.ok(reservationService.obtenirPassagersParTrajet(trajetId));
    }

    @GetMapping("/mes-reservations")
    public ResponseEntity<?> getMesReservations() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            List<Reservation> reservations = reservationService.recupererParClient(user.getId());
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Reservation>> listerToutes() {
        return ResponseEntity.ok(reservationService.listerToutes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> recupererParId(@PathVariable Long id) {
        try {
            Reservation reservation = reservationService.recupererParId(id);
            return ResponseEntity.ok(reservation);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mon-voyage-actif")
    public ResponseEntity<?> getVoyageEligible() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            List<Reservation> mesReservations = reservationService.recupererParClient(user.getId());
            LocalDateTime limite48h = LocalDateTime.now().minusHours(48);

            Reservation voyageEligible = mesReservations.stream()
                    .filter(res -> res.getTrajet() != null)
                    .filter(res -> "CONFIRMEE".equals(res.getStatut()))
                    .filter(res -> {
                        String statutTrajet = res.getTrajet().getStatut();

                        if ("EN_ROUTE".equals(statutTrajet)) {
                            return true;
                        }

                        if ("TERMINE".equals(statutTrajet)) {
                            LocalDateTime dateReference = res.getTrajet().getUpdatedAt();
                            return (dateReference == null) || dateReference.isAfter(limite48h);
                        }
                        return false;
                    })
                    .findFirst()
                    .orElse(null);

            return voyageEligible != null
                    ? ResponseEntity.ok(voyageEligible)
                    : ResponseEntity.noContent().build();

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> mettreAJourStatut(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String nouveauStatut = payload.get("statut");
            Reservation reservationMiseAJour = reservationService.mettreAJourStatut(id, nouveauStatut);
            return ResponseEntity.ok(reservationMiseAJour);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modifierReservation(@PathVariable Long id, @RequestBody Reservation details) {
        try {
            Reservation reservationModifiee = reservationService.modifierReservation(id, details);
            return ResponseEntity.ok(reservationModifiee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/valider-scan")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> validerTicketParChauffeur(@RequestBody Map<String, String> payload) {
        String codeTicket = payload.get("codeTicket");
        String emailChauffeur = SecurityContextHolder.getContext().getAuthentication().getName();

        Reservation res = reservationRepository.findByCodeTicket(codeTicket)
                .orElseThrow(() -> new RuntimeException("Ticket invalide ou inexistant."));

        if (!res.getTrajet().getChauffeur().getEmail().equals(emailChauffeur)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ce ticket n'est pas pour votre véhicule.");
        }

        if ("ATTENTE_PAIEMENT".equals(res.getStatut())) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body("Le paiement n'a pas été confirmé. Le passager doit d'abord payer à l'agence.");
        }

        if ("EMBARQUE".equals(res.getStatut())) {
            return ResponseEntity.badRequest().body("Ce ticket a déjà été utilisé pour l'embarquement.");
        }

        res.setStatut("EMBARQUE");
        reservationRepository.save(res);

        return ResponseEntity.ok(Map.of(
                "message", "Accès autorisé !",
                "nomPassager", res.getClient().getNom(),
                "siege", res.getNumeroSiege()
        ));
    }

    @PostMapping("/scanner-ticket")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> scanTicket(@PathVariable String codeTicket) {
        try {
            Reservation res = reservationRepository.findByCodeTicket(codeTicket)
                    .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

            if ("EMBARQUE".equals(res.getStatut())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Ce ticket a déjà été scanné et le passager est déjà en voiture.");
            }

            res.setStatut("EMBARQUE");
            reservationRepository.save(res);

            String messageNotification = "Bonjour " + res.getClient().getNom() +
                    ", votre ticket " + res.getCodeTicket() + " a été scanné avec succès. Bon voyage à bord ! 🚀";

            reservationService.notifierLeClient(res.getClient(), messageNotification);

            return ResponseEntity.ok(Map.of(
                    "message", "Embarquement validé avec succès ! Le passager est maintenant enregistré 'En voiture'.",
                    "statut", "EMBARQUE",
                    "client", res.getClient().getNom(),
                    "siege", res.getNumeroSiege()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/mon-historique")
    public ResponseEntity<?> getMonHistorique() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Accès refusé : Token JWT manquant, expiré ou invalide.");
            }

            String emailConnecte = auth.getName();
            User client = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'email : " + emailConnecte));

            List<Reservation> reservations = reservationRepository.findByClientId(client.getId());

            List<HistoriqueVoyageDTO> historique = reservations.stream().map(res -> {
                HistoriqueVoyageDTO dto = new HistoriqueVoyageDTO();
                dto.setId(res.getId());
                dto.setDateReservation(res.getDateReservation());
                dto.setStatutPaiement(res.getStatut());

                // 💸 CORRECTION DU MONTANT TOTAL :
                // Si montantPaye est à 0 ou null (non encore payé), on prend le prix de base de la réservation/trajet
                double prixDeBase = 0.0;
                if (res.getMontantPaye() != null && res.getMontantPaye() > 0) {
                    prixDeBase = res.getMontantPaye();
                } else if (res.getTrajet() != null && res.getTrajet().getPrix() != null) {
                    prixDeBase = res.getTrajet().getPrix();
                }
                dto.setMontantTotal(prixDeBase);

                if (res.getTrajet() != null) {
                    dto.setVilleDepart(res.getTrajet().getDepart());
                    dto.setVilleArrivee(res.getTrajet().getDestination());
                    dto.setHeureDepart(res.getTrajet().getDateHeureDepart() != null ? res.getTrajet().getDateHeureDepart().toString() : "N/A");
                } else {
                    dto.setVilleDepart("N/A");
                    dto.setVilleArrivee("N/A");
                    dto.setHeureDepart("N/A");
                }

                Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findFirstByReservationId(res.getId());
                if (demandeOpt.isPresent()) {
                    DemandeRecuperation dm = demandeOpt.get();
                    dto.setTypeReservation("VID"); // Aligné avec ton filtre React 'VID' / 'VIP'
                    dto.setAdresseRamassage(dm.getAdresseTextuelle());
                    dto.setPrixSupplementaire(dm.getPrixSupplementaire() != null ? dm.getPrixSupplementaire() : 0.0);
                } else {
                    dto.setTypeReservation("NORMAL");
                    dto.setAdresseRamassage(null);
                    dto.setPrixSupplementaire(0.0);
                }

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(historique);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur lors du chargement de l'historique : " + e.getMessage());
        }
    }
    /**
     * 🏁 FINALISER UNE RÉSERVATION (Paiement Global)
     * Gère les requêtes PUT envoyées par React depuis la page de paiement
     */
    @PutMapping("/{id}/finaliser")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> finaliserReservation(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        try {
            Reservation reservationMiseAJour = reservationService.finaliserPaiementGlobal(id, payload);

            return ResponseEntity.ok(Map.of(
                    "message", "Réservation finalisée et payée avec succès.",
                    "reservation", reservationMiseAJour
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la finalisation : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la finalisation : " + e.getMessage()));
        }
    }

    /**
     * 💵 ENCAISSER LE PAIEMENT PHYSIQUE AU GUICHET (Côté Agence)
     * Gère les requêtes PUT ou POST vers /api/reservations/{id}/encaisser
     */
    @PutMapping("/{id}/encaisser")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> encaisserAuGuichet(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        try {
            // On utilise la logique globale sécurisée existante pour passer le statut à PAYE
            Reservation reservationMiseAJour = reservationService.finaliserPaiementGlobal(id, payload);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "💰 Argent encaissé avec succès. Le statut de la réservation est maintenant : PAYE.",
                    "reservation", reservationMiseAJour
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'encaissement au guichet : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'encaissement : " + e.getMessage()));
        }
    }

    /**
     * 💵 ENREGISTRER L'INTENTION DE PAIEMENT EN CASH (Côté Client)
     * Cet endpoint accepte la déclaration du client sans toucher au statut de la réservation.
     * Seul l'AGENCY_MANAGER pourra changer le statut lors du paiement physique.
     */
    @PostMapping("/{id}/intention-cash")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> enregistrerIntentionCash(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            // 1. Vérifier si la réservation existe
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Réservation introuvable"));

            // 2. Optionnel : Log ou persistence de l'intention dans un historique si nécessaire
            System.out.println("💵 [INTENTION CASH] Le client " + reservation.getClient().getNom()
                    + " a déclaré vouloir payer la réservation N°" + id + " au guichet.");

            // 3. Retourner une réponse positive au client SANS modifier le statut de la réservation
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre choix de paiement en espèces a été enregistré. Veuillez vous présenter au guichet de l'agence pour régler votre facture."
            ));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'enregistrement de l'intention : " + e.getMessage()));
        }
    }
}
