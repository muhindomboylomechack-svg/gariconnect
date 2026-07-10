package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // =========================================================================================
    // 1. GESTION DU PROFIL ET DE L'AVATAR
    // =========================================================================================

    @GetMapping("/profile")
    public ResponseEntity<?> obtenirProfilUtilisateurConnecte() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();

            if (emailConnecte == null || emailConnecte.equals("anonymousUser")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié ou session expirée."));
            }

            return userRepository.findByEmail(emailConnecte)
                    .map(user -> ResponseEntity.ok((Object) user))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "Profil utilisateur introuvable en base de données.")));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du chargement du profil : " + e.getMessage()));
        }
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

    @PostMapping("/profile/avatar")
    public ResponseEntity<?> modifierAvatar(@RequestParam("avatar") MultipartFile file) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le fichier envoyé est vide"));
            }

            String nomFichierOriginal = file.getOriginalFilename();
            String extension = nomFichierOriginal != null && nomFichierOriginal.contains(".")
                    ? nomFichierOriginal.substring(nomFichierOriginal.lastIndexOf("."))
                    : ".jpg";

            String nouveauNomFichier = java.util.UUID.randomUUID().toString() + extension;
            String dossierUpload = System.getProperty("user.dir") + "/uploads/";

            File dossier = new File(dossierUpload);
            if (!dossier.exists()) {
                dossier.mkdirs();
            }

            java.nio.file.Path cheminFichier = java.nio.file.Paths.get(dossierUpload + nouveauNomFichier);
            java.nio.file.Files.copy(file.getInputStream(), cheminFichier, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String urlAvatar = "http://localhost:8080/uploads/" + nouveauNomFichier;
            user.setPhotoUrl(urlAvatar);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Photo de profil mise à jour avec succès !",
                    "photoUrl", urlAvatar
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du traitement du fichier : " + e.getMessage()));
        }
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
// =========================================================================================
    // 🏢 COMPTAGE DYNAMIQUE DES AGENCES (AGENCY_ADMIN)
    // =========================================================================================

    /**
     * URL d'accès : GET http://localhost:8080/api/users/count-agencies
     * Permet de récupérer le nombre exact d'utilisateurs ayant le rôle AGENCY_ADMIN
     */
    @GetMapping("/count-agencies")
    public ResponseEntity<?> obtenirNombreAgences() {
        try {
            // Utilisation directe de la méthode countByRole générée par Spring Data JPA
            long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);

            // On renvoie le résultat proprement dans un Map (format JSON pour React)
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", totalAgences
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Erreur lors du comptage : " + e.getMessage(),
                            "count", 0
                    ));
        }
    }
    // =========================================================================================
    // 2. CRÉATION D'UTILISATEURS
    // =========================================================================================

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> creerCompte(@RequestBody User user) {
        String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(emailConnecte).map(utilisateurConnecte -> {
            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agence = (utilisateurConnecte.getAgenceEmployeur() != null)
                        ? utilisateurConnecte.getAgenceEmployeur()
                        : utilisateurConnecte;
                user.setAgenceEmployeur(agence);
            }

            if (userRepository.existsByEmail(user.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Erreur : Cet email est déjà utilisé !"));
            }

            User nouvelUtilisateur = userService.enregistrerUtilisateur(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouvelUtilisateur);
        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // =========================================================================================
    // 3. GESTION DES STATUTS ET COMMISSIONS
    // =========================================================================================

    @PutMapping("/valider-chauffeur/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> validerUtilisateurOuChauffeur(@PathVariable Long id) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

            User userCible = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur inexistant"));

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agenceAdmin = (utilisateurConnecte.getAgenceEmployeur() != null) ? utilisateurConnecte.getAgenceEmployeur() : utilisateurConnecte;
                if (userCible.getAgenceEmployeur() == null || !agenceAdmin.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Non autorisé."));
                }
            }

            userCible.setStatut("ACTIF");
            userRepository.save(userCible);
            return ResponseEntity.ok(Map.of("message", "Utilisateur activé avec succès."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur d'activation : " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/bloquer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> bloquerUtilisateur(@PathVariable Long id) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte).orElseThrow();

            User userCible = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur inexistant"));

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agenceAdmin = (utilisateurConnecte.getAgenceEmployeur() != null) ? utilisateurConnecte.getAgenceEmployeur() : utilisateurConnecte;
                if (userCible.getAgenceEmployeur() == null || !agenceAdmin.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Non autorisé."));
                }
            }

            userCible.setStatut("INACTIF");
            userRepository.save(userCible);
            return ResponseEntity.ok(Map.of("message", "Utilisateur bloqué avec succès."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur de blocage : " + e.getMessage()));
        }
    }

    // 🔥 MODIFICATION CRITIQUE ICI : Validation stricte du rôle AGENCY_ADMIN
    @PatchMapping("/{id}/commission")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> modifierTauxCommission(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return userRepository.findById(id).map(u -> {

            // 🟢 PROTECTION : Impossible d'appliquer une commission à un employé. Uniquement à l'entreprise.
            if (u.getRole() != Role.AGENCY_ADMIN) {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Erreur structurelle : Le taux de commission ne peut être appliqué qu'à une entreprise (AGENCY_ADMIN), pas à un employé (" + u.getRole() + ")."));
            }

            if (request.containsKey("taux")) {
                u.setTauxCommission(Double.parseDouble(request.get("taux").toString()));
                userRepository.save(u);
                return ResponseEntity.ok(Map.of("message", "Taux de commission mis à jour avec succès pour l'entreprise."));
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Données invalides"));
        }).orElse(ResponseEntity.notFound().build());
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

    // =========================================================================================
    // 4. SUPPRESSION ET LISTES
    // =========================================================================================

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
                User agenceAdmin = (utilisateurConnecte.getAgenceEmployeur() != null)
                        ? utilisateurConnecte.getAgenceEmployeur()
                        : utilisateurConnecte;

                if (userCible.getAgenceEmployeur() == null ||
                        !agenceAdmin.getId().equals(userCible.getAgenceEmployeur().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Action non autorisée : Ce collaborateur n'appartient pas à votre agence."));
                }
            }

            userRepository.delete(userCible);
            return ResponseEntity.ok(Map.of("message", "L'utilisateur a été supprimé définitivement."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la suppression : " + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> listerUtilisateursParRoleEtAgence() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));

            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(userRepository.findAll());
            }
            else {
                Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte.getId()
                        : utilisateurConnecte.getAgenceEmployeur().getId();

                if (agenceId == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Votre profil n'est lié à aucune agence."));
                }

                List<User> collaborateurs = userRepository.findByAgenceEmployeurIdOrId(agenceId, agenceId);
                return ResponseEntity.ok(collaborateurs);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur serveur : " + e.getMessage()));
        }
    }

    @GetMapping("/chauffeurs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> recupererChauffeursDeMonAgence() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));

            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(userRepository.findByRole(Role.CHAUFFEUR));
            }
            else {
                Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte.getId()
                        : utilisateurConnecte.getAgenceEmployeur().getId();

                List<User> chauffeurs = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
                return ResponseEntity.ok(chauffeurs);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur serveur : " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> createByAdmin(@RequestBody User newUser) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            if (userRepository.existsByEmail(newUser.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé."));
            }

            if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                User agence = (utilisateurConnecte.getAgenceEmployeur() != null)
                        ? utilisateurConnecte.getAgenceEmployeur()
                        : utilisateurConnecte;
                newUser.setAgenceId(agence.getId());
                newUser.setAgenceEmployeur(agence);
            }

            User utilisateurSauvegarde = userService.enregistrerUtilisateur(newUser);

            return ResponseEntity.ok(Map.of(
                    "message", "Utilisateur créé avec succès.",
                    "codeAcces", utilisateurSauvegarde.getCodeAcces() != null ? utilisateurSauvegarde.getCodeAcces() : "N/A"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la création : " + e.getMessage()));
        }
    }

    // 🟢 Cette route sert votre frontend pour lister UNIQUEMENT les vraies entreprises dans la gestion des commissions
    @GetMapping("/agencies")
    public ResponseEntity<List<User>> obtenirToutesLesAgences() {
        try {
            // Filtrage strict : Seules les entités de type AGENCY_ADMIN sont remontées à l'interface de commission
            List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
            return ResponseEntity.ok(agences);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/creer-employe")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN')")
    public ResponseEntity<?> creerEmployeManuellement(@RequestBody User user) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé."));

            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                user.setRole(Role.AGENCY_ADMIN);
            } else if (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) {
                if (user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.AGENCY_ADMIN) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Action refusée : Vous n'êtes pas autorisé à créer ce type de rôle."));
                }

                User agence = (utilisateurConnecte.getAgenceEmployeur() != null)
                        ? utilisateurConnecte.getAgenceEmployeur()
                        : utilisateurConnecte;
                user.setAgenceId(agence.getId());
                user.setAgenceEmployeur(agence);
            }

            User utilisateurSauvegarde = userService.enregistrerUtilisateur(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Utilisateur créé avec succès.",
                    "codeAcces", utilisateurSauvegarde.getCodeAcces() != null ? utilisateurSauvegarde.getCodeAcces() : "N/A"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la création : " + e.getMessage()));
        }
    }


}
