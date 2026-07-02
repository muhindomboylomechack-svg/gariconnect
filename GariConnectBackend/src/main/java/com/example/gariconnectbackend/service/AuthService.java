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
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new RuntimeException("Action interdite : Le compte Super Admin ne peut pas être créé via une inscription.");
        }

        // 🟢 SÉCURITÉ : Vérifier si l'email ou le téléphone existe déjà
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Cet adresse email est déjà utilisée.");
        }

        // Optionnel : Décommente si tu as existsByTelephone dans ton UserRepository
        // if (user.getTelephone() != null && userRepository.existsByTelephone(user.getTelephone())) {
        //     throw new RuntimeException("Ce numéro de téléphone est déjà utilisé.");
        // }

        System.out.println("=== Inscription utilisateur ===");
        System.out.println("Email reçu : " + user.getEmail());
        System.out.println("Téléphone reçu : " + user.getTelephone());

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setMustChangePassword(false);

        // Récupération de l'agence et création du lien relationnel
        if (agenceId != null) {
            User agence = userRepository.findById(agenceId)
                    .orElseThrow(() -> new RuntimeException("L'agence sélectionnée est introuvable."));
            user.setAgenceEmployeur(agence);
        }

        // Gestion des statuts selon le rôle
        if (user.getRole() == Role.AGENCY_ADMIN) {
            user.setStatut("EN_ATTENTE");
            user.setAgenceEmployeur(null);
        } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
            user.setStatut("EN_ATTENTE");
        } else {
            user.setStatut("ACTIF"); // Client ou passager
        }

        return userRepository.save(user);
    }

    public AuthResponse seConnecter(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Identifiants ou utilisateur non trouvé"));

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

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                "Connexion réussie",
                user.getMustChangePassword(),
                user.getPhotoUrl()
        );
    }


}
