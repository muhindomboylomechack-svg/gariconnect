package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;

@RestController
@RequestMapping("/api/chauffeurs")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
public class ChauffeurController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TrajetRepository trajetRepository; // 🟢 À AJOUTER

    /**
     * 🟢 RÉCUPÉRER UNIQUEMENT LES CHAUFFEURS LIBRES (POUR LA CRÉATION DE TRAJET)
     */
//    @GetMapping("/disponibles")
//    public ResponseEntity<?> getChauffeursDisponibles() {
//        try {
//            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));
//
//            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
//                    ? utilisateurConnecte.getId()
//                    : utilisateurConnecte.getAgenceEmployeur().getId();
//
//            // Filtrage strict : on exclut ceux qui sont "Aligné a un trajet"
//            List<User> chauffeursLibres = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId).stream()
//                    .filter(c -> c.getStatut() == null || !c.getStatut().equalsIgnoreCase("Aligné a un trajet"))
//                    .collect(Collectors.toList());
//
//            return ResponseEntity.ok(chauffeursLibres);
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur serveur : " + e.getMessage()));
//        }
//    }

    @GetMapping("/mes-chauffeurs")
    public ResponseEntity<?> getMesChauffeurs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            return ResponseEntity.ok(userRepository.findByRole(Role.CHAUFFEUR));
        }

        User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();

        if (agence == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée à ce compte."));
        }

        List<User> chauffeurs = userRepository.findByAgenceEmployeurAndRole(agence, Role.CHAUFFEUR);
        return ResponseEntity.ok(chauffeurs);
    }

    @PostMapping("/recruter")
    public ResponseEntity<?> recruterChauffeur(@RequestBody User chauffeurDetails) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

            if (userRepository.existsByEmail(chauffeurDetails.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cet email est déjà utilisé."));
            }

            User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();

            chauffeurDetails.setAgenceEmployeur(agence);
            chauffeurDetails.setRole(Role.CHAUFFEUR);
            chauffeurDetails.setStatut("DISPONIBLE"); // Statut propre à la création

            String tempCode = "GARI-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            chauffeurDetails.setCodeAcces(tempCode);
            chauffeurDetails.setPassword(passwordEncoder.encode(tempCode));

            userRepository.save(chauffeurDetails);

            return ResponseEntity.ok(Map.of(
                    "message", "Chauffeur recruté avec succès.",
                    "code", tempCode
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du recrutement : " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getTousLesChauffeurs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
            return ResponseEntity.ok(userRepository.findByRole(Role.CHAUFFEUR));
        }

        User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
        if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence associée."));

        return ResponseEntity.ok(userRepository.findByAgenceAndRole(agence, Role.CHAUFFEUR));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourChauffeur(@PathVariable Long id, @RequestBody User chauffeurDetails) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User utilisateurConnecte = userRepository.findByEmail(email).orElseThrow();

        return userRepository.findById(id).map(chauffeur -> {
            if (utilisateurConnecte.getRole() != Role.SUPER_ADMIN) {
                User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN) ? utilisateurConnecte : utilisateurConnecte.getAgenceEmployeur();
                if (chauffeur.getAgenceEmployeur() == null || agence == null || !chauffeur.getAgenceEmployeur().getId().equals(agence.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Accès refusé."));
                }
            }

            if (chauffeurDetails.getNom() != null) chauffeur.setNom(chauffeurDetails.getNom());
            if (chauffeurDetails.getEmail() != null) chauffeur.setEmail(chauffeurDetails.getEmail());
            if (chauffeurDetails.getTelephone() != null) chauffeur.setTelephone(chauffeurDetails.getTelephone());

            User misAJour = userRepository.save(chauffeur);
            return ResponseEntity.ok(misAJour);
        }).orElse(ResponseEntity.notFound().build());
    }

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

    /**
     * 🟢 RÉCUPÉRER UNIQUEMENT LES CHAUFFEURS LIBRES À UNE DATE PRÉCISE
     */
    @GetMapping("/disponibles")
    public ResponseEntity<?> getChauffeursDisponibles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));

            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                    ? utilisateurConnecte.getId()
                    : utilisateurConnecte.getAgenceEmployeur().getId();

            // 1. Récupérer les ID des chauffeurs occupés ce jour-là
            List<Long> chauffeursOccupes = (date != null)
                    ? trajetRepository.findBusyChauffeurIdsByDate(date)
                    : List.of();

            // 2. Filtrer et exclure les chauffeurs occupés
            List<User> chauffeursLibres = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId).stream()
                    .filter(c -> !chauffeursOccupes.contains(c.getId())) // Remplace l'ancien filtre textuel
                    .collect(Collectors.toList());

            return ResponseEntity.ok(chauffeursLibres);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur serveur : " + e.getMessage()));
        }
    }
}
