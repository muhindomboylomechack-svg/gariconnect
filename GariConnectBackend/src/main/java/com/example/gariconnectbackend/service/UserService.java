package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injection du PasswordEncoder pour sécuriser l'enregistrement

    public User enregistrerUtilisateur(User user) {
        // 1. GESTION DU MOT DE PASSE COMPLÈTEMENT SÉCURISÉE
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            // Si aucun mot de passe n'est fourni (ex: l'agence crée un chauffeur)
            // On lui attribue un mot de passe temporaire par défaut
            user.setPassword(passwordEncoder.encode("Gari2026!"));
            user.setMustChangePassword(true); // Force le chauffeur à le changer à sa première connexion
        } else {
            // Si un mot de passe est fourni, on vérifie s'il est déjà encodé (au cas où)
            // Sinon, on l'encode avec BCrypt avant l'insertion
            if (!user.getPassword().startsWith("$2a$")) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }

        // 2. SÉCURITÉ COMPLÉMENTAIRE : Éviter que le statut ne soit NULL
        if (user.getStatut() == null || user.getStatut().trim().isEmpty()) {
            user.setStatut("ACTIF");
        }

        // Enregistrement définitif sans risque de violation de contrainte NOT NULL
        return userRepository.save(user);
    }
    public List<User> listerTous() {
        return userRepository.findAll();
    }
    public List<User> listerChauffeurs() {
        return userRepository.findByRole(Role.valueOf("CHAUFFEUR"));
    }

}