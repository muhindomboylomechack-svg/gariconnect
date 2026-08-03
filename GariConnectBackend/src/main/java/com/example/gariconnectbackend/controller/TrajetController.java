//package com.example.gariconnectbackend.controller;
//
//import com.example.gariconnectbackend.dto.PositionDTO;
//import com.example.gariconnectbackend.dto.TrajetDTO;
//import com.example.gariconnectbackend.model.*;
//import com.example.gariconnectbackend.repository.TrajetRepository;
//import com.example.gariconnectbackend.repository.UserRepository;
//import com.example.gariconnectbackend.repository.VehiculeRepository;
//import com.example.gariconnectbackend.service.TrajetService;
//import jakarta.persistence.EntityNotFoundException;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpStatus;
//import com.example.gariconnectbackend.repository.CourrierRepository;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.*;
//import java.util.stream.Collectors;
//
//@RestController
//@RequestMapping("/api/trajets")
//@CrossOrigin("*")
//public class TrajetController {
//
//    @Autowired
//    private TrajetRepository trajetRepository;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private TrajetService trajetService;
//    @Autowired
//    private CourrierRepository courrierRepository;
//    @Autowired
//    private VehiculeRepository vehiculeRepository;
////
//
//    // =========================================================================
//    // 1. ENDPOINT PUBLIC (Pour la page d'accueil Home.jsx - Sans restriction)
//    // =========================================================================
//    @GetMapping("/tous")
//   public ResponseEntity<?> obtenirTousLesTrajets() {
//        try {
//            // 🟢 L'endpoint est maintenant 100% PUBLIC.
//            // On ne cherche plus à récupérer un utilisateur connecté,
//            // ce qui empêche le rejet (403) ou le crash (500) pour les simples visiteurs de l'application.
//
//            List<Trajet> trajets = trajetRepository.findAll();
//
//            return ResponseEntity.ok(trajets);
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur lors du chargement des trajets : " + e.getMessage()));
//        }
//    }
//
//    @PostMapping
//    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> creerTrajet(@RequestBody Trajet trajet) {
//        try {
//            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));
//
//            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
//                    ? utilisateurConnecte.getId()
//                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Création impossible : Agence de rattachement introuvable.");
//            }
//
//            Trajet nouveauTrajet = trajetService.creerTrajet(trajet, agenceId);
//            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de création : " + e.getMessage());
//        }
//    }
//
//    @PutMapping("/{id}")
//    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet details) {
//        try {
//            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));
//
//            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
//                    ? utilisateurConnecte.getId()
//                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Modification impossible : Agence de rattachement introuvable.");
//            }
//
//            Trajet trajetMisAJour = trajetService.modifierTrajet(id, details, agenceId);
//            return ResponseEntity.ok(trajetMisAJour);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de modification : " + e.getMessage());
//        }
//    }
//
//    @DeleteMapping("/{id}")
//    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
//        try {
//            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));
//
//            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
//                    ? utilisateurConnecte.getId()
//                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Suppression non autorisée.");
//            }
//
//            trajetService.supprimerTrajet(id, agenceId);
//            return ResponseEntity.ok(Map.of("message", "Trajet supprimé avec succès."));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de suppression : " + e.getMessage());
//        }
//    }
//
//    @GetMapping("/mes-chauffeurs")
//   @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> getChauffeursDeMonAgence() {
//        try {
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//            User currentUser = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
//
//            Long agenceId = (currentUser.getRole() == Role.AGENCY_ADMIN)
//                    ? currentUser.getId()
//                    : (currentUser.getAgenceEmployeur() != null ? currentUser.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.badRequest().body("Vous n'êtes rattaché à aucune agence.");
//            }
//
//            List<User> chauffeurs = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
//            return ResponseEntity.ok(chauffeurs);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
//        }
//    }
//
//   @GetMapping("/agence/{agenceId}")
//    public ResponseEntity<List<Trajet>> getTrajetsParAgence(@PathVariable Long agenceId) {
//        List<Trajet> trajets = trajetRepository.findAll().stream()
//                .filter(t -> t.getAgence() != null && t.getAgence().getId().equals(agenceId))
//                .collect(Collectors.toList());
//        return ResponseEntity.ok(trajets);
//    }
//
//
//
//   @GetMapping("/mon-historique")
//    @PreAuthorize("hasRole('CHAUFFEUR')")
//    public ResponseEntity<?> getMonHistoriqueChauffeur() {
//        try {
//            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
//            User chauffeur = userRepository.findByEmail(emailConnecte)
//                    .orElseThrow(() -> new RuntimeException("Votre session est invalide ou le chauffeur n'existe plus."));
//
//            List<Trajet> historiqueTrajets = trajetRepository.findByChauffeurId(chauffeur.getId());
//            return ResponseEntity.ok(historiqueTrajets);
//        } catch (Exception e) {
//            System.err.println("❌ Erreur Historique Chauffeur : " + e.getMessage());
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Impossible de récupérer l'historique : " + e.getMessage()));
//        }
//    }
//
//    @GetMapping("/mon-historique/aujourdhui")
//    8@PreAuthorize("hasRole('CHAUFFEUR')")
//    public ResponseEntity<?> getTrajetsAujourdhuiChauffeur() {
//        try {
//            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
//            User chauffeur = userRepository.findByEmail(emailConnecte)
//                    .orElseThrow(() -> new RuntimeException("Votre session est invalide ou le chauffeur n'existe plus."));
//
//            List<Trajet> trajetsAujourdhui = trajetService.getTrajetsDuJour(chauffeur.getId());
//            return ResponseEntity.ok(trajetsAujourdhui);
//        } catch (Exception e) {
//            System.err.println("❌ Erreur Trajets Aujourd'hui Chauffeur : " + e.getMessage());
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Impossible de récupérer les trajets d'aujourd'hui : " + e.getMessage()));
//        }
//    }
//   @GetMapping("/mes-trajets")
//    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> getTrajetsDeMonAgence() {
//        try {
//            // 1. Récupérer l'email de l'administrateur ou gestionnaire connecté
//            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));
//
//            // 2. Déterminer l'ID de l'agence propriétaire
//            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
//                    ? utilisateurConnecte.getId()
//                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Action non autorisée : vous n'êtes rattaché à aucune agence.");
//            }
//
//            // 3. Récupérer tous les trajets associés à cette agence
//            List<Trajet> trajets = trajetRepository.findByAgenceId(agenceId);
//            return ResponseEntity.ok(trajets);
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Impossible de récupérer les trajets : " + e.getMessage()));
//        }
//    }
//   @GetMapping("/recherche")
//    public ResponseEntity<?> rechercherTrajetsPublics(
//            @RequestParam(required = false) String depart,
//            @RequestParam(required = false) String destination,
//            @RequestParam(required = false) String date) {
//        try {
//            List<Trajet> trajets = trajetRepository.findAll().stream()
//                    .filter(t -> !"TERMINE".equals(t.getStatut()) && !"ANNULE".equals(t.getStatut()))
//                    .filter(t -> depart == null || depart.trim().isEmpty() || (t.getDepart() != null && t.getDepart().toLowerCase().contains(depart.toLowerCase())))
//                    .filter(t -> destination == null || destination.trim().isEmpty() || (t.getDestination() != null && t.getDestination().toLowerCase().contains(destination.toLowerCase())))
//                    // La vérification de date peut être ajoutée ici si besoin
//                    .collect(Collectors.toList());
//
//            List<TrajetDTO> trajetsDTO = trajets.stream()
//                    .map(TrajetDTO::fromEntity)
//                    .collect(Collectors.toList());
//
//            return ResponseEntity.ok(trajetsDTO);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur lors de la recherche : " + e.getMessage()));
//        }
//    }
//
//
//
//    // ✅ SOLUTION : Endpoint principal pour récupérer les trajets
//   @GetMapping
//    public ResponseEntity<List<Trajet>> getAllTrajets() {
//        List<Trajet> trajets = trajetService.getAllTrajets();
//        return ResponseEntity.ok(trajets);
//    }
//
//    // 🔓 Cette méthode reste accessible pour charger un trajet spécifique par son ID
//    @GetMapping("/{id}")
//    public ResponseEntity<?> getTrajetById(@PathVariable Long id) {
//        try {
//            Trajet trajet = trajetRepository.findById(id)
//                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable avec l'ID : " + id));
//
//            return ResponseEntity.ok(TrajetDTO.fromEntity(trajet));
//
//        } catch (EntityNotFoundException e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                    .body(Map.of("message", e.getMessage()));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur lors de la récupération du trajet : " + e.getMessage()));
//        }
//    }
//
//    // ✅ RÉSOUT : Cannot resolve method 'getAgencePourUtilisateur'
//    // Méthode utilitaire privée partagée pour récupérer l'agence d'un utilisateur connecté
//    private User getAgencePourUtilisateur(User utilisateur) {
//        if (utilisateur.getRole() == Role.AGENCY_MANAGER) {
//            return utilisateur;
//        }
//        return utilisateur.getAgenceEmployeur();
//    }
//
//
//
//
//    /**
//     * Endpoint pour démarrer le trajet
//     */
//   @PutMapping("/{id}/demarrer") // 🟢 CORRECTION: Retrait du "/trajets" redondant
//    // @PreAuthorize("hasAnyRole('CHAUFFEUR', 'AGENCY_ADMIN')")
//    public ResponseEntity<?> demarrerTrajet(@PathVariable Long id) {
//        try {
//            Trajet trajetActif = trajetService.demarrerTrajet(id);
//            return ResponseEntity.ok(trajetActif);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Erreur lors du démarrage : " + e.getMessage()));
//        }
//    }
//
//    /**
//     * 📍 1. MISE À JOUR DE LA POSITION GPS (Appelée en continu quand le trajet est EN_ROUTE)
//     * URL cible : PUT http://localhost:8080/api/trajets/{id}/localisation
//     */
//   @PutMapping("/{id}/localisation") // 🟢 CORRECTION: Retrait du "/trajets" redondant
//    // @PreAuthorize("hasRole('CHAUFFEUR')")
//    public ResponseEntity<?> mettreAJourLocalisation(@PathVariable Long id, @RequestBody PositionDTO position) {
//        try {
//            if (position == null || position.getLatitude() == null || position.getLongitude() == null) {
//                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
//                        .body(Map.of("message", "Données GPS invalides : latitude ou longitude manquante."));
//            }
//
//            trajetService.mettreAJourLocalisation(id, position.getLatitude(), position.getLongitude());
//
//            return ResponseEntity.ok(Map.of("message", "Localisation mise à jour avec succès."));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Erreur lors de la mise à jour GPS : " + e.getMessage()));
//        }
//    }
//
//    /**
//     * 🔄 2. MISE À JOUR DU STATUT DU TRAJET (PROGRAMME, EN_ROUTE, TERMINE, DISPONIBLE)
//     * URL cible : PUT http://localhost:8080/api/trajets/{id}/statut?statut=EN_ROUTE
//     */
//    @PutMapping("/{id}/statut") // 🟢 CORRECTION: Retrait du "/trajets" redondant pour correspondre à l'appel d'Axios
//    // @PreAuthorize("hasRole('CHAUFFEUR')")
//    public ResponseEntity<?> mettreAJourStatut(
//            @PathVariable Long id,
//            @RequestParam("statut") String statut) {
//        try {
//            trajetService.mettreAJourStatut(id, statut);
//
//            return ResponseEntity.ok(Map.of(
//                    "message", "Statut du trajet mis à jour avec succès.",
//                    "nouveauStatut", statut
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Erreur lors de la mise à jour du statut : " + e.getMessage()));
//        }
//    }
//}
//
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.PositionDTO;
import com.example.gariconnectbackend.dto.TrajetDTO;
import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.TrajetService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.*;
        import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trajets")
@CrossOrigin("*")
public class TrajetController {

    @Autowired
    private TrajetRepository trajetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrajetService trajetService;

    // =========================================================================
    // 🛠️ MÉTHODES PRIVÉES UTILITAIRES (Isolation Multi-Tenant & DRY)
    // =========================================================================

    /**
     * Récupère l'utilisateur actuellement authentifié via le Token JWT.
     */
    private User getConnectedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable dans le système."));
    }

    /**
     * Résout l'ID de l'agence (ADMIN) propriétaire pour l'utilisateur connecté.
     * Si l'utilisateur est AGENCY_ADMIN, son propre ID est l'ID de l'agence.
     * Si c'est un AGENCY_MANAGER, on récupère l'ID de son agence employeuse.
     */
    private Long getAgenceIdPourUtilisateur(User user) {
        if (user.getRole() == Role.AGENCY_ADMIN) {
            return user.getId();
        } else if (user.getRole() == Role.AGENCY_MANAGER && user.getAgenceEmployeur() != null) {
            return user.getAgenceEmployeur().getId();
        }
        return null;
    }

    // =========================================================================
    // 1. ENDPOINT PUBLIC (Pour la page d'accueil Home.jsx - Sans restriction)
    // =========================================================================
    @GetMapping("/tous")
    public ResponseEntity<?> obtenirTousLesTrajets() {
        try {
            // Cet endpoint reste 100% public pour permettre l'affichage global des trajets disponibles
            List<Trajet> trajets = trajetRepository.findAll();
            return ResponseEntity.ok(trajets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du chargement des trajets : " + e.getMessage()));
        }
    }

    // =========================================================================
    // 2. GESTION DES TRAJETS (CRÉATION, MODIFICATION, SUPPRESSION)
    // =========================================================================

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> creerTrajet(@RequestBody Trajet trajet) {
        try {
            User utilisateurConnecte = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(utilisateurConnecte);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Création impossible : Agence de rattachement introuvable.");
            }

            Trajet nouveauTrajet = trajetService.creerTrajet(trajet, agenceId);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de création : " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet details) {
        try {
            User utilisateurConnecte = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(utilisateurConnecte);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Modification impossible : Agence de rattachement introuvable.");
            }

            // Le service valide déjà en interne l'appartenance du trajet à cette agence
            Trajet trajetMisAJour = trajetService.modifierTrajet(id, details, agenceId);
            return ResponseEntity.ok(trajetMisAJour);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de modification : " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
        try {
            User utilisateurConnecte = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(utilisateurConnecte);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Suppression non autorisée.");
            }

            // Le service valide déjà en interne l'appartenance du trajet à cette agence
            trajetService.supprimerTrajet(id, agenceId);
            return ResponseEntity.ok(Map.of("message", "Trajet supprimé avec succès."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de suppression : " + e.getMessage());
        }
    }

    // =========================================================================
    // 3. RECHERCHES & FILTRES SÉCURISÉS (Multi-Tenant)
    // =========================================================================

    @GetMapping("/mes-chauffeurs")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getChauffeursDeMonAgence() {
        try {
            User currentUser = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(currentUser);

            if (agenceId == null) {
                return ResponseEntity.badRequest().body("Vous n'êtes rattaché à aucune agence.");
            }

            List<User> chauffeurs = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
            return ResponseEntity.ok(chauffeurs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    @GetMapping("/agence/{agenceId}")
    public ResponseEntity<List<Trajet>> getTrajetsParAgence(@PathVariable Long agenceId) {
        // Optimisé pour éviter de charger toute la base de données
        List<Trajet> trajets = trajetRepository.findByAgenceId(agenceId);
        return ResponseEntity.ok(trajets);
    }
    // =========================================================================
    // 🛡️ ENDPOINT D'AUTO-GUÉRISON POUR LE FRONTEND (Évite les erreurs 404/405)
    // =========================================================================
    @GetMapping("/session")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CHAUFFEUR')")
    public ResponseEntity<?> getSessionInfos() {
        try {
            User user = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(user);

            Map<String, Object> infos = new HashMap<>();
            infos.put("id", user.getId());
            infos.put("email", user.getEmail());
            infos.put("role", user.getRole().toString());
            infos.put("agenceId", agenceId);

            return ResponseEntity.ok(infos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session invalide : " + e.getMessage()));
        }
    }
    @GetMapping("/mes-trajets")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getTrajetsDeMonAgence() {
        try {
            User utilisateurConnecte = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(utilisateurConnecte);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Action non autorisée : vous n'êtes rattaché à aucune agence.");
            }

            List<Trajet> trajets = trajetRepository.findByAgenceId(agenceId);
            return ResponseEntity.ok(trajets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Impossible de récupérer les trajets : " + e.getMessage()));
        }
    }

    @GetMapping("/recherche")
    public ResponseEntity<?> rechercherTrajetsPublics(
            @RequestParam(required = false) String depart,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String date) {
        try {
            List<Trajet> trajets = trajetRepository.findAll().stream()
                    .filter(t -> !"TERMINE".equals(t.getStatut()) && !"ANNULE".equals(t.getStatut()))
                    .filter(t -> depart == null || depart.trim().isEmpty() || (t.getDepart() != null && t.getDepart().toLowerCase().contains(depart.toLowerCase())))
                    .filter(t -> destination == null || destination.trim().isEmpty() || (t.getDestination() != null && t.getDestination().toLowerCase().contains(destination.toLowerCase())))
                    .collect(Collectors.toList());

            List<TrajetDTO> trajetsDTO = trajets.stream()
                    .map(TrajetDTO::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(trajetsDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la recherche : " + e.getMessage()));
        }
    }

    // =========================================================================
    // 4. HISTORIQUE CHAUFFEURS
    // =========================================================================

    @GetMapping("/mon-historique")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getMonHistoriqueChauffeur() {
        try {
            User chauffeur = getConnectedUser();
            List<Trajet> historiqueTrajets = trajetRepository.findByChauffeurId(chauffeur.getId());
            return ResponseEntity.ok(historiqueTrajets);
        } catch (Exception e) {
            System.err.println("❌ Erreur Historique Chauffeur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Impossible de récupérer l'historique : " + e.getMessage()));
        }
    }

    @GetMapping("/mon-historique/aujourdhui")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getTrajetsAujourdhuiChauffeur() {
        try {
            User chauffeur = getConnectedUser();
            List<Trajet> trajetsAujourdhui = trajetService.getTrajetsDuJour(chauffeur.getId());
            return ResponseEntity.ok(trajetsAujourdhui);
        } catch (Exception e) {
            System.err.println("❌ Erreur Trajets Aujourd'hui Chauffeur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Impossible de récupérer les trajets d'aujourd'hui : " + e.getMessage()));
        }
    }

    // =========================================================================
    // 5. SECURED SAAS GLOBAL TRIP FETCH & LOOKUP
    // =========================================================================

    /**
     * Endpoint d'obtention par défaut. Filtre AUTOMATIQUEMENT le contenu de retour
     * selon le tenant (Agence) ou le rôle de l'utilisateur authentifié.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CHAUFFEUR')")
    public ResponseEntity<?> getAllTrajets() {
        try {
            User user = getConnectedUser();

            // 1. Le Super Admin a une vision globale sans filtre
            if (user.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(trajetService.getAllTrajets());
            }

            // 2. L'administrateur ou gestionnaire d'agence ne voit que les siens
            if (user.getRole() == Role.AGENCY_ADMIN || user.getRole() == Role.AGENCY_MANAGER) {
                Long agenceId = getAgenceIdPourUtilisateur(user);
                if (agenceId == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé : aucune agence associée.");
                }
                return ResponseEntity.ok(trajetRepository.findByAgenceId(agenceId));
            }

            // 3. Le chauffeur ne voit que sa feuille de route (ses trajets)
            if (user.getRole() == Role.CHAUFFEUR) {
                return ResponseEntity.ok(trajetRepository.findByChauffeurId(user.getId()));
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Rôle non autorisé pour charger cette ressource.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur de récupération : " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTrajetById(@PathVariable Long id) {
        try {
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable avec l'ID : " + id));

            return ResponseEntity.ok(TrajetDTO.fromEntity(trajet));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération du trajet : " + e.getMessage()));
        }
    }

    // =========================================================================
    // 6. SUIVI TEMPS RÉEL (SÉCURISÉ MULTI-TENANT)
    // =========================================================================

    /**
     * Endpoint pour démarrer le trajet
     */
    @PutMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('CHAUFFEUR', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> demarrerTrajet(@PathVariable Long id) {
        try {
            User userConnecte = getConnectedUser();
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

            // Validation de sécurité : Est-ce le bon chauffeur ou la bonne agence ?
            if (userConnecte.getRole() == Role.CHAUFFEUR) {
                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userConnecte.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Vous n'êtes pas le chauffeur assigné à ce trajet."));
                }
            } else {
                Long agenceId = getAgenceIdPourUtilisateur(userConnecte);
                if (trajet.getAgence() == null || !trajet.getAgence().getId().equals(agenceId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Ce trajet appartient à une autre agence."));
                }
            }

            Trajet trajetActif = trajetService.demarrerTrajet(id);
            return ResponseEntity.ok(trajetActif);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors du démarrage : " + e.getMessage()));
        }
    }

    /**
     * 📍 MISE À JOUR DE LA POSITION GPS (SÉCURISÉE)
     */
    @PutMapping("/{id}/localisation")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> mettreAJourLocalisation(@PathVariable Long id, @RequestBody PositionDTO position) {
        try {
            if (position == null || position.getLatitude() == null || position.getLongitude() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Données GPS invalides : latitude ou longitude manquante."));
            }

            User chauffeur = getConnectedUser();
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

            // Un chauffeur ne peut pas mettre à jour le trajet d'un confrère d'une autre agence
            if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(chauffeur.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Action non autorisée : Vous n'êtes pas assigné à ce trajet."));
            }

            trajetService.mettreAJourLocalisation(id, position.getLatitude(), position.getLongitude());
            return ResponseEntity.ok(Map.of("message", "Localisation mise à jour avec succès."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la mise à jour GPS : " + e.getMessage()));
        }
    }

//    /**
//     * 🔄 MISE À JOUR DU STATUT DU TRAJET (SÉCURISÉE)
//     */
//    @PutMapping("/{id}/statut")
//    @PreAuthorize("hasAnyRole('CHAUFFEUR', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> mettreAJourStatut(
//            @PathVariable Long id,
//            @RequestParam("statut") String statut) {
//        try {
//            User userConnecte = getConnectedUser();
//            Trajet trajet = trajetRepository.findById(id)
//                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));
//
//            // Validation de sécurité Multi-Tenant & Rôle
//            if (userConnecte.getRole() == Role.CHAUFFEUR) {
//                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userConnecte.getId())) {
//                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                            .body(Map.of("message", "Action non autorisée : Vous n'êtes pas assigné à ce trajet."));
//                }
//            } else {
//                Long agenceId = getAgenceIdPourUtilisateur(userConnecte);
//                if (trajet.getAgence() == null || !trajet.getAgence().getId().equals(agenceId)) {
//                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                            .body(Map.of("message", "Action non autorisée : Ce trajet appartient à une autre agence."));
//                }
//            }
//
//            trajetService.mettreAJourStatut(id, statut);
//            return ResponseEntity.ok(Map.of(
//                    "message", "Statut du trajet mis à jour avec succès.",
//                    "nouveauStatut", statut
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Map.of("message", "Erreur lors de la mise à jour du statut : " + e.getMessage()));
//        }
//    }

    /**
     * Endpoint pour créer plusieurs trajets simultanément (ex: Aller et Retour)
     * URL cible : POST http://localhost:8080/api/trajets/batch
     */
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> creerTrajetsMultiples(@RequestBody List<Trajet> trajets) {
        try {
            User utilisateurConnecte = getConnectedUser();
            Long agenceId = getAgenceIdPourUtilisateur(utilisateurConnecte);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Création impossible : Agence de rattachement introuvable.");
            }

            // Vérification de sécurité
            if (trajets == null || trajets.isEmpty()) {
                return ResponseEntity.badRequest().body("Aucun trajet n'a été fourni.");
            }

            // Appel du service pour la création par lot
            List<Trajet> nouveauxTrajets = trajetService.creerTrajetsMultiples(trajets, agenceId);

            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauxTrajets);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur lors de la création (Aller/Retour) : " + e.getMessage());
        }
    }

    /**
     * 🔄 MISE À JOUR DU STATUT DU TRAJET (SÉCURISÉE)
     */
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('CHAUFFEUR', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> mettreAJourStatut(
            @PathVariable Long id,
            @RequestParam("statut") String statut) {
        try {
            User userConnecte = getConnectedUser();
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

            // Validation de sécurité Multi-Tenant & Rôle
            if (userConnecte.getRole() == Role.CHAUFFEUR) {
                if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(userConnecte.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Vous n'êtes pas assigné à ce trajet."));
                }
            } else {
                Long agenceId = getAgenceIdPourUtilisateur(userConnecte);
                if (trajet.getAgence() == null || !trajet.getAgence().getId().equals(agenceId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Ce trajet appartient à une autre agence."));
                }
            }

            trajetService.mettreAJourStatut(id, statut);
            return ResponseEntity.ok(Map.of(
                    "message", "Statut du trajet mis à jour avec succès.",
                    "nouveauStatut", statut
            ));
        } catch (Exception e) {
            // 🔥 CORRECTION : Fermeture correcte des parenthèses qui étaient coupées
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la mise à jour du statut : " + e.getMessage()));
        }
    }
} // N'oubliez pas l'accolade finale qui ferme la classe TrajetController
