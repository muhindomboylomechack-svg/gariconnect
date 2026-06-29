package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.service.TrajetService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trajets")
@CrossOrigin("*")
public class TrajetController {

    @Autowired
    private TrajetRepository trajetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrajetService trajetService;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    // ==========================================
    // 1. ENDPOINTS PUBLICS / CONSULTATION
    // ==========================================

    @GetMapping("/tous")
    public List<Trajet> getTousLesTrajets() {
        return trajetRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTrajetById(@PathVariable Long id) {
        try {
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));
            return ResponseEntity.ok(trajet);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/agence/{agenceId}")
    public ResponseEntity<List<Trajet>> getTrajetsParAgence(@PathVariable Long agenceId) {
        List<Trajet> trajets = trajetRepository.findAll().stream()
                .filter(t -> t.getAgence() != null && t.getAgence().getId().equals(agenceId))
                .collect(Collectors.toList());
        return ResponseEntity.ok(trajets);
    }

    // ==========================================
    // 2. ENDPOINTS CHAUFFEUR
    // ==========================================

    @GetMapping("/mes-trajets")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getMesTrajetsChauffeur() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User chauffeur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

            List<Trajet> trajets = trajetRepository.findAll().stream()
                    .filter(t -> t.getChauffeur() != null && t.getChauffeur().getId().equals(chauffeur.getId()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(trajets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur lors de la récupération de vos trajets : " + e.getMessage()));
        }
    }

    @GetMapping("/mon-historique")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getMonHistoriqueChauffeur() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User chauffeur = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Votre session est invalide ou le chauffeur n'existe plus."));

            List<Trajet> historiqueTrajets = trajetRepository.findByChauffeurId(chauffeur.getId());
            return ResponseEntity.ok(historiqueTrajets);
        } catch (Exception e) {
            System.err.println("❌ Erreur Historique Chauffeur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Impossible de récupérer l'historique : " + e.getMessage()));
        }
    }

    @GetMapping("/mon-historique/aujourdhui")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getTrajetsAujourdhuiChauffeur() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            User chauffeur = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Votre session est invalide ou le chauffeur n'existe plus."));

            List<Trajet> trajetsAujourdhui = trajetService.getTrajetsDuJour(chauffeur.getId());
            return ResponseEntity.ok(trajetsAujourdhui);
        } catch (Exception e) {
            System.err.println("❌ Erreur Trajets Aujourd'hui Chauffeur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Impossible de récupérer les trajets d'aujourd'hui : " + e.getMessage()));
        }
    }

    // ==========================================
    // 3. ENDPOINTS MANAGEMENT (AGENCE & ADMIN)
    // ==========================================

    @GetMapping("/mes-chauffeurs")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getChauffeursDeMonAgence() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            Long agenceId = (currentUser.getRole() == Role.AGENCY_ADMIN)
                    ? currentUser.getId()
                    : (currentUser.getAgenceEmployeur() != null ? currentUser.getAgenceEmployeur().getId() : null);

            if (agenceId == null) {
                return ResponseEntity.badRequest().body("Vous n'êtes rattaché à aucune agence.");
            }

            List<User> chauffeurs = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
            return ResponseEntity.ok(chauffeurs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    @PostMapping("/creer")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> creerTrajet(@RequestBody Trajet trajet) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            User agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                    ? utilisateurConnecte
                    : utilisateurConnecte.getAgenceEmployeur();

            if (agence == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Erreur : Impossible de déterminer l'agence propriétaire."));
            }

            trajet.setAgence(agence);

            if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
                User chauffeur = userRepository.findById(trajet.getChauffeur().getId())
                        .orElseThrow(() -> new RuntimeException("Chauffeur spécifié introuvable"));
                trajet.setChauffeur(chauffeur);
            }

            if (trajet.getVehicule() != null && trajet.getVehicule().getId() != null) {
                Vehicule vehicule = vehiculeRepository.findById(trajet.getVehicule().getId())
                        .orElseThrow(() -> new RuntimeException("Véhicule spécifié introuvable"));
                trajet.setVehicule(vehicule);
            }

            Trajet nouveauTrajet = trajetService.creerTrajet(trajet);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la création du trajet : " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet details) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                    ? utilisateurConnecte.getId()
                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Action non autorisée.");
            }

            Trajet trajetMisAJour = trajetService.modifierTrajet(id, details, agenceId);
            return ResponseEntity.ok(trajetMisAJour);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de modification : " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté introuvable"));

            Long agenceId = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                    ? utilisateurConnecte.getId()
                    : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);

            if (agenceId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Action non autorisée.");
            }

            trajetService.supprimerTrajet(id, agenceId);
            return ResponseEntity.ok(Map.of("message", "Trajet supprimé avec succès."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de suppression : " + e.getMessage());
        }
    }
}