

/*
    @PostMapping("/recruter-chauffeur")
    public ResponseEntity<?> recruterChauffeur(@RequestBody Map<String, String> request) {
        String emailChauffeur = request.get("email");
        String nom = request.get("nom");
        String telephone = request.get("telephone");

        String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(emailAgence).orElseThrow();

        // Chercher si l'utilisateur existe déjà, sinon le créer
        User chauffeur = userRepository.findByEmail(emailChauffeur).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(emailChauffeur);
            newUser.setRole(Role.CHAUFFEUR);
            return newUser;
        });

        chauffeur.setNom(nom);
        chauffeur.setTelephone(telephone);
        chauffeur.setAgenceEmployeur(agence);
        chauffeur.setStatut("ACTIF");

        // Générer un code temporaire de 6 caractères
        String codeTemporaire = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        chauffeur.setPassword(passwordEncoder.encode(codeTemporaire));
        chauffeur.setMustChangePassword(true);

        userRepository.save(chauffeur);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Chauffeur recruté avec succès");
        response.put("code", codeTemporaire);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/agences-liste")
    public List<User> getAgencesActives() {
        return userRepository.findByRole(Role.AGENCE);
    }


    @GetMapping("/mes-trajets")
    public ResponseEntity<?> getMesTrajets() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        List<Trajet> trajets = trajetRepository.findByAgence(agence);
        return ResponseEntity.ok(trajets);
    }


    @GetMapping("/mes-chauffeurs")
    public ResponseEntity<?> getMesChauffeurs() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expirée");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(agence -> ResponseEntity.ok(userRepository.findByAgenceEmployeur(agence)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow();

        Map<String, Object> stats = new HashMap<>();
        // Correction des noms de méthodes pour correspondre à vos Repository
        stats.put("busCount", vehiculeRepository.countByAgence(agence));
        stats.put("trajetCount", trajetRepository.countByAgenceAndStatut(agence, "EN_ROUTE"));
        stats.put("chauffeurCount", userRepository.countByAgenceAndRole(agence, Role.CHAUFFEUR));
        stats.put("reservationCount", reservationRepository.countByTrajet_Agence(agence));

        return ResponseEntity.ok(stats);
    }
}
*/
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
@RestController
@RequestMapping("/api/agences")
@PreAuthorize("hasAnyAuthority('ROLE_AGENCE', 'AGENCE')")
@CrossOrigin(origins = "*")
public class AgenceController {

    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private TrajetRepository trajetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PaiementRepository paiementRepository; // Ajouté
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private CourrierRepository courrierRepository;


    private User getAuthenticatedAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
    }
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            User agence = getAuthenticatedAgence();
            Map<String, Object> stats = new HashMap<>();

            // 1. Calcul du Revenu Total propre à l'agence (Paiements SUCCES)
            Double revenu = paiementRepository.sumMontantByStatutAndTrajet_Agence("SUCCES", agence);
            stats.put("revenuTotal", revenu != null ? revenu : 0.0);

            // 2. Compteurs classiques
            stats.put("busCount", vehiculeRepository.countByAgence(agence));
            stats.put("trajetCount", trajetRepository.countByAgenceAndStatut(agence, "EN_ROUTE"));
            stats.put("reservationCount", reservationRepository.countByTrajet_Agence(agence));

            long totalChauffeurs = userRepository.countByAgenceAndRole(agence, Role.CHAUFFEUR);
            stats.put("chauffeurCount", totalChauffeurs);

            // 3. STATISTIQUES RÉELLES DES CHAUFFEURS (Basées sur les Trajets)
            List<Trajet> trajetsAgence = trajetRepository.findByAgence(agence);

            long chauffeursEnCourse = trajetsAgence.stream()
                    .filter(t -> "EN_ROUTE".equalsIgnoreCase(t.getStatut()) && t.getChauffeur() != null)
                    .map(t -> t.getChauffeur().getId())
                    .distinct()
                    .count();

            long chauffeursTermines = trajetsAgence.stream()
                    .filter(t -> "TERMINE".equalsIgnoreCase(t.getStatut()) && t.getChauffeur() != null)
                    .map(t -> t.getChauffeur().getId())
                    .distinct()
                    .count();

            long chauffeursDisponibles = Math.max(0, totalChauffeurs - chauffeursEnCourse);

            stats.put("chauffeursDisponibles", chauffeursDisponibles);
            stats.put("chauffeursEnCourse", chauffeursEnCourse);
            stats.put("chauffeursTermines", chauffeursTermines);

            // 4. STATISTIQUES RÉELLES DU FLUX DE COLIS ET COURRIERS
            // On compte la taille de la liste retournée par ton filtre personnalisé
            long colisCount = courrierRepository.findByAgenceAndType(agence, "COLIS").size();
            long courrierCount = courrierRepository.findByAgenceAndType(agence, "COURRIER").size();

            stats.put("colisCount", colisCount);
            stats.put("courrierCount", courrierCount);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des stats agence : " + e.getMessage());
        }
    }

    @GetMapping("/chauffeurs")
   // @GetMapping("/mes-chauffeurs")
    public ResponseEntity<?> getMesChauffeurs() {
        try {
            User agence = getAuthenticatedAgence();
            List<User> chauffeurs = userRepository.findByAgenceEmployeur(agence);
            return ResponseEntity.ok(chauffeurs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    @GetMapping("/trajets/en-route-agence")
    public ResponseEntity<?> getTrajetsEnRouteAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow();

        // Assurez-vous que cette méthode existe dans votre trajetRepository
        return ResponseEntity.ok(trajetRepository.findByAgenceAndStatut(agence, "EN_ROUTE"));
    }


       @GetMapping("/mes-trajets")
    public ResponseEntity<?> getMesTrajets() {
        User agence = getAuthenticatedAgence();
        return ResponseEntity.ok(trajetRepository.findByAgence(agence));
    }
    @PostMapping("/recruter-chauffeur")
    public ResponseEntity<?> recruterChauffeur(@RequestBody Map<String, String> request) {
        String emailChauffeur = request.get("email");
        User agence = getAuthenticatedAgence();

        User chauffeur = userRepository.findByEmail(emailChauffeur).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(emailChauffeur);
            newUser.setRole(Role.CHAUFFEUR);
            return newUser;
        });

        chauffeur.setNom(request.get("nom"));
        chauffeur.setTelephone(request.get("telephone"));
        chauffeur.setAgenceEmployeur(agence);
        chauffeur.setStatut("ACTIF");

        String codeTemporaire = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        chauffeur.setPassword(passwordEncoder.encode(codeTemporaire));
        chauffeur.setMustChangePassword(true);

        userRepository.save(chauffeur);

        return ResponseEntity.ok(Map.of("message", "Chauffeur recruté", "code", codeTemporaire));
    }
    @GetMapping("/stats/graphique")
    public ResponseEntity<?> getGraphiqueStats() {
        try {
            // 1. Récupération de l'agence connectée
            User agence = getAuthenticatedAgence();

            // 2. Appel au repository
            List<Map<String, Object>> rawStats = reservationRepository.getReservationsStatsParJour(agence.getId());

            // 3. Préparation des structures de données
            List<Map<String, Object>> formattedData = new ArrayList<>();
            String[] joursSemaine = {"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"};
            java.util.Calendar cal = java.util.Calendar.getInstance();

            if (rawStats == null || rawStats.isEmpty()) {
                return ResponseEntity.ok(formattedData); // Retourne [] si vide, évite l'erreur front
            }

            // 4. Boucle de formatage sécurisée
            for (Map<String, Object> row : rawStats) {
                try {
                    Map<String, Object> map = new HashMap<>();

                    // Extraction de la date (alias "date" dans le SQL)
                    Object dateObj = row.get("date");
                    if (dateObj == null) dateObj = row.get("DATE"); // Sécurité casse PostgreSQL

                    // Extraction du compteur (alias "count" dans le SQL)
                    Object countObj = row.get("count");
                    if (countObj == null) countObj = row.get("COUNT");

                    if (dateObj != null) {
                        // Conversion de la date
                        if (dateObj instanceof java.sql.Date) {
                            cal.setTime((java.sql.Date) dateObj);
                        } else {
                            cal.setTime(java.sql.Date.valueOf(dateObj.toString()));
                        }

                        // Récupération du nom du jour (ex: "Lun")
                        String nomJour = joursSemaine[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1];

                        // Conversion du compte en Integer
                        int total = 0;
                        if (countObj instanceof Number) {
                            total = ((Number) countObj).intValue();
                        }

                        map.put("name", nomJour);     // Clé pour l'axe X du graphique
                        map.put("services", total);   // Clé pour la hauteur de la courbe
                        formattedData.add(map);
                    }
                } catch (Exception e) {
                    // On log l'erreur pour une ligne précise mais on continue la boucle
                    System.err.println("Erreur formatage ligne stat : " + e.getMessage());
                }
            }

            return ResponseEntity.ok(formattedData);

        } catch (Exception e) {
            // Log complet dans la console pour le débogage
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du chargement des statistiques : " + e.getMessage());
        }
    }




    @GetMapping("/stats-performance")
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> getStatsPerformance() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email).orElseThrow();

            // Appel au repository pour avoir les stats de cette agence uniquement
            List<Map<String, Object>> rawData = paiementRepository.getStatsPaiementsParJourPourAgence(agence.getId());

            List<Map<String, Object>> formattedData = new ArrayList<>();
            String[] joursSemaine = {"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"};

            for (Map<String, Object> row : rawData) {
                try {
                    Map<String, Object> map = new HashMap<>();
                    Object dateObj = row.get("date_paiement");
                    Calendar cal = Calendar.getInstance();

                    if (dateObj instanceof java.sql.Date || dateObj instanceof java.util.Date) {
                        cal.setTime((java.util.Date) dateObj);
                    }

                    int total = 0;
                    Object totalObj = row.get("total");
                    if (totalObj instanceof Number) {
                        total = ((Number) totalObj).intValue();
                    }

                    map.put("name", joursSemaine[cal.get(Calendar.DAY_OF_WEEK) - 1]);
                    map.put("services", total);
                    formattedData.add(map);
                } catch (Exception e) {
                    System.err.println("Erreur formatage ligne : " + e.getMessage());
                }
            }
            return ResponseEntity.ok(formattedData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    // ici

     @GetMapping("/ma-commission")
    public ResponseEntity<?> getMaCommission() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

            Double totalDu = commissionRepo.totalDuParAgence(agence.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("montantDu", totalDu != null ? totalDu : 0.0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Erreur accès commission");
        }
    }
    /**
     * NOUVELLE MÉTHODE : Récupérer les notifications de l'agence
     * Appelée par : api.get('/agences/notifications')
     */

    @GetMapping("/notifications")
    public ResponseEntity<?> getMesNotifications() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email).orElseThrow();
            List<Notification> notifications = notificationRepository.findByDestinataireOrderByDateDesc(agence);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Erreur accès notifications");
        }
    }
    /**
     * MÉTHODE STATISTIQUES (Mise à jour pour cohérence)
     */

    @GetMapping("/stats-paiements-semaine")
    public ResponseEntity<?> getStatsPaiementsSemaine() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email).orElseThrow();

            List<Map<String, Object>> rawData = paiementRepository.getStatsPaiementsParJourPourAgence(agence.getId());
            List<Map<String, Object>> formattedData = new ArrayList<>();
            String[] joursSemaine = {"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"};

            for (Map<String, Object> row : rawData) {
                Map<String, Object> map = new HashMap<>();
                Object dateObj = row.get("date_paiement");
                Calendar cal = Calendar.getInstance();
                if (dateObj instanceof java.util.Date) {
                    cal.setTime((java.util.Date) dateObj);
                }
                int total = (row.get("total") instanceof Number) ? ((Number) row.get("total")).intValue() : 0;
                map.put("name", joursSemaine[cal.get(Calendar.DAY_OF_WEEK) - 1]);
                map.put("services", total);
                formattedData.add(map);
            }
            return ResponseEntity.ok(formattedData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    @PutMapping("/notifications/marquer-lue/{id}")
    public ResponseEntity<?> marquerCommeLue(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setLue(true);
                    notificationRepository.save(n);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/valider-chauffeur/{id}")
// Optionnel : s'assurer que seule une agence peut valider
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> validerChauffeur(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(chauffeur -> {
                    chauffeur.setStatut("VALIDE");
                    // On peut aussi désactiver le flag de changement de mot de passe ici si nécessaire
                    chauffeur.setMustChangePassword(false);
                    userRepository.save(chauffeur);
                    return ResponseEntity.ok(Map.of("message", "Chauffeur validé avec succès"));
                }).orElse(ResponseEntity.notFound().build());
    }
}
