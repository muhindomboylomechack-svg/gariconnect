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

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            AuthResponse response = authService.seConnecter(authRequest.getEmail(), authRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Renvoie l'erreur de "Compte en attente" ou "Identifiants invalides"
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

   // @PostMapping("/register")
/*
    public ResponseEntity<?> register(@RequestBody User userRequest) {
        try {
            String passwordEnClair = userRequest.getPassword();

            // 1. Extraire l'ID de l'agence si c'est un chauffeur
            Long agenceId = null;
            if (userRequest.getAgenceEmployeur() != null) {
                agenceId = userRequest.getAgenceEmployeur().getId();
            }

            // 2. Appeler le service avec les DEUX arguments requis
            authService.inscrire(userRequest, agenceId);

            // 3. Récupère le token immédiatement (Auto-login)
            AuthResponse response = authService.seConnecter(userRequest.getEmail(), passwordEnClair);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }*/
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> request) {
        try {
            // 1. Extraction et création manuelle sécurisée de l'utilisateur
            User user = new User();
            user.setNom((String) request.get("nom"));
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));

            // Gestion sécurisée du Rôle
            String roleStr = (String) request.get("role");
            if (roleStr != null) {
                user.setRole(Role.valueOf(roleStr.toUpperCase()));
            }

            // 2. Extraction défensive de l'agenceId (gère le cas où le front envoie "" ou { id: "" })
            Long agenceId = null;

            if (request.containsKey("agenceId") && request.get("agenceId") != null && !request.get("agenceId").toString().trim().isEmpty()) {
                agenceId = Long.parseLong(request.get("agenceId").toString().trim());
            }
            else if (request.containsKey("agenceEmployeur") && request.get("agenceEmployeur") != null) {
                // Si le frontend envoie sous la forme agenceEmployeur: { id: ... }
                Object agenceEmployeurObj = request.get("agenceEmployeur");
                if (agenceEmployeurObj instanceof Map) {
                    Map<?, ?> agenceMap = (Map<?, ?>) agenceEmployeurObj;
                    Object idObj = agenceMap.get("id");
                    if (idObj != null && !idObj.toString().trim().isEmpty()) {
                        agenceId = Long.parseLong(idObj.toString().trim());
                    }
                }
            }

            // 3. Appel de votre service d'inscription existant
            User utilisateurInscrit = authService.inscrire(user, agenceId);

            // On retourne l'utilisateur créé avec un statut 200 OK
            return ResponseEntity.ok(utilisateurInscrit);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rôle spécifié invalide."));
        } catch (Exception e) {
            // Capture toutes les erreurs (ex: "Une agence est obligatoire pour un chauffeur") et renvoie un JSON propre
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        String newPassword = request.get("newPassword");
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès !"));
    }
    // Dans AuthController.java

    @GetMapping("/agences-liste")
    public ResponseEntity<?> getAgencesActives() {
        try {
            // On récupère uniquement les utilisateurs avec le rôle AGENCE
            // ET qui ont été validés (statut ACTIF)
            List<User> agences = userRepository.findByRoleAndStatut(Role.AGENCE, "ACTIF");

            // Pour déboguer : affiche dans ta console Spring si des agences sont trouvées
            System.out.println("Nombre d'agences actives trouvées : " + agences.size());

            return ResponseEntity.ok(agences);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la récupération des agences");
        }
    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }
}