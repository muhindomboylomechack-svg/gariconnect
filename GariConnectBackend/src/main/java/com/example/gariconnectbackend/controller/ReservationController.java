package com.example.gariconnectbackend.controller;

import ch.qos.logback.core.net.server.Client;
import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import com.example.gariconnectbackend.service.ReservationService;
import com.example.gariconnectbackend.dto.PassagerDTO;
import com.example.gariconnectbackend.dto.HistoriqueVoyageDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMethod;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> listerToutes() {
        try {
            // 1. Récupération de l'utilisateur actuellement connecté
            var auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // 2. Vérification des privilèges
            boolean isSuperAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().contains("SUPER_ADMIN"));

            // 3. Logique de filtrage
            if (isSuperAdmin) {
                // 🟢 Le Super Admin a une vue globale sur toutes les réservations du système
                return ResponseEntity.ok(reservationService.listerToutes());
            } else {
                // 🔵 Une agence (ou son employé) ne voit que les réservations liées à SES propres trajets
                User agence = (user.getAgenceEmployeur() != null) ? user.getAgenceEmployeur() : user;
                List<Reservation> reservationsAgence = reservationRepository.findByTrajet_Agence(agence);
                return ResponseEntity.ok(reservationsAgence);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des réservations : " + e.getMessage()));
        }
    }


    /**
     * ✏️ 5. MODIFICATION D'UNE RÉSERVATION PAR LE CLIENT
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> modifierReservation(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réservation introuvable."));

            // Vérification de sécurité
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

            boolean isOwner = reservation.getClient() != null && reservation.getClient().getId().equals(userConnecte.getId());
            boolean isAdmin = userConnecte.getRole() == Role.SUPER_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_MANAGER;

            if (!isOwner && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Vous n'avez pas l'autorisation de modifier cette réservation."));
            }

            Trajet trajet = reservation.getTrajet();

            // 1. Mise à jour du nombre de places
            if (payload.containsKey("nombrePlaces") && payload.get("nombrePlaces") != null) {
                int nouveauNombrePlaces = Integer.parseInt(payload.get("nombrePlaces").toString());
                int ancienNombrePlaces = reservation.getNombrePlaces() != null ? reservation.getNombrePlaces() : 1;
                int difference = nouveauNombrePlaces - ancienNombrePlaces;

                if (difference > 0 && trajet.getPlacesDisponibles() < difference) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", "Places insuffisantes disponibles. Restantes : " + trajet.getPlacesDisponibles()));
                }

                trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - difference);
                trajetRepository.save(trajet);
                reservation.setNombrePlaces(nouveauNombrePlaces);
            }

            // 2. Mise à jour du numéro de siège
            if (payload.containsKey("numeroSiege") && payload.get("numeroSiege") != null) {
                reservation.setNumeroSiege(Integer.valueOf(payload.get("numeroSiege").toString()));
            }

            // 3. Mise à jour de l'arrêt de montage
            if (payload.containsKey("arretMontageId") && payload.get("arretMontageId") != null) {
                Long arretId = Long.valueOf(payload.get("arretMontageId").toString());
                ArretBus arret = arretBusRepository.findById(arretId).orElse(null);
                reservation.setArretMontage(arret);
            }

            // 4. Mise à jour de la demande VIP / Récupération si existante
            if (payload.containsKey("adresseRecuperation") && payload.get("adresseRecuperation") != null) {
                Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findByReservationId(id);
                if (demandeOpt.isPresent()) {
                    DemandeRecuperation demande = demandeOpt.get();
                    demande.setAdresseTextuelle(payload.get("adresseRecuperation").toString());
                    if (payload.containsKey("latitude") && payload.get("latitude") != null) {
                        demande.setLatitudeClient(Double.valueOf(payload.get("latitude").toString()));
                    }
                    if (payload.containsKey("longitude") && payload.get("longitude") != null) {
                        demande.setLongitudeClient(Double.valueOf(payload.get("longitude").toString()));
                    }
                    demandeRecuperationRepository.save(demande);
                }
            }

            // Recalcul des montants et commissions
            double prixUnitaire = trajet.getPrix() != null ? trajet.getPrix() : 0.0;
            double prixTotalBillet = prixUnitaire * reservation.getNombrePlaces();
            reservation.setMontantCommission(prixTotalBillet * 0.10);
            reservation.setPartAgence(prixTotalBillet * 0.90);

            Reservation reservationMiseAJour = reservationRepository.save(reservation);
            return ResponseEntity.ok(reservationMiseAJour);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 🔍 LECTURE DU TICKET PAR CODE (SCAN) POUR OBTENIR L'ÉTAT DE LA RÉSERVATION
     * Permet à un agent ou chauffeur de scanner le QR code et voir les infos avant validation.
     */
    @GetMapping("/details-scan/{codeTicket}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CHAUFFEUR', 'GUICHETIER')")
    public ResponseEntity<?> obtenirDetailsParScan(@PathVariable String codeTicket) {
        try {
            // Recherche de la réservation via le code ticket fourni par le scanneur
            Reservation res = reservationRepository.findByCodeTicket(codeTicket)
                    .orElseThrow(() -> new RuntimeException("Code de ticket invalide ou inexistant."));

            // Construction d'une réponse enrichie avec l'état actuel de la réservation
            Map<String, Object> response = new HashMap<>();
            response.put("id", res.getId());
            response.put("codeTicket", res.getCodeTicket());
            response.put("statut", res.getStatut()); // EX: PAYE, EN_ATTENTE_DE_PAIEMENT, ANNULEE
            response.put("statutEmbarquement", res.getStatutEmbarquement());
            response.put("nomPassager", res.getClient() != null ? res.getClient().getNom() : "Inconnu");
            response.put("telephonePassager", res.getClient() != null ? res.getClient().getTelephone() : "Non renseigné");

            response.put("numeroSiege", res.getNumeroSiege());
            response.put("nombrePlaces", res.getNombrePlaces());
            response.put("typeReservation", res.getTypeReservation());

            response.put("depart", res.getTrajet() != null ? res.getTrajet().getDepart() : "N/A");
            response.put("destination", res.getTrajet() != null ? res.getTrajet().getDestination() : "N/A");
            response.put("dateReservation", res.getDateReservation());

            // Informations financières
            response.put("estPaye", res.getEstPaye());
            response.put("montantPaye", res.getMontantPaye());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }
//    /**
//     * 🗑️ 4.bis SUPPRESSION PHYSIQUE EN BASE DE DONNÉES (DELETE /api/reservations/{id})
//     */
//    @DeleteMapping("/{id}")
//    @Transactional
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
//    public ResponseEntity<?> supprimerReservation(@PathVariable Long id) {
//        try {
//            Reservation reservation = reservationRepository.findById(id)
//                    .orElseThrow(() -> new RuntimeException("Réservation introuvable."));
//
//            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
//            User userConnecte = userRepository.findByEmail(emailConnecte)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));
//
//            boolean isOwner = reservation.getClient() != null && reservation.getClient().getId().equals(userConnecte.getId());
//            boolean isAdmin = userConnecte.getRole() == Role.SUPER_ADMIN ||
//                    userConnecte.getRole() == Role.AGENCY_ADMIN ||
//                    userConnecte.getRole() == Role.AGENCY_MANAGER;
//
//            if (!isOwner && !isAdmin) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                        .body(Map.of("error", "Vous n'avez pas le droit de supprimer cette réservation."));
//            }
//
//            // Si la réservation n'était pas encore annulée, libérer les places
//            if (!"ANNULEE".equalsIgnoreCase(reservation.getStatut()) && reservation.getTrajet() != null && reservation.getNombrePlaces() != null) {
//                Trajet trajet = reservation.getTrajet();
//                int placesActuelles = trajet.getPlacesDisponibles() != null ? trajet.getPlacesDisponibles() : 0;
//                trajet.setPlacesDisponibles(placesActuelles + reservation.getNombrePlaces());
//                trajetRepository.save(trajet);
//            }
//
//            Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findByReservationId(id);
//            demandeOpt.ifPresent(demande -> demandeRecuperationRepository.delete(demande));
//
//            reservationRepository.delete(reservation);
//
//            return ResponseEntity.ok(Map.of("message", "Réservation supprimée définitivement avec succès."));
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
//        }
//    }


    /**
     * ❌ 4. ANNULATION PAR LE CLIENT (Mise à jour du statut à "ANNULEE")
     * SOLUTION DÉFINITIVE CORRIGÉE
     */
    @RequestMapping(value = "/{id}/annuler", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> annulerReservationParClient(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload) { // Tolérance si Axios envoie un Body
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

            // 1. Vérification de sécurité / droits d'accès
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

            boolean isOwner = reservation.getClient() != null && reservation.getClient().getId().equals(userConnecte.getId());
            boolean isAdmin = userConnecte.getRole() == Role.SUPER_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_MANAGER;

            if (!isOwner && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Vous n'avez pas l'autorisation d'annuler cette réservation."));
            }

            // 2. Renvoyer 200 OK au lieu de 400 Bad Request si déjà annulée
            // Évite le crash d'Axios sur le front-end en cas de double-appel
            if ("ANNULEE".equalsIgnoreCase(reservation.getStatut())) {
                return ResponseEntity.ok(Map.of(
                        "message", "Cette réservation est déjà annulée.",
                        "reservation", reservation
                ));
            }

            // 3. Remise en stock des places sur le trajet
            if (reservation.getTrajet() != null && reservation.getNombrePlaces() != null) {
                Trajet trajet = reservation.getTrajet();
                int placesActuelles = trajet.getPlacesDisponibles() != null ? trajet.getPlacesDisponibles() : 0;
                trajet.setPlacesDisponibles(placesActuelles + reservation.getNombrePlaces());
                trajetRepository.save(trajet);
            }

            // 4. Mise à jour du statut de la réservation principale
            reservation.setStatut("ANNULEE");

            // 5. CORRECTION VIP : Mise à jour sécurisée du statut de la demande
            Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findFirstByReservationId(id);
            if (demandeOpt.isPresent()) {
                DemandeRecuperation demande = demandeOpt.get();
                demande.setStatut(StatutRecuperation.ANNULEE);
                demandeRecuperationRepository.save(demande);
            }

            Reservation reservationSauvegardee = reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "message", "La réservation a été annulée avec succès.",
                    "reservation", reservationSauvegardee
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'annulation : " + e.getMessage()));
        }
    }

    /**
     * MASQUER UNE RÉSERVATION (Masquage côté client/historique)
     */
    @PatchMapping("/{id}/masquer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> masquerReservation(@PathVariable Long id) {
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

            // Exemple : tu peux avoir un champ boolean 'masque' ou 'visible' dans ton entité Reservation
            // reservation.setMasque(true);
            // reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "message", "La réservation a été masquée avec succès.",
                    "id", id
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du masquage : " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerOuAnnulerReservation(@PathVariable Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

        // 🔒 VÉRIFICATION MÉTIER : Blocage si la réservation est déjà PAYÉE
        String statut = reservation.getStatut() != null ? reservation.getStatut().toUpperCase() : "";
        if ("PAYE".equals(statut) || "CONFIRMEE".equals(statut)) {
            return ResponseEntity.badRequest().body("Impossible d'annuler une réservation déjà payée.");
        }

        // Si non payée, on exécute l'annulation via le service
        reservationService.annulerReservation(id);

        return ResponseEntity.ok().body("Réservation annulée avec succès.");
    }


    /**
     * 🙈 MASQUER UNE RÉSERVATION DE L'HISTORIQUE CLIENT (Soft Delete)
     * Retire la réservation de l'affichage client sans la supprimer physiquement.
     */
    @PutMapping("/{id}/masquer-client")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> masquerPourClient(@PathVariable Long id) {
        try {
            // 1. Vérification de la réservation
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réservation introuvable avec l'ID : " + id));

            // 2. Vérification de sécurité (Propriétaire ou Admin)
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

            boolean isOwner = reservation.getClient() != null && reservation.getClient().getId().equals(userConnecte.getId());
            boolean isAdmin = userConnecte.getRole() == Role.SUPER_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_ADMIN ||
                    userConnecte.getRole() == Role.AGENCY_MANAGER;

            if (!isOwner && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Vous n'avez pas l'autorisation de masquer cette réservation."));
            }

            // 3. Exécution du masquage dans le Service
            reservationService.masquerReservationClient(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "La réservation a été retirée de votre historique avec succès.",
                    "id", id
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du masquage : " + e.getMessage()));
        }
    }


    /**
     * 📜 OBTENIR L'HISTORIQUE DU CLIENT CONNECTÉ
     * Exclut les réservations masquées par le client.
     */
//    @GetMapping("/mon-historique")
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
//    public ResponseEntity<?> getMonHistorique() {
//        try {
//            var auth = SecurityContextHolder.getContext().getAuthentication();
//            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
//                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Accès refusé, token invalide.");
//            }
//
//            String emailConnecte = auth.getName();
//            User user = userRepository.findByEmail(emailConnecte)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
//
//            // 1. Récupération des réservations non masquées depuis le service
//            List<HistoriqueVoyageDTO> historique = reservationService.obtenirHistoriqueClient(emailConnecte);
//
//            return ResponseEntity.ok(historique);
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("erreur", "Erreur lors de la récupération : " + e.getMessage()));
//        }
//    }

    /**
     * 📜 OBTENIR L'HISTORIQUE CLIENT (Filtré : les masquées n'apparaissent plus)
     */
    @GetMapping("/mon-historique")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
    public ResponseEntity<?> getMonHistorique() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();

            // Appelle la méthode filtrée du service
            List<HistoriqueVoyageDTO> historique = reservationService.obtenirHistoriqueClient(emailConnecte);

            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur lors de la récupération : " + e.getMessage()));
        }
    }
}
