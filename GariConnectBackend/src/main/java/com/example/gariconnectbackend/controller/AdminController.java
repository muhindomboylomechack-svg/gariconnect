/*package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

        import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*") // Important pour React
@RestController
@RequestMapping("/api/admin") // La base de l'URL
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')") // Accessible aux deux, filtrage interne par méthode
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;




    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

            Map<String, Object> stats = new HashMap<>();

            // CAS 1 : Le Super Admin (Vision globale)
            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                stats.put("totalCommissions", 150000); // À remplacer par un calcul réel de vos trajets globaux
                stats.put("totalAgences", userRepository.countByRole(Role.AGENCY_MANAGER));
                stats.put("totalClients", userRepository.countByRole(Role.CLIENT));
                stats.put("totalReservations", 450);

                List<Map<String, Object>> chartData = List.of(
                        Map.of("name", "Jan", "revenu", 4000),
                        Map.of("name", "Feb", "revenu", 3000),
                        Map.of("name", "Mar", "revenu", 5000)
                );
                stats.put("chartData", chartData);

                List<Map<String, String>> activities = List.of(
                        Map.of("user", "Global Platform", "action", "Vue d'ensemble chargée", "time", "Maintenant")
                );
                stats.put("recentActivities", activities);
            }

            // CAS 2 : L'Admin d'agence (Vision restreinte à son agence)
            else if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agence = utilisateurConnecte.getAgenceEmployeur();
                if (agence == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Vous n'êtes rattaché à aucune agence."));
                }

                // Récupération des compteurs spécifiques à l'agence via le UserRepository
                long totalChauffeurs = userRepository.countByAgenceAndRole(agence, Role.CHAUFFEUR);
                long totalMembresAgence = userRepository.findByAgenceEmployeur(agence).size();

                stats.put("totalCommissions", 45000); // Remplacer par la somme des commissions de cette agence
                stats.put("totalChauffeurs", totalChauffeurs);
                stats.put("totalMembresAgence", totalMembresAgence);
                stats.put("totalReservations", 120); // Filtrer vos réservations par agence ici

                List<Map<String, Object>> chartData = List.of(
                        Map.of("name", "Jan", "revenu", 1200),
                        Map.of("name", "Feb", "revenu", 1500),
                        Map.of("name", "Mar", "revenu", 2100)
                );
                stats.put("chartData", chartData);

                List<Map<String, String>> activities = List.of(
                        Map.of("user", agence.getNom(), "action", "Activité de l'agence chargée", "time", "Maintenant")
                );
                stats.put("recentActivities", activities);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors du calcul des statistiques");
        }
    }

    @PutMapping("/valider-chauffeur/{id}")
    public ResponseEntity<?> validerChauffeur(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User chauffeur = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        // Sécurité Multi-tenance pour l'ADMIN d'agence
        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (!utilisateurConnecte.getAgenceEmployeur().equals(chauffeur.getAgenceEmployeur())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Ce chauffeur ne fait pas partie de votre agence"));
            }
        }

        chauffeur.setStatut("ACTIF");
        userRepository.save(chauffeur);

        return ResponseEntity.ok(Map.of("message", "Le chauffeur " + chauffeur.getNom() + " est désormais actif."));
    }


    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            List<User> tousLesUtilisateurs = userRepository.findAll();
            return ResponseEntity.ok(tousLesUtilisateurs);
        } else {
            User agence = utilisateurConnecte.getAgenceEmployeur();
            List<User> utilisateursAgence = userRepository.findByAgenceEmployeur(agence);
            return ResponseEntity.ok(utilisateursAgence);
        }
    }


    @PutMapping("/users/{id}/valider")
    public ResponseEntity<?> validerUtilisateur(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (!utilisateurConnecte.getAgenceEmployeur().equals(user.getAgenceEmployeur())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Cet utilisateur ne dépend pas de votre agence"));
            }
        }

        user.setStatut("ACTIF");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Utilisateur validé avec succès !"));
    }

    @PutMapping("/valider-agence/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')") // Verrouillage strict : Seul le Super Admin système peut exécuter cette action
    public ResponseEntity<?> validerAgence(@PathVariable Long id) {
        User agenceOrAdmin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // On vérifie que la cible est bien un compte d'agence ou d'administration d'agence
        if (agenceOrAdmin.getRole() != Role.AGENCY_ADMIN && agenceOrAdmin.getRole() != Role.AGENCY_MANAGER) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet utilisateur n'est pas un gestionnaire d'agence."));
        }

        // Activation officielle du compte par l'autorité globale du Super Admin
        agenceOrAdmin.setStatut("ACTIF");
        userRepository.save(agenceOrAdmin);

        return ResponseEntity.ok(Map.of("message", "L'agence et son compte Admin ont été validés avec succès par le Super Admin !"));
    }



    @PostMapping("/users/create")
    public ResponseEntity<?> createByAdmin(@RequestBody User newUser) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        if (userRepository.existsByEmail(newUser.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé"));
        }

        // Règle de cloisonnement pour l'Admin d'agence
        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (utilisateurConnecte.getAgenceEmployeur() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Erreur : Votre compte administrateur n'est rattaché à aucune agence."));
            }
            // On force l'arborescence : le nouvel utilisateur appartient obligatoirement à l'agence de l'Admin créateur
            newUser.setAgenceEmployeur(utilisateurConnecte.getAgenceEmployeur());
        }
        // Si c'est le SUPER_ADMIN qui appelle l'endpoint, l'agence renseignée dans l'objet 'newUser' est conservée intacte.

        // Configuration sécurisée par défaut
        newUser.setPassword(passwordEncoder.encode("Gari2024!"));
        newUser.setStatut("ACTIF"); // Actif immédiatement car validé directement lors de sa création par un manager autorisé

        userRepository.save(newUser);
        return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès."));
    }


    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User userASupprimer = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérification de sécurité et isolation des données
        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (userASupprimer.getAgenceEmployeur() == null ||
                    !utilisateurConnecte.getAgenceEmployeur().getId().equals(userASupprimer.getAgenceEmployeur().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Accès refusé : Vous n'êtes pas autorisé à supprimer un membre externe à votre agence."));
            }
        }

        userRepository.delete(userASupprimer);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès."));


    }
    */
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*") // Important pour React
@RestController
@RequestMapping("/api/admin") // Base de l'URL : /api/admin
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

            Map<String, Object> stats = new HashMap<>();

            // CAS 1 : Le Super Admin (Vision globale)
            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                stats.put("totalCommissions", 150000);
                stats.put("totalAgences", userRepository.countByRole(Role.AGENCY_ADMIN));
                stats.put("totalClients", userRepository.countByRole(Role.CLIENT));
                stats.put("totalReservations", 450);

                List<Map<String, Object>> chartData = List.of(
                        Map.of("name", "Jan", "revenu", 4000),
                        Map.of("name", "Feb", "revenu", 3000),
                        Map.of("name", "Mar", "revenu", 5000)
                );
                stats.put("chartData", chartData);

                List<Map<String, String>> activities = List.of(
                        Map.of("user", "Global Platform", "action", "Vue d'ensemble chargée", "time", "Maintenant")
                );
                stats.put("recentActivities", activities);
            }

            // 🟢 CAS 2 : L'Admin d'agence OU le Manager d'agence (Vision restreinte à l'entreprise)
            else if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN || utilisateurConnecte.getRole() == Role.AGENCY_MANAGER) {

                // Si c'est le manager qui se connecte, on redirige les calculs sur son entreprise mère (AGENCY_ADMIN)
                User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte
                        : utilisateurConnecte.getAgenceEmployeur();

                if (agence == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Vous n'êtes rattaché à aucune entreprise."));
                }

                long totalChauffeurs = userRepository.countByAgenceAndRole(agence, Role.CHAUFFEUR);
                long totalMembresAgence = userRepository.findByAgenceEmployeur(agence).size();

                stats.put("totalCommissions", 45000);
                stats.put("totalChauffeurs", totalChauffeurs);
                stats.put("totalMembresAgence", totalMembresAgence);
                stats.put("totalReservations", 120);

                List<Map<String, Object>> chartData = List.of(
                        Map.of("name", "Jan", "revenu", 1200),
                        Map.of("name", "Feb", "revenu", 1500),
                        Map.of("name", "Mar", "revenu", 2100)
                );
                stats.put("chartData", chartData);

                List<Map<String, String>> activities = List.of(
                        Map.of("user", agence.getNom(), "action", "Activité de l'agence chargée", "time", "Maintenant")
                );
                stats.put("recentActivities", activities);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur lors du calcul des statistiques");
        }
    }

    /**
     * Valider son Chauffeur
     */
    @PutMapping("/valider-chauffeur/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> validerChauffeur(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User chauffeur = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (!utilisateurConnecte.getAgenceEmployeur().equals(chauffeur.getAgenceEmployeur())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Ce chauffeur ne fait pas partie de votre agence"));
            }
        }
        chauffeur.setStatut("ACTIF");
        userRepository.save(chauffeur);

        return ResponseEntity.ok(Map.of("message", "Le chauffeur " + chauffeur.getNom() + " est désormais actif."));
    }

    /**
     * Récupérer la liste des utilisateurs
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            List<User> tousLesUtilisateurs = userRepository.findAll();
            return ResponseEntity.ok(tousLesUtilisateurs);
        } else {
            User agence = utilisateurConnecte.getAgenceEmployeur();
            List<User> utilisateursAgence = userRepository.findByAgenceEmployeur(agence);
            return ResponseEntity.ok(utilisateursAgence);
        }
    }

    /**
     * 🟢 AJOUT : Modifier le statut d'un utilisateur (Suspension temporaire ou Réactivation)
     * URL d'accès : PUT /api/admin/users/{id}/statut
     */
    @PutMapping("/users/{id}/statut")
    public ResponseEntity<?> modifierStatutUtilisateur(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

            User cible = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // 1. Sécurité : Empêcher de modifier un SUPER_ADMIN
            if (cible.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Action interdite : Impossible de modifier le statut d'un Super Administrateur."));
            }

            // 2. Sécurité Cloisonnement : Un AGENCY_ADMIN ne peut modifier que les membres de son agence
            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                if (cible.getAgenceEmployeur() == null ||
                        !utilisateurConnecte.getAgenceEmployeur().getId().equals(cible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Accès refusé : Cet utilisateur n'appartient pas à votre agence."));
                }
            }

            // 3. Validation du statut reçu du frontend (ACTIF ou BLOQUE)
            String nouveauStatut = payload.get("statut");
            if (nouveauStatut == null || (!nouveauStatut.equals("ACTIF") && !nouveauStatut.equals("BLOQUE"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Statut invalide. Utilisez 'ACTIF' ou 'BLOQUE'."));
            }

            // 4. Enregistrement des modifications
            cible.setStatut(nouveauStatut);
            userRepository.save(cible);

            String messageSucces = nouveauStatut.equals("BLOQUE")
                    ? "Le compte de l'utilisateur a été suspendu avec succès."
                    : "Le compte de l'utilisateur a été réactivé avec succès.";

            return ResponseEntity.ok(Map.of("message", messageSucces, "statut", nouveauStatut));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la modification du statut."));
        }
    }

    /**
     * Basculer le type d'abonnement d'une agence
     */
    @PutMapping("/agences/{id}/abonnement")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> changerTypeAbonnement(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User agence = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));

        if (agence.getRole() != Role.AGENCY_ADMIN && agence.getRole() != Role.AGENCY_MANAGER) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet utilisateur n'est pas une agence."));
        }

        String nouveauType = payload.get("typeAbonnement");
        if (!"COMMISSION".equals(nouveauType) && !"DEFINITIF".equals(nouveauType)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Type d'abonnement invalide. Utilisez COMMISSION ou DEFINITIF."));
        }

        agence.setTypeAbonnement(nouveauType);
        userRepository.save(agence);

        return ResponseEntity.ok(Map.of("message", "L'abonnement de l'agence " + agence.getNom() + " a été mis à jour avec succès en : " + nouveauType));
    }

    /**
     * Validation générique d'un utilisateur par son ID
     */
    @PutMapping("/users/{id}/valider")
    public ResponseEntity<?> validerUtilisateur(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (!utilisateurConnecte.getAgenceEmployeur().equals(user.getAgenceEmployeur())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Cet utilisateur ne dépend pas de votre agence"));
            }
        }

        user.setStatut("ACTIF");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Utilisateur validé avec succès !"));
    }

    /**
     * VALIDER UNE AGENCE LORS DE L'INSCRIPTION
     */
    @PutMapping("/valider-agence/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> validerAgence(@PathVariable Long id) {
        User agenceOrAdmin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (agenceOrAdmin.getRole() != Role.AGENCY_ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet utilisateur n'est pas un administrateur d'agence autorisé à être validé."));
        }

        agenceOrAdmin.setStatut("ACTIF");
        userRepository.save(agenceOrAdmin);

        return ResponseEntity.ok(Map.of("message", "L'agence et son compte Admin ont été validés avec succès !"));
    }

    /**
     * CRÉATION D'UN UTILISATEUR
     */
    @PostMapping("/users/create")
    public ResponseEntity<?> createByAdmin(@RequestBody User newUser) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        if (userRepository.existsByEmail(newUser.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé"));
        }

        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (utilisateurConnecte.getAgenceEmployeur() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Erreur : Votre compte administrateur n'est rattaché à aucune agence."));
            }
            newUser.setAgenceEmployeur(utilisateurConnecte.getAgenceEmployeur());
        }

        newUser.setPassword(passwordEncoder.encode("Gari2024!"));
        newUser.setStatut("ACTIF");

        userRepository.save(newUser);
        return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès."));
    }

    /**
     * SUPPRESSION D'UN UTILISATEUR
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

        User userASupprimer = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (userASupprimer.getAgenceEmployeur() == null ||
                    !utilisateurConnecte.getAgenceEmployeur().getId().equals(userASupprimer.getAgenceEmployeur().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Accès refusé : Vous n'êtes pas autorisé à modifier ce membre externe."));
            }
        }

        userRepository.delete(userASupprimer);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès."));
    }

}
