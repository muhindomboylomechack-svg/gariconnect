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
        String adminEmail = "admin@gariconnect.com";
        String adminPassword = "AdminGari2026!";

        // 🔥 CORRECTION : Utilisation de existsByEmail() qui est beaucoup plus fiable,
        // rapide et qui évite les faux négatifs causant la violation de contrainte unique.
        if (!userRepository.existsByEmail(adminEmail)) {
            User superAdmin = new User();
            superAdmin.setNom("Super Admin");
            superAdmin.setEmail(adminEmail);
            superAdmin.setTelephone("000000000");

            // Rôle global de contrôle de la plateforme
            superAdmin.setRole(Role.SUPER_ADMIN);
            superAdmin.setStatut("ACTIF"); // Actif d'office

            // Mot de passe sécurisé et haché
            superAdmin.setPassword(passwordEncoder.encode(adminPassword));

            // Le Super Admin n'est lié à aucune agence car il supervise toutes les agences
            superAdmin.setAgenceEmployeur(null);
            superAdmin.setMustChangePassword(false);

            userRepository.save(superAdmin);

            // Affichage des messages système et des identifiants dans la console
            System.out.println(">>> [SYSTEM] Compte SUPER_ADMIN unique initialisé automatiquement avec succès.");
            System.out.println("=======================================================================");
            System.out.println("   🚀 IDENTIFIANTS DE CONNEXION DU SUPER ADMIN : ");
            System.out.println("   📧 Email    : " + adminEmail);
            System.out.println("   🔑 Password : " + adminPassword);
            System.out.println("=======================================================================");
        } else {
            // Optionnel : Permet de confirmer dans les logs de Render que la sécurité a fonctionné
            System.out.println(">>> [SYSTEM] Le SUPER_ADMIN existe déjà en base de données. Initialisation ignorée.");
        }
    }
}