package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User login(String email, String motDePasse) {
        // 1. Chercher l'utilisateur par email
        Optional<User> userOpt = userRepository.findByEmail(email);

        // 2. Vérifier si l'utilisateur existe et si le mot de passe correspond
        if (userOpt.isPresent() && userOpt.get().getMotDePasse().equals(motDePasse)) {
            return userOpt.get(); // Authentification réussie
        }

        throw new RuntimeException("Email ou mot de passe incorrect");
    }
}