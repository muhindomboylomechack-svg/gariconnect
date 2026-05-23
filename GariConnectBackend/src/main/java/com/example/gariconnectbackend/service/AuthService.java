package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.AuthResponse;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
     // Dans AuthService.java
    public User inscrire(User user, Long agenceId) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setMustChangePassword(true); // Le chauffeur devra changer son mot de passe à la 1ère connexion

        if (user.getRole() == Role.CHAUFFEUR) {
            if (agenceId == null) throw new RuntimeException("Une agence est obligatoire pour un chauffeur.");

            User agence = userRepository.findById(agenceId)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            user.setAgenceEmployeur(agence);
            user.setStatut("EN_ATTENTE"); // Validation par l'agence requise
        } else if (user.getRole() == Role.AGENCE) {
            user.setStatut("EN_ATTENTE"); // Validation par l'ADMIN requise
        } else {
            user.setStatut("ACTIF");
        }

        return userRepository.save(user);
    }
    public AuthResponse seConnecter(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 4. VERIFICATION DU STATUT : Empêche la connexion si non validé
        if ("EN_ATTENTE".equals(user.getStatut())) {
            if (user.getRole() == Role.AGENCE) {
                throw new RuntimeException("Votre compte agence est en attente de validation par l'administrateur.");
            } else if (user.getRole() == Role.CHAUFFEUR) {
                throw new RuntimeException("Votre compte chauffeur doit être validé par votre agence.");
            }
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // 5. Génération du Token JWT
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                "Connexion réussie",
                user.getMustChangePassword()
        );
    }
}
