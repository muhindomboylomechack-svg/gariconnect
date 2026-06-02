package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;

@RestController
@RequestMapping("/api/chauffeurs")
@CrossOrigin("*") // Pour autoriser les appels depuis React
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
public class ChauffeurController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Récupérer spécifiquement les chauffeurs de l'entité connectée
     * C'est la route appelée par ton tableau de bord Frontend (GET /api/chauffeurs/mes-chauffeurs)
     */
    @GetMapping("/mes-chauffeurs")
    public ResponseEntity<?> getMesChauffeurs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        // Le Super Admin voit tout
        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            return ResponseEntity.ok(userRepository.findByRole(Role.CHAUFFEUR));
        }

        // CORRECTION CRITIQUE : Définition de l'agence racine
        // Si je suis Admin Agence, c'est moi l'agence. Sinon, c'est mon employeur.
        User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();

        if (agence == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée à ce compte."));
        }

        // On utilise la méthode de ton UserRepository pour filtrer par Agence ET par Role Chauffeur
        List<User> chauffeurs = userRepository.findByAgenceEmployeurAndRole(agence, Role.CHAUFFEUR);
        return ResponseEntity.ok(chauffeurs);
    }

    /**
     * RECRUTEMENT D'UN CHAUFFEUR (Par un Agent ou un Admin)
     */
    @PostMapping("/recruter")
    public ResponseEntity<?> recruterChauffeur(@RequestBody User chauffeurDetails) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

            if (userRepository.existsByEmail(chauffeurDetails.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé par un autre compte."));
            }

            // Définition de l'agence
            User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();

            chauffeurDetails.setAgenceEmployeur(agence);
            chauffeurDetails.setRole(Role.CHAUFFEUR);
            chauffeurDetails.setStatut("EN_ATTENTE"); // En attente de la validation de l'Admin

            // Génération d'un code d'accès temporaire unique à transmettre au chauffeur
            String tempCode = "GARI-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            chauffeurDetails.setCodeAcces(tempCode);
            chauffeurDetails.setPassword(passwordEncoder.encode(tempCode));

            userRepository.save(chauffeurDetails);

            return ResponseEntity.ok(Map.of(
                    "message", "Chauffeur recruté avec succès. En attente de validation.",
                    "code", tempCode
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du recrutement : " + e.getMessage()));
        }
    }

    /**
     * Récupérer la liste globale des chauffeurs
     */
    @GetMapping
    public ResponseEntity<?> getTousLesChauffeurs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            List<User> tousLesChauffeurs = userRepository.findByRole(Role.CHAUFFEUR);
            return ResponseEntity.ok(tousLesChauffeurs);
        }

        User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
        if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence associée."));

        List<User> chauffeursAgence = userRepository.findByAgenceAndRole(agence, Role.CHAUFFEUR);
        return ResponseEntity.ok(chauffeursAgence);
    }

    /**
     * Mettre à jour un chauffeur
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourChauffeur(@PathVariable Long id, @RequestBody User chauffeurDetails) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        return userRepository.findById(id).map(chauffeur -> {
            if (utilisateurConnecte.getRole() != Role.SUPER_ADMIN) {
                User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
                if (chauffeur.getAgenceEmployeur() == null || agence == null || !chauffeur.getAgenceEmployeur().getId().equals(agence.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Ce chauffeur n'appartient pas à votre agence."));
                }
            }

            if (chauffeurDetails.getNom() != null) chauffeur.setNom(chauffeurDetails.getNom());
            if (chauffeurDetails.getEmail() != null) chauffeur.setEmail(chauffeurDetails.getEmail());
            if (chauffeurDetails.getTelephone() != null) chauffeur.setTelephone(chauffeurDetails.getTelephone());

            // On empêche l'agent de changer le statut lui-même, seul l'admin le fait via les endpoints dédiés
            // if (chauffeurDetails.getStatut() != null) chauffeur.setStatut(chauffeurDetails.getStatut());

            User misAJour = userRepository.save(chauffeur);
            return ResponseEntity.ok(misAJour);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Supprimer un chauffeur
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerChauffeur(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        return userRepository.findById(id).map(chauffeur -> {
            if (utilisateurConnecte.getRole() != Role.SUPER_ADMIN) {
                User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
                if (chauffeur.getAgenceEmployeur() == null || agence == null || !chauffeur.getAgenceEmployeur().getId().equals(agence.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Accès refusé."));
                }
            }
            userRepository.delete(chauffeur);
            return ResponseEntity.ok().body(Map.of("message", "Chauffeur supprimé avec succès !"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Récupérer les chauffeurs assignés à un trajet spécifique
     */
    @GetMapping("/par-trajet")
    public ResponseEntity<?> getChauffeursParTrajet(@RequestParam Long trajetId) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                List<User> chauffeursGlobal = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.CHAUFFEUR && u.getTrajet() != null && u.getTrajet().getId().equals(trajetId))
                        .collect(Collectors.toList());
                return ResponseEntity.ok(chauffeursGlobal);
            }

            User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));

            List<User> chauffeursAgence = userRepository.findByAgenceEmployeur(agence).stream()
                    .filter(u -> u.getRole() == Role.CHAUFFEUR && u.getTrajet() != null && u.getTrajet().getId().equals(trajetId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(chauffeursAgence);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }
}