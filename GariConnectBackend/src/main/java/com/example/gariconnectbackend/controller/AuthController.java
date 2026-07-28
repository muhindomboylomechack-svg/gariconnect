package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.AuthRequest;
import com.example.gariconnectbackend.dto.AuthResponse;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> request) {
        try {
            User user = new User();
            user.setNom((String) request.get("nom"));
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));

            // 🟢 AJOUT : Extraction et assignation du numéro de téléphone
            if (request.containsKey("telephone")) {
                user.setTelephone((String) request.get("telephone"));
            }

            String roleStr = (String) request.get("role");
            if (roleStr != null) {
                user.setRole(Role.valueOf(roleStr.toUpperCase()));
            }

            Long agenceId = null;
            if (request.containsKey("agenceId") && request.get("agenceId") != null && !request.get("agenceId").toString().trim().isEmpty()) {
                agenceId = Long.parseLong(request.get("agenceId").toString().trim());
            } else if (request.containsKey("agenceEmployeur") && request.get("agenceEmployeur") != null) {
                Object agenceEmployeurObj = request.get("agenceEmployeur");
                if (agenceEmployeurObj instanceof Map) {
                    Map<?, ?> agenceMap = (Map<?, ?>) agenceEmployeurObj;
                    Object idObj = agenceMap.get("id");
                    if (idObj != null && !idObj.toString().trim().isEmpty()) {
                        agenceId = Long.parseLong(idObj.toString().trim());
                    }
                }
            }

            User utilisateurInscrit = authService.inscrire(user, agenceId);
            return ResponseEntity.ok(utilisateurInscrit);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rôle spécifié invalide."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            AuthResponse response = authService.seConnecter(authRequest.getEmail(), authRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }


    @GetMapping("/agences-liste")
    public ResponseEntity<?> getAgencesActives() {
        try {
            List<User> agences = userRepository.findByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF");
            return ResponseEntity.ok(agences);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la récupération des agences");
        }
    }

//    @GetMapping("/me")
//    public ResponseEntity<?> getCurrentUser() {
//        String email = SecurityContextHolder.getContext().getAuthentication().getName();
//        return userRepository.findByEmail(email)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.status(401).build());
//    }
    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request) {
        // Récupération de l'email depuis le contexte de sécurité ou du payload si besoin
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // Au cas où le token ne porte pas le nom (ex: anonyme), on peut aussi accepter l'email dans le body
        if (email == null || "anonymousUser".equals(email)) {
            email = request.get("email");
        }

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email de l'utilisateur introuvable."));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le nouveau mot de passe ne peut pas être vide."));
        }

        // Hachage du nouveau mot de passe définitif
        user.setPassword(passwordEncoder.encode(newPassword));

        // 🟢 L'utilisateur a changé son code secret, il peut maintenant accéder à l'application normalement
        user.setMustChangePassword(false);

        // Optionnel : On nettoie le code d'accès temporaire
        user.setCodeAcces(null);

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès !"));
    }
    // =========================================================================================
    // 🔥 MODIFICATION ICI : Endpoint /me enrichi pour renvoyer les données de l'agence
    // =========================================================================================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }

        return userRepository.findByEmail(email).map(user -> {
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("email", user.getEmail());
            profile.put("nom", user.getNom());
            profile.put("role", user.getRole() != null ? user.getRole().name() : null);
            profile.put("statut", user.getStatut());
            profile.put("telephone", user.getTelephone());
            profile.put("photoUrl", user.getPhotoUrl());
            profile.put("mustChangePassword", user.getMustChangePassword());

            // Récupération sécurisée des coordonnées de l'agence (Multi-tenant)
            String telAdmin = null;
            String emailAdmin = null;
            String nomAdmin = null;

            if (user.getAgenceEmployeur() != null) {
                telAdmin = user.getAgenceEmployeur().getTelephone();
                emailAdmin = user.getAgenceEmployeur().getEmail();
                nomAdmin = user.getAgenceEmployeur().getNom();
            }

            profile.put("agenceTelephone", telAdmin);
            profile.put("agenceEmail", emailAdmin);
            profile.put("agenceNom", nomAdmin);

            // On conserve aussi l'objet agenceEmployeur complet au cas où le front l'utilise
            profile.put("agenceEmployeur", user.getAgenceEmployeur());

            return ResponseEntity.ok((Object) profile);
        }).orElse(ResponseEntity.status(401).body(Map.of("message", "Utilisateur non trouvé")));
    }
}
