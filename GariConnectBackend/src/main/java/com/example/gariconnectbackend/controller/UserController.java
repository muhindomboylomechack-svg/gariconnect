package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getMonProfil() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/commission")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> modifierTauxCommission(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return userRepository.findById(id).map(u -> {
            if (request.containsKey("taux")) {
                Double taux = Double.parseDouble(request.get("taux").toString());
                u.setTauxCommission(taux);
                userRepository.save(u);
                return ResponseEntity.ok(Map.of("message", "Commission mise à jour à " + taux + "%"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Valeur manquante"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/chauffeurs")
    @PreAuthorize("hasRole('AGENCE')")
    public List<User> recupererChauffeursDeMonAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Agence non trouvée"));
        return userRepository.findByAgenceAndRole(agence, Role.CHAUFFEUR);
    }

    @GetMapping
    public List<User> listerTout() {
        return userService.listerTous();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User creerCompte(@RequestBody User user) {
        return userService.enregistrerUtilisateur(user);
    }

    // --- MISE À JOUR DES COORDONNÉES MULTI-OPÉRATEURS ---
    @PatchMapping("/update-marchand")
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> updateMarchandInfo(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email).map(u -> {
            // Mise à jour Airtel
            if(request.containsKey("numeroAirtel")) u.setNumeroAirtel(request.get("numeroAirtel"));
            if(request.containsKey("nomAirtel")) u.setNomAirtel(request.get("nomAirtel"));

            // Mise à jour M-Pesa
            if(request.containsKey("numeroMpesa")) u.setNumeroMpesa(request.get("numeroMpesa"));
            if(request.containsKey("nomMpesa")) u.setNomMpesa(request.get("nomMpesa"));

            // Mise à jour Orange
            if(request.containsKey("numeroOrange")) u.setNumeroOrange(request.get("numeroOrange"));
            if(request.containsKey("nomOrange")) u.setNomOrange(request.get("nomOrange"));

            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Coordonnées de paiement mises à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }
    // --- À AJOUTER DANS UserController.java ---

    @PatchMapping("/profile")
    public ResponseEntity<?> updateMonProfil(@RequestBody User details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email).map(u -> {
            // On ne met à jour que les champs envoyés
            if (details.getNom() != null) u.setNom(details.getNom());
            if (details.getTelephone() != null) u.setTelephone(details.getTelephone());

            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Profil mis à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }
    // Importez PasswordEncoder si ce n'est pas fait
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PatchMapping("/change-password")
    public ResponseEntity<?> changerMotDePasse(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String ancienMdp = request.get("oldPassword");
        String nouveauMdp = request.get("newPassword");

        return userRepository.findByEmail(email).map(user -> {
            // 1. Vérifier si l'ancien mot de passe est correct
            if (!passwordEncoder.matches(ancienMdp, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'ancien mot de passe est incorrect"));
            }

            // 2. Encoder et sauvegarder le nouveau mot de passe
            user.setPassword(passwordEncoder.encode(nouveauMdp));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès"));
        }).orElse(ResponseEntity.notFound().build());
    }
}