package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@CrossOrigin(origins = "*") // Important pour React
@RestController
@RequestMapping("/api/admin") // La base de l'URL
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    // --- POUR LE SUPER ADMIN : Valider une Agence ---
    @PutMapping("/valider-agence/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Seul l'admin peut valider une agence
    public ResponseEntity<?> validerAgence(@PathVariable Long id) {
        User agence = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));

        if (agence.getRole() != Role.AGENCE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet utilisateur n'est pas une agence"));
        }

        agence.setStatut("ACTIF");
        userRepository.save(agence);

        return ResponseEntity.ok(Map.of("message", "L'agence " + agence.getNom() + " a été validée avec succès."));
    }
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            // Simulation/Calcul des données demandées par votre Front-end
            Map<String, Object> stats = new HashMap<>();

            // 1. Statistiques simples
            stats.put("totalCommissions", 150000); // À remplacer par un calcul en base
            stats.put("totalAgences", userRepository.countByRole(Role.AGENCE));
            stats.put("totalClients", userRepository.countByRole(Role.CLIENT));
            stats.put("totalReservations", 450);

            // 2. Données du graphique (chartData)
            List<Map<String, Object>> chartData = List.of(
                    Map.of("name", "Jan", "revenu", 4000),
                    Map.of("name", "Feb", "revenu", 3000),
                    Map.of("name", "Mar", "revenu", 5000)
            );
            stats.put("chartData", chartData);

            // 3. Activités récentes
            List<Map<String, String>> activities = List.of(
                    Map.of("user", "Agence Horizon", "action", "Nouveau chauffeur ajouté", "time", "Il y a 2 min"),
                    Map.of("user", "Jean Dupont", "action", "Réservation Kinshasa-Goma", "time", "Il y a 10 min")
            );
            stats.put("recentActivities", activities);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors du calcul des stats");
        }
    }
    // --- POUR L'AGENCE : Valider son Chauffeur ---
    @PutMapping("/valider-chauffeur/{id}")
    @PreAuthorize("hasRole('AGENCE')") // Seule l'agence peut valider ses chauffeurs
    public ResponseEntity<?> validerChauffeur(@PathVariable Long id) {
        // 1. Récupérer l'agence connectée
        String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
        User agenceConnectee = userRepository.findByEmail(emailAgence).orElseThrow();

        // 2. Récupérer le chauffeur
        User chauffeur = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        // 3. Vérifier que le chauffeur appartient bien à cette agence
        // Note: Assure-toi que ton entité User a bien la relation agenceEmployeur
        if (!agenceConnectee.equals(chauffeur.getAgenceEmployeur())) {
            return ResponseEntity.status(403).body(Map.of("message", "Ce chauffeur ne fait pas partie de votre agence"));
        }

        chauffeur.setStatut("ACTIF");
        userRepository.save(chauffeur);

        return ResponseEntity.ok(Map.of("message", "Le chauffeur " + chauffeur.getNom() + " est désormais actif."));
    }

    // Cette méthode répond à : GET /api/admin/users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        // Récupère tout le monde (Agences, Chauffeurs, Clients) pour l'admin
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }
//Méthode pour valider l'agence (EN_ATTENTE -> ACTIF)
    @PutMapping("/users/{id}/valider")
    public ResponseEntity<?> validerUtilisateur(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setStatut("ACTIF");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Utilisateur validé avec succès !"));
    }
    // Dans AdminController.java

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/users/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createByAdmin(@RequestBody User newUser) {
        if (userRepository.existsByEmail(newUser.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé"));
        }

        // On définit un mot de passe par défaut (ex: Gari2024!) ou on génère un mot de passe
        // L'utilisateur pourra le changer plus tard
        newUser.setPassword(passwordEncoder.encode("Gari2024!"));

        // On s'assure que le statut est ACTIF si créé par l'admin
        newUser.setStatut("ACTIF");

        userRepository.save(newUser);
        return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès"));
    }
     @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès"));
    }
}
