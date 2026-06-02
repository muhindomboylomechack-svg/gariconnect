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

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            AuthResponse response = authService.seConnecter(authRequest.getEmail(), authRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> request) {
        try {
            User user = new User();
            user.setNom((String) request.get("nom"));
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));

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

    @GetMapping("/agences-liste")
    public ResponseEntity<?> getAgencesActives() {
        try {
            // NOUVELLE LOGIQUE : L'agence est représentée par son AGENCY_ADMIN actif
            List<User> agences = userRepository.findByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF");
            return ResponseEntity.ok(agences);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la récupération des agences");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(ResponseEntity::ok).orElse(ResponseEntity.status(401).build());
    }
}
