package com.example.gariconnectbackend.controller;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chauffeurs")
@CrossOrigin("*") // Pour autoriser les appels depuis React
public class ChauffeurController {



    @Autowired
    private UserRepository userRepository;


    @GetMapping
    public List<User> getTousLesChauffeurs() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().name().equalsIgnoreCase("CHAUFFEUR"))
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> mettreAJourChauffeur(@PathVariable Long id, @RequestBody User chauffeurDetails) {
        String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(emailAgence).orElseThrow();

        return userRepository.findById(id).map(chauffeur -> {
            // VERIFICATION CRUCIALE : Le chauffeur appartient-il à cette agence ?
            if (chauffeur.getAgenceEmployeur() == null || !chauffeur.getAgenceEmployeur().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé. Ce chauffeur n'appartient pas à votre agence.");
            }

            chauffeur.setNom(chauffeurDetails.getNom());
            chauffeur.setEmail(chauffeurDetails.getEmail());
            chauffeur.setTelephone(chauffeurDetails.getTelephone());

            User misAJour = userRepository.save(chauffeur);
            return ResponseEntity.ok(misAJour);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 3. Supprimer un chauffeur (Sécurisé par Agence)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> supprimerChauffeur(@PathVariable Long id) {
        String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(emailAgence).orElseThrow();

        return userRepository.findById(id).map(chauffeur -> {
            // VERIFICATION CRUCIALE
            if (chauffeur.getAgenceEmployeur() == null || !chauffeur.getAgenceEmployeur().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé. Action impossible.");
            }

            userRepository.delete(chauffeur);
            return ResponseEntity.ok().body("Chauffeur supprimé avec succès !");
        }).orElse(ResponseEntity.notFound().build());
    }


    // 1. Récupérer uniquement les chauffeurs de l'agence connectée
    @GetMapping("/mes-chauffeurs")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<?> getMesChauffeurs() {
        String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(emailAgence)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));

        List<User> chauffeurs = userRepository.findByAgenceEmployeur(agence);
        return ResponseEntity.ok(chauffeurs);
    }


    // NOUVEL ENDPOINT : Récupérer les chauffeurs par trajet
    @GetMapping("/par-trajet")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<?> getChauffeursParTrajet(@RequestParam Long trajetId) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            // Récupère uniquement les CHAUFFEURS de cette agence assignés à ce trajet
            List<User> chauffeurs = userRepository.findByAgenceEmployeurAndRoleAndTrajet_Id(agence, Role.CHAUFFEUR, trajetId);

            return ResponseEntity.ok(chauffeurs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }
}


