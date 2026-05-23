package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
@CrossOrigin("*")
public class VehiculeController {

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Récupère les véhicules filtrés par agence et optionnellement par trajet.
     */
    @GetMapping({"/mes-vehicules", "/agence"})
    public ResponseEntity<?> getVehicules(@RequestParam(required = false) Long trajetId) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

            if (trajetId != null) {
                // Filtre les véhicules de l'agence affectés à ce trajet spécifique
                return ResponseEntity.ok(vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId));
            }

            return ResponseEntity.ok(vehiculeRepository.findByAgence(agence));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    /**
     * Récupère les chauffeurs de l'agence affectés à un trajet spécifique.
     */
    @GetMapping("/chauffeurs-par-trajet")
    public ResponseEntity<?> getChauffeursParTrajet(@RequestParam Long trajetId) {
        try {
            // Ici on suppose que vous filtrez les chauffeurs (Users avec rôle CHAUFFEUR) par trajet
            // Cette méthode doit être définie dans votre UserRepository
            return ResponseEntity.ok(userRepository.findByTrajet_IdAndRole(trajetId, com.example.gariconnectbackend.model.Role.CHAUFFEUR));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> creerVehicule(@RequestBody Vehicule vehicule) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

            vehicule.setAgence(agence);
            return ResponseEntity.ok(vehiculeRepository.save(vehicule));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la création : " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modifierVehicule(@PathVariable Long id, @RequestBody Vehicule details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return vehiculeRepository.findById(id).map(v -> {
            if (!v.getAgence().getEmail().equals(email)) {
                return ResponseEntity.status(403).body("Action non autorisée");
            }
            v.setMarque(details.getMarque());
            v.setModele(details.getModele());
            v.setPlaque_immatriculation(details.getPlaque_immatriculation());
            v.setCapacite(details.getCapacite());
            v.setStatut(details.getStatut());
            return ResponseEntity.ok(vehiculeRepository.save(v));
        }).orElse(ResponseEntity.status(404).body("Véhicule introuvable"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerVehicule(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return vehiculeRepository.findById(id).map(v -> {
            if (!v.getAgence().getEmail().equals(email)) {
                return ResponseEntity.status(403).body("Action non autorisée");
            }
            vehiculeRepository.delete(v);
            return ResponseEntity.ok().body("Véhicule supprimé avec succès");
        }).orElse(ResponseEntity.status(404).body("Véhicule introuvable"));
    }

    // NOUVEL ENDPOINT : Récupérer les véhicules par trajet
    @GetMapping("/par-trajet")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<?> getVehiculesParTrajet(@RequestParam Long trajetId) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            // Récupère les véhicules de cette agence assignés à ce trajet
            List<Vehicule> vehicules = vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId);

            return ResponseEntity.ok(vehicules);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }
}