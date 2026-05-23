package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // On vérifie si un utilisateur avec cet email existe déjà
        if (userRepository.findByEmail("admin@gariconnect.com").isEmpty()) {
            User admin = new User();
            admin.setNom("Super Admin");
            admin.setEmail("admin@gariconnect.com");
            admin.setTelephone("00000000");
            admin.setRole(Role.ADMIN);
            admin.setStatut("ACTIF");

            // On met un mot de passe temporaire
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setMustChangePassword(true); // On le force à changer au 1er login

            userRepository.save(admin);
            System.out.println(">>> Compte Admin créé par défaut : admin@gariconnect.com / admin123");
        }
    }
}