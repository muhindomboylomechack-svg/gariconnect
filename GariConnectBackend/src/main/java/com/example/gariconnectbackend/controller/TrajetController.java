/*package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.service.TrajetService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/trajets")
@CrossOrigin("*")
public class TrajetController {

    @Autowired private TrajetRepository trajetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TrajetService trajetService;
    @Autowired private VehiculeRepository vehiculeRepository;

    @GetMapping
    public List<Trajet> getTousLesTrajets() {
        return trajetRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<Trajet> ajouterTrajet(@RequestBody Trajet trajet) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        trajet.setAgence(agence);
        // Le service gère la création ET la notification
        Trajet nouveauTrajet = trajetService.creerTrajet(trajet);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet trajetDetails) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User agenceConnectee = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

            Trajet trajetExistant = trajetRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

            if (!trajetExistant.getAgence().getId().equals(agenceConnectee.getId())) {
                return ResponseEntity.status(403).body("Vous n'êtes pas autorisé à modifier ce trajet.");
            }

            if (trajetDetails.getJoursSemaine() != null && !trajetDetails.getJoursSemaine().isEmpty()) {
                String jour = trajetDetails.getJoursSemaine();

                if (trajetDetails.getVehicule() != null && trajetDetails.getVehicule().getId() != null) {
                    List<Long> vOccupes = trajetRepository.findBusyVehiculeIdsByDay(jour);
                    boolean estOccupe = vOccupes != null && vOccupes.stream().anyMatch(vid -> ((Number) vid).longValue() == trajetDetails.getVehicule().getId().longValue());

                    if (estOccupe && !trajetExistant.getVehicule().getId().equals(trajetDetails.getVehicule().getId())) {
                        return ResponseEntity.badRequest().body("Erreur : Ce véhicule est déjà assigné à un autre trajet le " + jour + ".");
                    }
                }

                if (trajetDetails.getChauffeur() != null && trajetDetails.getChauffeur().getId() != null) {
                    List<Long> cOccupes = trajetRepository.findBusyChauffeurIdsByDay(jour);
                    boolean estOccupe = cOccupes != null && cOccupes.stream().anyMatch(cid -> ((Number) cid).longValue() == trajetDetails.getChauffeur().getId().longValue());

                    if (estOccupe && !trajetExistant.getChauffeur().getId().equals(trajetDetails.getChauffeur().getId())) {
                        return ResponseEntity.badRequest().body("Erreur : Ce chauffeur est déjà assigné à un autre trajet le " + jour + ".");
                    }
                }
            }

            trajetExistant.setDepart(trajetDetails.getDepart());
            trajetExistant.setDestination(trajetDetails.getDestination());
            trajetExistant.setJoursSemaine(trajetDetails.getJoursSemaine());
            trajetExistant.setDateHeureDepart(trajetDetails.getDateHeureDepart());
            trajetExistant.setPrix(trajetDetails.getPrix());
            trajetExistant.setPlacesDisponibles(trajetDetails.getPlacesDisponibles());
            trajetExistant.setStatut(trajetDetails.getStatut());

            if (trajetDetails.getVehicule() != null && trajetDetails.getVehicule().getId() != null) {
                Vehicule v = vehiculeRepository.findById(trajetDetails.getVehicule().getId())
                        .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));
                trajetExistant.setVehicule(v);
            }

            User chauffeurAvertir = null;
            if (trajetDetails.getChauffeur() != null && trajetDetails.getChauffeur().getId() != null) {
                User c = userRepository.findById(trajetDetails.getChauffeur().getId())
                        .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));
                trajetExistant.setChauffeur(c);
                chauffeurAvertir = c;
            } else {
                chauffeurAvertir = trajetExistant.getChauffeur();
            }

            Trajet trajetMisAJour = trajetRepository.save(trajetExistant);

            // ✅ NOTIFICATION : Informer le chauffeur des modifications
            trajetService.envoyerNotificationChauffeur(
                    chauffeurAvertir,
                    "⚠️ L'agence a modifié les détails de votre trajet vers " + trajetMisAJour.getDestination()
            );

            return ResponseEntity.ok(trajetMisAJour);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return trajetRepository.findById(id).map(trajet -> {
            if (!trajet.getAgence().getEmail().equals(email)) {
                return ResponseEntity.status(403).body("Vous n'êtes pas autorisé à supprimer ce trajet.");
            }

            // ✅ NOTIFICATION : Prévenir le chauffeur de l'annulation avant suppression
            if (trajet.getChauffeur() != null) {
                trajetService.envoyerNotificationChauffeur(
                        trajet.getChauffeur(),
                        "🚨 Annulation : Votre trajet " + trajet.getDepart() + " ➔ " + trajet.getDestination() + " a été annulé par l'agence."
                );
            }

            trajetRepository.delete(trajet);
            return ResponseEntity.ok().body("Trajet supprimé");
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/recherche")
    public List<Trajet> rechercherTrajets(
            @RequestParam(required = false) String depart,
            @RequestParam(required = false) String destination) {
        if (depart != null && destination != null) {
            return trajetRepository.findByDepartContainingIgnoreCaseAndDestinationContainingIgnoreCase(depart, destination);
        }
        return trajetRepository.findAll();
    }

    @GetMapping("/mon-trajet-actif")
    @PreAuthorize("hasAnyAuthority('CHAUFFEUR', 'ROLE_CHAUFFEUR')")
    public ResponseEntity<?> getTrajetActuelChauffeur() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User chauffeur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

            List<String> statutsActifs = Arrays.asList("DISPONIBLE", "EN_ROUTE");
            List<Trajet> trajets = trajetRepository.findByChauffeurId(chauffeur.getId());

            return trajets.stream()
                    .filter(t -> statutsActifs.contains(t.getStatut()))
                    .findFirst()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/mes-trajets")
    @PreAuthorize("hasAnyAuthority('AGENCE', 'ROLE_AGENCE', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> getMesTrajets() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElse(null);
        if (agence == null) return ResponseEntity.badRequest().body("Agence non trouvée");
        return ResponseEntity.ok(trajetRepository.findByAgenceId(agence.getId()));
    }

    @GetMapping("/mon-historique")
    @PreAuthorize("hasAnyAuthority('CHAUFFEUR', 'ROLE_CHAUFFEUR')")
    public ResponseEntity<?> getHistoriqueChauffeur() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User chauffeur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

            List<Trajet> trajets = trajetRepository.findByChauffeurId(chauffeur.getId());

            return ResponseEntity.ok(trajets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    @GetMapping("/ressources-disponibles")
    public ResponseEntity<?> getRessourcesDisponibles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String jour) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow();

        List<Vehicule> vehicules;
        List<User> chauffeurs;

        if (date != null) {
            vehicules = trajetService.listerVehiculesDisponiblesParDate(agence.getId(), date);
            chauffeurs = trajetService.listerChauffeursDisponiblesParDate(agence.getId(), date);
        } else {
            vehicules = trajetService.listerVehiculesDisponiblesParJour(agence.getId(), jour);
            chauffeurs = trajetService.listerChauffeursDisponiblesParJour(agence.getId(), jour);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("vehicules", vehicules);
        response.put("chauffeurs", chauffeurs);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/mon-trajet-actif")
    public ResponseEntity<?> getMonTrajetActif(@RequestHeader("Authorization") String token) {
        try {
            // TODO: Extraire l'ID du chauffeur à partir de votre JWT Token ou Session.
            // Pour l'exemple et vos tests immédiats, nous simulons un ID fixe (ex: 1L)
            Long chauffeurId = 1L;

            return trajetService.getTrajetActifChauffeur(chauffeurId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build()); // Retourne un 204 si aucun trajet
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        try {
            String nouveauStatut = requestBody.get("statut");
            if (nouveauStatut == null || nouveauStatut.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le champ 'statut' est obligatoire."));
            }

            Trajet trajetMisAJour = trajetService.updateStatutTrajet(id, nouveauStatut);
            return ResponseEntity.ok(trajetMisAJour);

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erreur interne du serveur."));
        }
    }

    @GetMapping("/mon-trajet-actif")
    public ResponseEntity<?> getMonTrajetActif() {
        try {
            // Extraction de l'email de l'utilisateur authentifié depuis Spring Security
            String emailChauffeur = SecurityContextHolder.getContext().getAuthentication().getName();

            return trajetRepository.findActiveTrajetByChauffeurEmail(emailChauffeur)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build()); // Code 204 si aucune mission
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }



    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> modifierStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String nouveauStatut = body.get("statut");
            if (nouveauStatut == null || nouveauStatut.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le paramètre statut est obligatoire."));
            }

            Optional<Trajet> oTrajet = trajetRepository.findById(id);
            if (oTrajet.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Trajet introuvable."));
            }

            Trajet trajet = oTrajet.get();
            trajet.setStatut(nouveauStatut);
            Trajet sauvegarde = trajetRepository.save(trajet);

            return ResponseEntity.ok(sauvegarde);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }
}
*/

package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.TrajetDTO;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.service.TrajetService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/trajets")
@CrossOrigin("*")
public class TrajetController {

    @Autowired private TrajetRepository trajetRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TrajetService trajetService;
    @Autowired private VehiculeRepository vehiculeRepository;






    @GetMapping("/mon-trajet-actif")
    public ResponseEntity<?> getMonTrajetActif() {
        try {
            String emailChauffeur = SecurityContextHolder.getContext().getAuthentication().getName();

            // C'est ici que ça plante si la méthode n'existe pas ou si la requête SQL est fausse :
            Optional<Trajet> trajet = trajetRepository.findActiveTrajetByChauffeurEmail(emailChauffeur);

            return trajet.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }




    @PostMapping
    @PreAuthorize("hasRole('AGENCY_MANAGER')")
    public ResponseEntity<?> creerTrajet(@RequestBody Trajet trajet) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            Trajet nouveauTrajet = trajetService.creerTrajet(trajet, agence.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors de la création du trajet."));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AGENCY_MANAGER')")
    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet trajetDetails) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            Trajet trajetModifie = trajetService.modifierTrajet(id, trajetDetails, agence.getId());
            return ResponseEntity.ok(trajetModifie);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors de la modification."));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
        try {
            String emailAgence = SecurityContextHolder.getContext().getAuthentication().getName();
            User agence = userRepository.findByEmail(emailAgence)
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));

            trajetService.supprimerTrajet(id, agence.getId());
            return ResponseEntity.ok(Map.of("message", "Trajet supprimé avec succès"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors de la suppression."));
        }
    }

    @GetMapping("/mes-trajets")
    public ResponseEntity<?> getTrajetsAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        // CORRECTION ICI : Suppression du cast (List<Trajet>) devenu inutile et bloquant
        List<Trajet> trajets = trajetRepository.findByAgence(agence);
        return ResponseEntity.ok(trajets);
    }

    @GetMapping("/en-route")
    public ResponseEntity<?> getTrajetsEnRoute() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        List<Trajet> trajets = trajetRepository.findByAgenceAndStatut(agence, "EN_ROUTE");
        return ResponseEntity.ok(trajets);
    }

@GetMapping("/mon-historique/aujourdhui")
@PreAuthorize("hasAuthority('ROLE_CHAUFFEUR')")
public ResponseEntity<?> getTrajetsAujourdhui() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    User chauffeur = userRepository.findByEmail(email).orElseThrow();

    return ResponseEntity.ok(trajetService.getTrajetsDuJour(chauffeur.getId()));
}
    @GetMapping("/ressources-disponibles")
    public ResponseEntity<?> getRessourcesDisponibles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String jour) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow();

        List<Vehicule> vehicules;
        List<User> chauffeurs;

        if (date != null) {
            vehicules = trajetService.listerVehiculesDisponiblesParDate(agence.getId(), date);
            chauffeurs = trajetService.listerChauffeursDisponiblesParDate(agence.getId(), date);
        } else {
            vehicules = trajetService.listerVehiculesDisponiblesParJour(agence.getId(), jour);
            chauffeurs = trajetService.listerChauffeursDisponiblesParJour(agence.getId(), jour);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("vehicules", vehicules);
        response.put("chauffeurs", chauffeurs);

        return ResponseEntity.ok(response);
    }



    /**
     * PATCH /api/trajets/{id}/statut
     * Permet au chauffeur de faire évoluer le statut
     */
    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> modifierStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String nouveauStatut = body.get("statut");
            if (nouveauStatut == null || nouveauStatut.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le paramètre statut est obligatoire."));
            }

            Optional<Trajet> oTrajet = trajetRepository.findById(id);
            if (oTrajet.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Trajet introuvable."));
            }

            Trajet trajet = oTrajet.get();
            trajet.setStatut(nouveauStatut);
            Trajet sauvegarde = trajetRepository.save(trajet);

            return ResponseEntity.ok(sauvegarde);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }
    // NOUVELLE MÉTHODE CORRIGÉE POUR L'HISTORIQUE
    @GetMapping("/mon-historique")
    @PreAuthorize("hasAnyAuthority('CHAUFFEUR', 'ROLE_CHAUFFEUR')")
    public ResponseEntity<?> getHistoriqueChauffeur() {
        try {
            // Spring Security lit le token JWT envoyé par votre intercepteur Axios
            String email = SecurityContextHolder.getContext().getAuthentication().getName();

            User chauffeur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

            List<Trajet> trajets = trajetRepository.findByChauffeurId(chauffeur.getId());
            return ResponseEntity.ok(trajets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

// ...

    @GetMapping
    public ResponseEntity<List<TrajetDTO>> getTousLesTrajets() {
        List<TrajetDTO> trajets = trajetRepository.findAll()
                .stream()
                .map(TrajetDTO::fromEntity) // ✅ On convertit chaque Trajet en TrajetDTO
                .collect(Collectors.toList());

        return ResponseEntity.ok(trajets);
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<TrajetDTO>> rechercherTrajets(
            @RequestParam(required = false) String depart,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String date) { // Optionnel si vous filtrez par date

        List<Trajet> resultats;
        if (depart != null && destination != null) {
            resultats = trajetRepository.findByDepartContainingIgnoreCaseAndDestinationContainingIgnoreCase(depart, destination);
        } else {
            resultats = trajetRepository.findAll();
        }

        List<TrajetDTO> dtos = resultats.stream()
                .map(TrajetDTO::fromEntity) // ✅ Conversion
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}


