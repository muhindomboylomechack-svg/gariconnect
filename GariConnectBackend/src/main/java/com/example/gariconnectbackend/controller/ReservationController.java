package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import com.example.gariconnectbackend.service.ReservationService;
import com.example.gariconnectbackend.dto.PassagerDTO;
import com.example.gariconnectbackend.dto.HistoriqueVoyageDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private TrajetRepository trajetRepository;
    @Autowired
    private ArretBusRepository arretBusRepository;
    @Autowired
    private DemandeRecuperationRepository demandeRecuperationRepository;

    /**
     * 🟢 1. CRÉATION DE LA RÉSERVATION UNIFIÉE (STANDARD OU VIP + ARRÊT DE BUS)
     */
    @PostMapping("/creer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> creerReservation(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Mapping et vérification du Trajet
            Map<String, Object> trajetMap = (Map<String, Object>) payload.get("trajet");
            if (trajetMap == null || trajetMap.get("id") == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'ID du trajet est obligatoire."));
            }
            Long trajetId = Long.valueOf(trajetMap.get("id").toString());

            Trajet trajet = trajetRepository.findById(trajetId)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

            // 2. Identification du Client connecté
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User client = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            // 3. Vérification des places disponibles
            int nombrePlaces = payload.containsKey("nombrePlaces") && payload.get("nombrePlaces") != null
                    ? Integer.parseInt(payload.get("nombrePlaces").toString())
                    : 1;

            if (trajet.getPlacesDisponibles() < nombrePlaces) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Désolé, il ne reste que " + trajet.getPlacesDisponibles() + " place(s) disponible(s)."));
            }

            // 4. Initialisation de la Réservation
            Reservation reservation = new Reservation();
            reservation.setTrajet(trajet);
            reservation.setClient(client);
            reservation.setDateReservation(LocalDateTime.now());
            reservation.setNombrePlaces(nombrePlaces);
            reservation.setStatut("EN_ATTENTE_DE_PAIEMENT");
            reservation.setEstPaye(false);
            reservation.setMontantPaye(0.0);
            reservation.setCodeTicket("TICK-" + System.currentTimeMillis());

            // 🟢 Initialisation forcée du statut d'embarquement à l'arrêt
            reservation.setStatutEmbarquement(StatutPassagerArret.EN_ATTENTE_A_L_ARRET);

            // 🟢 5. INTÉGRATION DE L'ARRÊT DE BUS (Fusion de l'ancienne méthode)
            if (payload.get("arretMontageId") != null && !payload.get("arretMontageId").toString().isEmpty()) {
                Long arretId = Long.valueOf(payload.get("arretMontageId").toString());
                ArretBus arret = arretBusRepository.findById(arretId).orElse(null);
                reservation.setArretMontage(arret);
            } else if (payload.get("arretMontage") != null && payload.get("arretMontage") instanceof Map) {
                Map<String, Object> arretMap = (Map<String, Object>) payload.get("arretMontage");
                if (arretMap.get("id") != null) {
                    Long arretId = Long.valueOf(arretMap.get("id").toString());
                    ArretBus arret = arretBusRepository.findById(arretId).orElse(null);
                    reservation.setArretMontage(arret);
                }
            }

            // 6. Gestion du Type de Réservation et du Siège
            String typeRes = payload.containsKey("typeReservation") ? payload.get("typeReservation").toString() : "STANDARD";
            reservation.setTypeReservation(typeRes);

            if (payload.containsKey("numeroSiege") && payload.get("numeroSiege") != null) {
                reservation.setNumeroSiege(Integer.valueOf(payload.get("numeroSiege").toString()));
            } else {
                reservation.setNumeroSiege(1);
            }

            // 7. Mise à jour des places du trajet
            trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - nombrePlaces);
            trajetRepository.save(trajet);

            // 8. Calcul des Finances (Commissions)
            double prixUnitaire = trajet.getPrix() != null ? trajet.getPrix() : 0.0;
            double prixTotalBillet = prixUnitaire * nombrePlaces;
            reservation.setMontantCommission(prixTotalBillet * 0.10);
            reservation.setPartAgence(prixTotalBillet * 0.90);

            // 💾 SAUVEGARDE PRINCIPALE DE LA RÉSERVATION
            Reservation savedReservation = reservationRepository.save(reservation);

            // 🟢 9. LOGIQUE VIP : Gestion de la demande de récupération
            if ("VIP".equalsIgnoreCase(typeRes)) {
                DemandeRecuperation demande = new DemandeRecuperation();
                demande.setReservation(savedReservation);
                demande.setClient(client);
                demande.setReservationId(savedReservation.getId());

                String adresse = (payload.containsKey("adresseRecuperation") && payload.get("adresseRecuperation") != null)
                        ? payload.get("adresseRecuperation").toString()
                        : "Adresse non spécifiée";
                demande.setAdresseTextuelle(adresse);

                Double cout = 0.0;
                if (payload.containsKey("coutRecuperation") && payload.get("coutRecuperation") != null) {
                    cout = Double.valueOf(payload.get("coutRecuperation").toString());
                }
                demande.setPrixSupplementaire(cout);

                Double lat = 0.0;
                Double lon = 0.0;
                if (payload.containsKey("latitude") && payload.get("latitude") != null) {
                    lat = Double.valueOf(payload.get("latitude").toString());
                }
                if (payload.containsKey("longitude") && payload.get("longitude") != null) {
                    lon = Double.valueOf(payload.get("longitude").toString());
                }
                demande.setLatitudeClient(lat);
                demande.setLongitudeClient(lon);

                demande.setStatut(StatutRecuperation.EN_ATTENTE_COTATION);

                demandeRecuperationRepository.save(demande);

                // Attacher la demande à la réservation renvoyée au frontend
                savedReservation.setDemandeRecuperation(demande);
            }

            return ResponseEntity.ok(savedReservation);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
    /**
     * 💵 2. ENCAISSER LE PAIEMENT
     */
    @PutMapping("/{id}/encaisser")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> encaisserAuGuichet(@PathVariable Long id) {
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

            reservation.setStatut("PAYE");
            reservation.setEstPaye(true);
            reservation.setMontantPaye(reservation.getMontantTotal());

            reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "💰 Argent encaissé avec succès par l'agent. Le statut est maintenant : PAYE.",
                    "reservation", reservation
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'encaissement : " + e.getMessage()));
        }
    }

    /**
     * 💵 3. INTENTION DE PAYER EN CASH
     */
    @PostMapping("/{id}/intention-cash")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> enregistrerIntentionCash(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Réservation introuvable"));

            if (payload.containsKey("modePaiement")) {
                reservation.setModePaiement(payload.get("modePaiement").toString());
                reservationRepository.save(reservation);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre intention de paiement en espèces a été enregistrée. Le statut reste en attente de paiement."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur : " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> annulerReservation(@PathVariable Long id) {
        try {
            reservationService.annulerReservation(id);
            return ResponseEntity.ok(Map.of("message", "Réservation annulée avec succès"));
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
                        if ("EN_ROUTE".equals(statutTrajet)) return true;
                        if ("TERMINE".equals(statutTrajet)) {
                            LocalDateTime dateReference = res.getTrajet().getUpdatedAt();
                            return (dateReference == null) || dateReference.isAfter(limite48h);
                        }
                        return false;
                    })
                    .findFirst()
                    .orElse(null);

            return voyageEligible != null ? ResponseEntity.ok(voyageEligible) : ResponseEntity.noContent().build();

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

        if ("ATTENTE_PAIEMENT".equals(res.getStatut()) || "EN_ATTENTE_DE_PAIEMENT".equals(res.getStatut())) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body("Le paiement n'a pas été confirmé. Le passager doit d'abord payer à l'agence.");
        }

        if ("EMBARQUE".equals(res.getStatut())) {
            return ResponseEntity.badRequest().body("Ce ticket a déjà été utilisé pour l'embarquement.");
        }

        res.setStatut("EMBARQUE");
        reservationRepository.save(res);

        return ResponseEntity.ok(Map.of("message", "Accès autorisé !", "nomPassager", res.getClient().getNom(), "siege", res.getNumeroSiege()));
    }

    @PostMapping("/scanner-ticket")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> scanTicket(@PathVariable String codeTicket) {
        try {
            Reservation res = reservationRepository.findByCodeTicket(codeTicket)
                    .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

            if ("EMBARQUE".equals(res.getStatut())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Ce ticket a déjà été scanné.");
            }

            res.setStatut("EMBARQUE");
            reservationRepository.save(res);

            String msg = "Bonjour " + res.getClient().getNom() + ", votre ticket " + res.getCodeTicket() + " a été scanné avec succès. Bon voyage ! 🚀";
            reservationService.notifierLeClient(res.getClient(), msg);

            return ResponseEntity.ok(Map.of("message", "Embarquement validé !", "statut", "EMBARQUE", "client", res.getClient().getNom()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 🔍 HISTORIQUE DES VOYAGES DU CLIENT CONNECTÉ
     * Proprement délégué au ReservationService
     */
    @GetMapping("/mon-historique")
    public ResponseEntity<?> getMonHistorique() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Accès refusé token invalide.");
            }

            String emailConnecte = auth.getName();

            // Délégation au service pour récupérer l'historique mappé avec le nombre de places
            List<HistoriqueVoyageDTO> historique = reservationService.obtenirHistoriqueClient(emailConnecte);

            return ResponseEntity.ok(historique);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("erreur", "Erreur : " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/finaliser")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> finaliserReservation(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        try {
            Reservation reservationMiseAJour = reservationService.finaliserPaiementGlobal(id, payload);
            return ResponseEntity.ok(Map.of("message", "Réservation finalisée.", "reservation", reservationMiseAJour));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur : " + e.getMessage()));
        }
    }

}
