
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.*;
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
@RequestMapping("/api/agences") // Le préfixe global reste ici
@PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
@CrossOrigin(origins = "*")
public class AgenceController {

    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private TrajetRepository trajetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private CourrierRepository courrierRepository;

    private User getAuthenticatedAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        // Astuce : Si c'est un manager, l'entité agence est son employeur
        if (u.getRole() == Role.AGENCY_MANAGER && u.getAgenceEmployeur() != null) {
            return u.getAgenceEmployeur();
        }
        return u;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            User agence = getAuthenticatedAgence();
            Map<String, Object> stats = new HashMap<>();

            Double revenu = paiementRepository.sumMontantByStatutAndTrajet_Agence("SUCCES", agence);
            stats.put("revenuTotal", revenu != null ? revenu : 0.0);

            stats.put("busCount", vehiculeRepository.countByAgence(agence));
            stats.put("trajetCount", trajetRepository.countByAgenceAndStatut(agence, "EN_ROUTE"));
            stats.put("reservationCount", reservationRepository.countByTrajet_Agence(agence));

            long totalChauffeurs = userRepository.countByAgenceAndRole(agence, Role.CHAUFFEUR);
            stats.put("chauffeurCount", totalChauffeurs);

            List<Trajet> trajetsAgence = trajetRepository.findByAgence(agence);

            long chauffeursEnCourse = trajetsAgence.stream()
                    .filter(t -> "EN_ROUTE".equalsIgnoreCase(t.getStatut()) && t.getChauffeur() != null)
                    .map(t -> t.getChauffeur().getId())
                    .distinct().count();

            long chauffeursTermines = trajetsAgence.stream()
                    .filter(t -> "TERMINE".equalsIgnoreCase(t.getStatut()) && t.getChauffeur() != null)
                    .map(t -> t.getChauffeur().getId())
                    .distinct().count();

            long chauffeursDisponibles = Math.max(0, totalChauffeurs - chauffeursEnCourse);

            stats.put("chauffeursDisponibles", chauffeursDisponibles);
            stats.put("chauffeursEnCourse", chauffeursEnCourse);
            stats.put("chauffeursTermines", chauffeursTermines);

            stats.put("colisCount", courrierRepository.findByAgenceAndType(agence, "COLIS").size());
            stats.put("courrierCount", courrierRepository.findByAgenceAndType(agence, "COURRIER").size());

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des stats agence : " + e.getMessage());
        }
    }
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User newUser) {
        try {
            // 1. Gestion du mot de passe
            if (newUser.getPassword() == null || newUser.getPassword().isEmpty()) {
                newUser.setPassword(passwordEncoder.encode("Gari2024!")); // Mot de passe par défaut
            } else {
                newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
            }

            // 2. Initialisation des valeurs par défaut obligatoires
            newUser.setStatut("ACTIF");

            // --- MODIFICATION ICI ---
            newUser.setMustChangePassword(false);
            // -------------------------

            // 3. Sauvegarde
            userRepository.save(newUser);

            return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la création : " + e.getMessage()));
        }
    }
    @GetMapping("/chauffeurs")
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
        User agence = getAuthenticatedAgence();
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
            User agence = getAuthenticatedAgence();
            List<Map<String, Object>> rawStats = reservationRepository.getReservationsStatsParJour(agence.getId());
            List<Map<String, Object>> formattedData = new ArrayList<>();
            String[] joursSemaine = {"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"};
            java.util.Calendar cal = java.util.Calendar.getInstance();

            if (rawStats == null || rawStats.isEmpty()) {
                return ResponseEntity.ok(formattedData);
            }

            for (Map<String, Object> row : rawStats) {
                try {
                    Map<String, Object> map = new HashMap<>();
                    Object dateObj = row.get("date");
                    if (dateObj == null) dateObj = row.get("DATE");
                    Object countObj = row.get("count");
                    if (countObj == null) countObj = row.get("COUNT");

                    if (dateObj != null) {
                        if (dateObj instanceof java.sql.Date) {
                            cal.setTime((java.sql.Date) dateObj);
                        } else {
                            cal.setTime(java.sql.Date.valueOf(dateObj.toString()));
                        }
                        String nomJour = joursSemaine[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1];
                        int total = (countObj instanceof Number) ? ((Number) countObj).intValue() : 0;

                        map.put("name", nomJour);
                        map.put("services", total);
                        formattedData.add(map);
                    }
                } catch (Exception e) {}
            }
            return ResponseEntity.ok(formattedData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du chargement des statistiques : " + e.getMessage());
        }
    }

    @GetMapping("/stats-performance")
    // CORRECTION : Remplacement de 'AGENCE' par les nouveaux rôles
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getStatsPerformance() {
        try {
            User agence = getAuthenticatedAgence();
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
                    int total = (row.get("total") instanceof Number) ? ((Number) row.get("total")).intValue() : 0;
                    map.put("name", joursSemaine[cal.get(Calendar.DAY_OF_WEEK) - 1]);
                    map.put("services", total);
                    formattedData.add(map);
                } catch (Exception e) {}
            }
            return ResponseEntity.ok(formattedData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    @GetMapping("/ma-commission")
    public ResponseEntity<?> getMaCommission() {
        try {
            // 1. MULTI-TENANCY : Identifier l'agence connectée
            User agence = getAuthenticatedAgence();

            // 2. Récupérer le taux de commission de l'agence (ex: 10% par défaut)
            Double tauxCommission = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;

            // 3. CALCUL DES REVENUS - RÉSERVATIONS
            // On récupère uniquement les réservations liées aux trajets de cette agence
            List<Reservation> reservations = reservationRepository.findByTrajet_Agence(agence);
            double totalVentesReservations = reservations.stream()
                    .filter(r -> "PAYE".equalsIgnoreCase(r.getStatut()) || "CONFIRMEE".equalsIgnoreCase(r.getStatut()))
                    .mapToDouble(r -> r.getMontantPaye() != null ? r.getMontantPaye() : 0.0)
                    .sum();

            // 4. CALCUL DES REVENUS - COURRIERS & COLIS
            // On utilise la méthode existante du CourrierRepository pour filtrer par agence
            List<Courrier> courriers = courrierRepository.findByAgenceOrigineOrderByIdDesc(agence);
            double totalVentesCourriers = courriers.stream()
                    // On exclut les courriers annulés ou non validés financièrement
                    .filter(c -> c.getStatut() != null
                            && !c.getStatut().equalsIgnoreCase("REJETE")
                            && !c.getStatut().equalsIgnoreCase("EN_ATTENTE_DE_VALIDATION"))
                    .mapToDouble(c -> c.getPrix() != null ? c.getPrix() : 0.0)
                    .sum();

            // 5. APPLICATION DE LA LOGIQUE DE COMMISSION
            double revenusGlobaux = totalVentesReservations + totalVentesCourriers;
            double commissionTotaleCalculee = (revenusGlobaux * tauxCommission) / 100.0;

            // 6. SOUSTRACTION DES DETTES DÉJÀ RÉGLÉES
            // Utilisation de votre méthode corrigée dans CommissionDetteRepository (reglee = true)
            Double commissionsDejaReglees = commissionRepo.totalRegleParAgence(agence.getId());
            if (commissionsDejaReglees == null) {
                commissionsDejaReglees = 0.0;
            }

            // 7. RÉSULTAT FINAL (Dette réelle restante)
            double montantDuReel = commissionTotaleCalculee - commissionsDejaReglees;

            // Sécurité : Éviter d'afficher un montant négatif si l'agence a trop payé
            if (montantDuReel < 0) {
                montantDuReel = 0.0;
            }

            // Retour complet pour permettre au Frontend (React) d'afficher les détails du calcul
            return ResponseEntity.ok(Map.of(
                    "montantDu", montantDuReel,
                    "tauxApplique", tauxCommission,
                    "details", Map.of(
                            "ventesReservations", totalVentesReservations,
                            "ventesCourriers", totalVentesCourriers,
                            "revenusTotaux", revenusGlobaux,
                            "commissionsDejaReglees", commissionsDejaReglees
                    )
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du calcul de la commission : " + e.getMessage()));
        }
    }
    @GetMapping("/notifications")
    public ResponseEntity<?> getMesNotifications() {
        try {
            User agence = getAuthenticatedAgence();
            List<Notification> notifications = notificationRepository.findByDestinataireOrderByDateDesc(agence);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Erreur accès notifications");
        }
    }

    @GetMapping("/stats-paiements-semaine")
    public ResponseEntity<?> getStatsPaiementsSemaine() {
        try {
            User agence = getAuthenticatedAgence();
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
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    public ResponseEntity<?> validerChauffeur(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(chauffeur -> {
                    chauffeur.setStatut("ACTIF");
                    chauffeur.setMustChangePassword(false);
                    userRepository.save(chauffeur);
                    return ResponseEntity.ok(Map.of("message", "Chauffeur validé avec succès"));
                }).orElse(ResponseEntity.notFound().build());
    }
    /**
     * 🏢 RÉCUPÉRER LE PROFIL DE L'AGENCE CONNECTÉE
     * Règle l'erreur 404 de React sur /api/agence/profile
     */
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getProfilAgence() {
        try {
            // 1. Utiliser la méthode utilitaire existante pour obtenir la bonne entité agence
            // (Si c'est un ADMIN, c'est lui-même. Si c'est un MANAGER, c'est son agenceEmployeur)
            User agenceConnectee = getAuthenticatedAgence();

            // 2. Vérifier si une agence a bien été trouvée
            if (agenceConnectee == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucune agence n'est associée à votre compte."));
            }

            // 3. Renvoyer les informations de l'agence
            return ResponseEntity.ok(agenceConnectee);

        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la récupération du profil agence : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }
}