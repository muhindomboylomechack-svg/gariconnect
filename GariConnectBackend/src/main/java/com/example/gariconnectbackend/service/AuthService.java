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

    public User inscrire(User user, Long agenceId) {
        // Sécurité : Interdire la création d'un Super Admin via inscription
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new RuntimeException("Action interdite : Le compte Super Admin ne peut pas être créé via une inscription.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setMustChangePassword(false);

        // a. AGENCY_ADMIN : Racine de son agence, en attente de validation du SUPER_ADMIN
        if (user.getRole() == Role.AGENCY_ADMIN) {
            user.setStatut("EN_ATTENTE");
            user.setAgenceEmployeur(null);
        }
        // b. EMPLOYÉS (Manager & Chauffeur) : Doivent avoir une agence, en attente de l'AGENCY_ADMIN
        else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
            if (agenceId == null) throw new RuntimeException("Une agence est obligatoire pour inscrire un employé.");

            User agence = userRepository.findById(agenceId)
                    .orElseThrow(() -> new RuntimeException("Agence employeuse introuvable."));

            user.setAgenceEmployeur(agence);
            user.setStatut("EN_ATTENTE");
        }
        // c. CLIENT : Accès direct
        else {
            user.setStatut("ACTIF");
        }

        return userRepository.save(user);
    }

    public AuthResponse seConnecter(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Identifiants ou utilisateur non trouvé"));

        // Vérification du statut de validation
        if ("EN_ATTENTE".equals(user.getStatut())) {
            if (user.getRole() == Role.AGENCY_ADMIN) {
                throw new RuntimeException("Votre compte Administrateur d'Agence est en attente de validation par GariConnect.");
            } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
                throw new RuntimeException("Votre compte est en attente de validation par l'Administrateur de votre agence.");
            }
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // Génération du Token JWT
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