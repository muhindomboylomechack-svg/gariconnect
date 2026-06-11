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

    /**
     * ➕ Créer une réservation simple
     * Résout l'erreur 403 en s'alignant sur l'URL appelée par le Frontend (/creer-simple)
     */

    @PostMapping("/creer")
    public ResponseEntity<?> creerReservation(@RequestBody Reservation reservation) {
        try {
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
            // CORRECTION : On appelle le SERVICE (qui contient la notif) et non le REPOSITORY !
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

    /**
     * 🔍 Récupérer une réservation spécifique par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> recupererParId(@PathVariable Long id) {
        try {
            Reservation reservation = reservationService.recupererParId(id);
            return ResponseEntity.ok(reservation);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 🚗 Récupérer le voyage actif/éligible du client connecté
     * Résout l'erreur 400 en s'alignant sur l'URL appelée par le Frontend (/mon-voyage-actif)
     */
    @GetMapping("/mon-voyage-actif")
    public ResponseEntity<?> getVoyageEligible() {
        try {
            // Récupération de l'utilisateur connecté via son jeton JWT
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Récupération de l'historique des réservations du client
            List<Reservation> mesReservations = reservationService.recupererParClient(user.getId());
            LocalDateTime limite48h = LocalDateTime.now().minusHours(48);

            // Application des filtres pour identifier le voyage actif
            Reservation voyageEligible = mesReservations.stream()
                    .filter(res -> res.getTrajet() != null)
                    .filter(res -> "CONFIRMEE".equals(res.getStatut())) // Doit être confirmée/payée
                    .filter(res -> {
                        String statutTrajet = res.getTrajet().getStatut();

                        // Cas 1 : Le trajet est actuellement en cours (ex: EN_ROUTE)
                        if ("EN_ROUTE".equals(statutTrajet)) {
                            return true;
                        }

                        // Cas 2 : Le trajet est terminé depuis moins de 48 heures
                        if ("TERMINE".equals(statutTrajet)) {
                            LocalDateTime dateReference = res.getTrajet().getUpdatedAt();
                            // Si la date de mise à jour est absente, on accepte par défaut
                            return (dateReference == null) || dateReference.isAfter(limite48h);
                        }
                        return false;
                    })
                    .findFirst()
                    .orElse(null);

            // Retourne le voyage trouvé (200 OK) ou un contenu vide (204 No Content)
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

    /**
     * 📝 Modifier les détails de la réservation (ex: Siège) (Déclenche une notification)
     */
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

        // 1. Récupérer la réservation
        Reservation res = reservationRepository.findByCodeTicket(codeTicket)
                .orElseThrow(() -> new RuntimeException("Ticket invalide ou inexistant."));

        // 2. Vérifier si le chauffeur est bien celui du trajet
        if (!res.getTrajet().getChauffeur().getEmail().equals(emailChauffeur)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ce ticket n'est pas pour votre véhicule.");
        }

        // 3. VÉRIFICATION DU PAIEMENT (Le cœur du problème)
        // Nous vérifions si le statut n'est pas "ATTENTE_PAIEMENT"
        if ("ATTENTE_PAIEMENT".equals(res.getStatut())) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body("Le paiement n'a pas été confirmé. Le passager doit d'abord payer à l'agence.");
        }

        // 4. Vérifier si le ticket n'a pas déjà été scanné (Déjà validé)
        if ("EMBARQUE".equals(res.getStatut())) {
            return ResponseEntity.badRequest().body("Ce ticket a déjà été utilisé pour l'embarquement.");
        }

        // 5. Tout est OK : Valider l'embarquement
        res.setStatut("EMBARQUE"); // On change le statut pour marquer l'entrée
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

            // Changer le statut en "EMBARQUE"
            res.setStatut("EMBARQUE");
            reservationRepository.save(res);

            // Alerte Appli + Envoi WhatsApp automatique via le service
            String messageNotification = "Bonjour " + res.getClient().getNom() +
                    ", votre ticket " + res.getCodeTicket() + " a été scanné avec succès. Bon voyage à bord ! 🚀";

            reservationService.notifierLeClient(res.getClient(), messageNotification);

            System.out.println("🎉 [SCAN TICKET] Statut mis à jour à EMBARQUE et notification envoyée pour le client ID : " + res.getClient().getId());

            return ResponseEntity.ok(Map.of(
                    "message", "Embarquement validé avec succès ! Le passager est maintenant enregistré 'En voiture'.",
                    "statut", "EMBARQUE",
                    "client", res.getClient().getNom(),
                    "siege", res.getNumeroSiege()
            ));

        } catch (Exception e) {
            System.err.println("❌ ERREUR SCANNER TICKET : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    /**
     * 🏁 FINALISER UNE RÉSERVATION (Paiement Normal)
     * Gère les requêtes PATCH envoyées par React depuis CheckoutPage
     */
    @RequestMapping(value = "/{id}/finaliser", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> finaliserReservation(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        try {
            // Mise à jour du statut de la réservation via le service
            // Le statut passe à "PAYE" ou "VALIDEE" selon votre logique métier
            Reservation reservationMiseAJour = reservationService.mettreAJourStatut(id, "PAYE");

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
    @GetMapping("/mon-historique")
    public ResponseEntity<?> getMonHistorique() {
        try {
            // 1. Récupération de l'objet d'authentification
            var auth = SecurityContextHolder.getContext().getAuthentication();

            // 2. Blocage définitif d'anonymousUser (Token manquant ou expiré)
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Accès refusé : Token JWT manquant, expiré ou invalide.");
            }

            String emailConnecte = auth.getName();

            // 3. Recherche du client en base de données
            User client = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'email : " + emailConnecte));

            // 4. Récupération des réservations liées au client
            List<Reservation> reservations = reservationRepository.findByClientId(client.getId());

            // 5. Transformation des réservations en HistoriqueVoyageDTO
            List<HistoriqueVoyageDTO> historique = reservations.stream().map(res -> {
                HistoriqueVoyageDTO dto = new HistoriqueVoyageDTO();
                dto.setId(res.getId());
                dto.setDateReservation(res.getDateReservation());
                dto.setMontantTotal(res.getMontantPaye());
                dto.setStatutPaiement(res.getStatut());

                // Sécurité anti-NullPointerException si un trajet est mal configuré
                if (res.getTrajet() != null) {
                    dto.setVilleDepart(res.getTrajet().getDepart());
                    dto.setVilleArrivee(res.getTrajet().getDestination());
                    dto.setHeureDepart(res.getTrajet().getDateHeureDepart() != null ? res.getTrajet().getDateHeureDepart().toString() : "N/A");
                } else {
                    dto.setVilleDepart("N/A");
                    dto.setVilleArrivee("N/A");
                    dto.setHeureDepart("N/A");
                }


                // On change findByReservationId par findFirstByReservationId
                Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findFirstByReservationId(res.getId());
                if (demandeOpt.isPresent()) {
                    DemandeRecuperation dm = demandeOpt.get();
                    dto.setTypeReservation("VIP");
                    dto.setAdresseRamassage(dm.getAdresseTextuelle());
                    dto.setPrixSupplementaire(dm.getPrixSupplementaire() != null ? dm.getPrixSupplementaire() : 0.0);
                } else {
                    dto.setTypeReservation("NORMAL");
                    dto.setAdresseRamassage(null);
                    dto.setPrixSupplementaire(0.0);
                }

                return dto;
            }).collect(Collectors.toList());

            // 6. Retourner la liste au Frontend React avec un code 200 OK
            return ResponseEntity.ok(historique);

        } catch (Exception e) {
            // Log précis dans la console d'IntelliJ pour ton débogage personnel
            System.err.println("❌ Erreur dans getMonHistorique : " + e.getMessage());
            e.printStackTrace();

            // Réponse propre au frontend pour éviter de figer l'interface en cas d'autre problème
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur lors du chargement de l'historique : " + e.getMessage());
        }
    }
}