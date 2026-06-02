package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.UserService;
import jakarta.persistence.PrePersist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> listerUtilisateursParRoleEtAgence() {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(emailConnecte).map(utilisateurConnecte -> {
            // Cas 1 : Le Super Admin - Vision globale sans restrictions
            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                List<User> tousLesUtilisateurs = userRepository.findAll();
                return ResponseEntity.ok(tousLesUtilisateurs);
            }

            // Cas 2 : L'Admin d'agence - Filtrage strict par son agence
            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agence = utilisateurConnecte;
                List<User> utilisateursAgence = userRepository.findByAgenceEmployeur(agence);
                return ResponseEntity.ok(utilisateursAgence);
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Permissions insuffisantes."));

        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getMonProfil() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/chauffeurs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> recupererChauffeursDeMonAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email).map(utilisateurConnecte -> {
            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                List<User> tousLesChauffeurs = userRepository.findByRole(Role.CHAUFFEUR);
                return ResponseEntity.ok(tousLesChauffeurs);
            }

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agence = utilisateurConnecte;
                List<User> chauffeursAgence = userRepository.findByAgenceAndRole(agence, Role.CHAUFFEUR);
                return ResponseEntity.ok(chauffeursAgence);
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PatchMapping("/{id}/commission")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> modifierTauxCommission(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return userRepository.findById(id).map(u -> {
            if (request.containsKey("taux")) {
                u.setTauxCommission(Double.parseDouble(request.get("taux").toString()));
                userRepository.save(u);
                return ResponseEntity.ok(Map.of("message", "Taux de commission mis à jour avec succès"));
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Données invalides"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> creerCompte(@RequestBody User user) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(emailConnecte).map(utilisateurConnecte -> {
            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                user.setAgenceEmployeur(utilisateurConnecte.getAgenceEmployeur());
            }
            User nouvelUtilisateur = userService.enregistrerUtilisateur(user);
            return ResponseEntity.ok(nouvelUtilisateur);
        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PatchMapping("/update-marchand")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> updateMarchandInfo(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(u -> {
            if(request.containsKey("numeroAirtel")) u.setNumeroAirtel(request.get("numeroAirtel"));
            if(request.containsKey("nomAirtel")) u.setNomAirtel(request.get("nomAirtel"));
            if(request.containsKey("numeroMpesa")) u.setNumeroMpesa(request.get("numeroMpesa"));
            if(request.containsKey("nomMpesa")) u.setNomMpesa(request.get("nomMpesa"));
            if(request.containsKey("numeroOrange")) u.setNumeroOrange(request.get("numeroOrange"));
            if(request.containsKey("nomOrange")) u.setNomOrange(request.get("nomOrange"));

            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Coordonnées de paiement mises à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> updateMonProfil(@RequestBody User details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(u -> {
            if (details.getNom() != null) u.setNom(details.getNom());
            if (details.getTelephone() != null) u.setTelephone(details.getTelephone());
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Profil mis à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/change-password")
    public ResponseEntity<?> changerMotDePasse(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String ancienMdp = request.get("oldPassword");
        String nouveauMdp = request.get("newPassword");

        return userRepository.findByEmail(email).map(user -> {
            if (!passwordEncoder.matches(ancienMdp, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'ancien mot de passe est incorrect"));
            }
            user.setPassword(passwordEncoder.encode(nouveauMdp));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * ACTIVATION / VALIDATION D'UN CHAUFFEUR OU MANAGER
     * Fait repasser le statut de l'utilisateur à 'ACTIF'.
     */
    @PutMapping("/valider-chauffeur/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> validerUtilisateurOuChauffeur(@PathVariable Long id) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            User userCible = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("L'utilisateur à activer n'existe pas"));

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                if (userCible.getAgenceEmployeur() == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Impossible d'activer cet utilisateur : il n'est lié à aucune agence."));
                }
                if (!utilisateurConnecte.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Cet utilisateur n'appartient pas à votre agence."));
                }
            }

            userCible.setStatut("ACTIF");
            userRepository.save(userCible);

            String nomAAfficher = userCible.getNom() != null ? userCible.getNom() : "L'utilisateur";
            return ResponseEntity.ok(Map.of("message", nomAAfficher + " a été activé avec succès."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de l'activation : " + e.getMessage()));
        }
    }

    /**
     * BLOQUER / DÉSACTIVER UN UTILISATEUR
     * Bascule le statut de l'utilisateur à 'INACTIF' sans le supprimer de la base de données.
     */
    @PutMapping("/{id}/bloquer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> bloquerUtilisateur(@PathVariable Long id) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            User userCible = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("L'utilisateur à bloquer n'existe pas"));

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                if (userCible.getAgenceEmployeur() == null ||
                        !utilisateurConnecte.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Ce collaborateur n'appartient pas à votre agence."));
                }
            }

            userCible.setStatut("INACTIF");
            userRepository.save(userCible);

            String nomAAfficher = userCible.getNom() != null ? userCible.getNom() : "L'utilisateur";
            return ResponseEntity.ok(Map.of("message", nomAAfficher + " a été bloqué et désactivé avec succès."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors du blocage : " + e.getMessage()));
        }
    }

    /**
     * SUPPRESSION DÉFINITIVE D'UN UTILISATEUR
     * Retire physiquement la ligne de la base de données.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> supprimerUtilisateur(@PathVariable Long id) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            User userCible = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("L'utilisateur à supprimer n'existe pas"));

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                if (userCible.getAgenceEmployeur() == null ||
                        !utilisateurConnecte.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Ce collaborateur n'appartient pas à votre agence."));
                }
            }

            // Suppression définitive
            userRepository.delete(userCible);

            return ResponseEntity.ok(Map.of("message", "L'utilisateur a été supprimé définitivement."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la suppression : " + e.getMessage()));
        }
    }
// Dans src/main/java/com/example/gariconnectbackend/model/User.java
@PostMapping("/create") // Ou @PostMapping, selon votre route exacte
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
public ResponseEntity<?> createByAdmin(@RequestBody User newUser) {
    try {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

        // 1. Vérification de l'email
        if (userRepository.existsByEmail(newUser.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé"));
        }

        // 2. Cloisonnement : Si c'est un Admin d'agence, l'utilisateur est lié à son agence
        if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
            if (utilisateurConnecte.getAgenceEmployeur() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Erreur : Votre compte administrateur n'est rattaché à aucune agence."));
            }
            newUser.setAgenceEmployeur(utilisateurConnecte.getAgenceEmployeur());
        }

        // 3. Génération du mot de passe temporaire
        String codeTemporaire = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 4. Initialisation des champs obligatoires AVANT la sauvegarde
        newUser.setPassword(passwordEncoder.encode(codeTemporaire)); // Mot de passe chiffré
        newUser.setCodeAcces(codeTemporaire); // Stocker le code en clair si vous voulez l'afficher (optionnel, selon votre design)
        newUser.setStatut("ACTIF");

        // ---> LA CORRECTION DE L'ERREUR SQL EST ICI <---
        newUser.setMustChangePassword(true); // Exige un changement de mot de passe à la prochaine connexion
        // ------------------------------------------------

        userRepository.save(newUser);

        // 5. Retourner le code généré pour que l'admin puisse le communiquer
        return ResponseEntity.ok(Map.of(
                "message", "Utilisateur créé avec succès.",
                "codeAcces", codeTemporaire
        ));

    } catch (Exception e) {
        e.printStackTrace(); // Utile pour voir l'erreur exacte dans la console
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Erreur lors de la création : " + e.getMessage()));
    }
}

}