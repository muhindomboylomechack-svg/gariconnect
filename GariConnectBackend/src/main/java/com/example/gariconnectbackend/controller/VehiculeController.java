//package com.example.gariconnectbackend.controller;
//
//import com.example.gariconnectbackend.model.User;
//import com.example.gariconnectbackend.model.Vehicule;
//import com.example.gariconnectbackend.repository.VehiculeRepository;
//import com.example.gariconnectbackend.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.web.bind.annotation.*;
//
//        import java.util.List;
//
//@RestController
//@RequestMapping("/api/vehicules")
//@CrossOrigin("*")
//public class VehiculeController {
//
//    @Autowired
//    private VehiculeRepository vehiculeRepository;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    /**
//     * Récupère les véhicules filtrés par agence et optionnellement par trajet.
//     */
//    @GetMapping({"/mes-vehicules", "/agence"})
//    public ResponseEntity<?> getVehicules(@RequestParam(required = false) Long trajetId) {
//        try {
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//            User agence = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
//
//            if (trajetId != null) {
//                // Filtre les véhicules de l'agence affectés à ce trajet spécifique
//                return ResponseEntity.ok(vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId));
//            }
//
//            return ResponseEntity.ok(vehiculeRepository.findByAgence(agence));
//        } catch (Exception e) {
//            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
//        }
//    }
//
//    /**
//     * Récupère les chauffeurs de l'agence affectés à un trajet spécifique.
//     */
//    @GetMapping("/chauffeurs-par-trajet")
//    public ResponseEntity<?> getChauffeursParTrajet(@RequestParam Long trajetId) {
//        try {
//            // Ici on suppose que vous filtrez les chauffeurs (Users avec rôle CHAUFFEUR) par trajet
//            // Cette méthode doit être définie dans votre UserRepository
//            return ResponseEntity.ok(userRepository.findByTrajet_IdAndRole(trajetId, com.example.gariconnectbackend.model.Role.CHAUFFEUR));
//        } catch (Exception e) {
//            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
//        }
//    }
//
//    @PostMapping
//    public ResponseEntity<?> creerVehicule(@RequestBody Vehicule vehicule) {
//        try {
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//            User agence = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
//
//            vehicule.setAgence(agence);
//            return ResponseEntity.ok(vehiculeRepository.save(vehicule));
//        } catch (Exception e) {
//            return ResponseEntity.status(500).body("Erreur lors de la création : " + e.getMessage());
//        }
//    }
//
//    @PutMapping("/{id}")
//    public ResponseEntity<?> modifierVehicule(@PathVariable Long id, @RequestBody Vehicule details) {
//        String email = SecurityContextHolder.getContext().getAuthentication().getName();
//
//        return vehiculeRepository.findById(id).map(v -> {
//            if (!v.getAgence().getEmail().equals(email)) {
//                return ResponseEntity.status(403).body("Action non autorisée");
//            }
//            v.setMarque(details.getMarque());
//            v.setModele(details.getModele());
//            v.setPlaque_immatriculation(details.getPlaque_immatriculation());
//            v.setCapacite(details.getCapacite());
//            v.setStatut(details.getStatut());
//            return ResponseEntity.ok(vehiculeRepository.save(v));
//        }).orElse(ResponseEntity.status(404).body("Véhicule introuvable"));
//    }
//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> supprimerVehicule(@PathVariable Long id) {
//        String email = SecurityContextHolder.getContext().getAuthentication().getName();
//
//        return vehiculeRepository.findById(id).map(v -> {
//            if (!v.getAgence().getEmail().equals(email)) {
//                return ResponseEntity.status(403).body("Action non autorisée");
//            }
//            vehiculeRepository.delete(v);
//            return ResponseEntity.ok().body("Véhicule supprimé avec succès");
//        }).orElse(ResponseEntity.status(404).body("Véhicule introuvable"));
//    }
//
//    // NOUVEL ENDPOINT : Récupérer les véhicules par trajet
//    @GetMapping("/par-trajet")
//    @PreAuthorize("hasAnyRole('AGENCY_MANAGER', 'SUPER_ADMIN')")
//    public ResponseEntity<?> getVehiculesParTrajet(@RequestParam Long trajetId) {
//        try {
//            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
//            User agence = userRepository.findByEmail(emailAgence)
//                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));
//
//            // Récupère les véhicules de cette agence assignés à ce trajet
//            List<Vehicule> vehicules = vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId);
//
//            return ResponseEntity.ok(vehicules);
//        } catch (Exception e) {
//            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
//        }
//    }
//}
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vehicules")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
public class VehiculeController {

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TrajetRepository trajetRepository;
    private User getAgenceCible() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (currentUser.getRole() == Role.AGENCY_ADMIN) {
            return currentUser;
        } else if (currentUser.getRole() == Role.AGENCY_MANAGER && currentUser.getAgenceEmployeur() != null) {
            return currentUser.getAgenceEmployeur();
        }
        return null;
    }

    /**
     * 🟢 RÉCUPÉRER UNIQUEMENT LES VÉHICULES LIBRES (POUR LA CRÉATION DE TRAJET)
     */
//    @GetMapping("/disponibles")
//    public ResponseEntity<?> getVehiculesDisponibles() {
//        try {
//            User agence = getAgenceCible();
//            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));
//
//            // Filtrage strict : on exclut ceux qui sont "Aligné a un trajet"
//            List<Vehicule> vehiculesLibres = vehiculeRepository.findByAgence(agence).stream()
//                    .filter(v -> v.getStatut() == null || !v.getStatut().equalsIgnoreCase("Aligné a un trajet"))
//                    .collect(Collectors.toList());
//
//            return ResponseEntity.ok(vehiculesLibres);
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur lors de la récupération des véhicules : " + e.getMessage()));
//        }
//    }

    @GetMapping({"/mes-vehicules", "/agence"})
    public ResponseEntity<?> getVehicules(@RequestParam(required = false) Long trajetId) {
        try {
            User agence = getAgenceCible();
            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));

            if (trajetId != null) {
                return ResponseEntity.ok(vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId));
            }
            return ResponseEntity.ok(vehiculeRepository.findByAgence(agence));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> creerVehicule(@RequestBody Vehicule vehicule) {
        try {
            User agence = getAgenceCible();
            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));

            vehicule.setAgence(agence);
            if(vehicule.getCapacite() == null && vehicule.getCapaciteTotale() != null) {
                vehicule.setCapacite(vehicule.getCapaciteTotale());
            }

            return ResponseEntity.ok(vehiculeRepository.save(vehicule));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modifierVehicule(@PathVariable Long id, @RequestBody Vehicule details) {
        User agence = getAgenceCible();
        if (agence == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Non autorisé"));

        return vehiculeRepository.findById(id).map(v -> {
            if (v.getAgence() == null || !v.getAgence().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Ce véhicule n'appartient pas à votre agence."));
            }
            v.setMarque(details.getMarque());
            v.setModele(details.getModele());
            v.setPlaque_immatriculation(details.getPlaque_immatriculation());
            v.setCapacite(details.getCapacite());
            v.setStatut(details.getStatut());

            return ResponseEntity.ok(vehiculeRepository.save(v));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Véhicule introuvable")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerVehicule(@PathVariable Long id) {
        User agence = getAgenceCible();
        if (agence == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Non autorisé"));

        return vehiculeRepository.findById(id).map(v -> {
            if (v.getAgence() == null || !v.getAgence().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Action non autorisée."));
            }
            vehiculeRepository.delete(v);
            return ResponseEntity.ok().body(Map.of("message", "Véhicule supprimé avec succès"));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Véhicule introuvable")));
    }





    @GetMapping("/par-trajet")
    public ResponseEntity<?> getVehiculesParTrajet(@RequestParam Long trajetId) {
        try {
            User agence = getAgenceCible();
            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Non autorisé"));

            List<Vehicule> vehicules = vehiculeRepository.findByAgenceAndTrajet_Id(agence, trajetId);
            return ResponseEntity.ok(vehicules);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }
   // 🟢 À AJOUTER

    /**
     * 🟢 RÉCUPÉRER UNIQUEMENT LES VÉHICULES LIBRES À UNE DATE PRÉCISE
     */
    @GetMapping("/disponibles")
    public ResponseEntity<?> getVehiculesDisponibles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            User agence = getAgenceCible();
            if (agence == null) return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));

            // 1. Récupérer les ID des véhicules occupés ce jour-là
            List<Long> vehiculesOccupes = (date != null)
                    ? trajetRepository.findBusyVehiculeIdsByDate(date)
                    : List.of();

            // 2. Filtrer : Prendre la flotte de l'agence SAUF ceux qui sont dans la liste des occupés
            List<Vehicule> vehiculesLibres = vehiculeRepository.findByAgence(agence).stream()
                    .filter(v -> !vehiculesOccupes.contains(v.getId())) // Remplace l'ancien filtre textuel
                    .collect(Collectors.toList());

            return ResponseEntity.ok(vehiculesLibres);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des véhicules : " + e.getMessage()));
        }
    }
}
