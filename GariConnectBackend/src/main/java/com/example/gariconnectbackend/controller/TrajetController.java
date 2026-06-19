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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    // 1. Récupérer tous les trajets (public ou client)
    @GetMapping
    public List<Trajet> getTousLesTrajets() {
        return trajetRepository.findAll();
    }

    // 2. Ajouter un trajet (Harmonisé avec AGENCY_ADMIN, AGENCY_MANAGER et SUPER_ADMIN)
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> ajouterTrajet(@RequestBody Trajet trajet) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Détermination de l'entité Agence appropriée
            User agence = null;
            if (utilisateurConnecte.getRole() == Role.SUPER_ADMIN) {
                if (trajet.getAgence() == null || trajet.getAgence().getId() == null) {
                    return ResponseEntity.badRequest().body("Un SUPER_ADMIN doit spécifier une agence pour ce trajet.");
                }
                agence = userRepository.findById(trajet.getAgence().getId())
                        .orElseThrow(() -> new RuntimeException("Agence spécifiée introuvable"));
            } else {
                // Si AGENCY_ADMIN, l'agence est lui-même. Si AGENCY_MANAGER, c'est son agenceEmployeur.
                agence = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte
                        : utilisateurConnecte.getAgenceEmployeur();
            }

            if (agence == null) {
                return ResponseEntity.badRequest().body("Impossible de déterminer l'agence rattachée.");
            }

            trajet.setAgence(agence);

            // Le service gère les vérifications, la création et la notification
            Trajet nouveauTrajet = trajetService.creerTrajet(trajet);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauTrajet);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'ajout : " + e.getMessage());
        }
    }

    // 3. Modifier un trajet
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> modifierTrajet(@PathVariable Long id, @RequestBody Trajet trajetDetails) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Trajet trajetExistant = trajetRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

            // Sécurité : Vérifier si l'utilisateur a le droit de modifier le trajet de cette agence
            if (utilisateurConnecte.getRole() != Role.SUPER_ADMIN) {
                Long agenceIdConnectee = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte.getId()
                        : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);

                if (agenceIdConnectee == null || !trajetExistant.getAgence().getId().equals(agenceIdConnectee)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'êtes pas autorisé à modifier ce trajet.");
                }
            }

            // Gestion de la vérification des doublons sur les jours de semaine
            if (trajetDetails.getJoursSemaine() != null && !trajetDetails.getJoursSemaine().isEmpty()) {
                String jour = trajetDetails.getJoursSemaine();

                if (trajetDetails.getVehicule() != null && trajetDetails.getVehicule().getId() != null) {
                    List<Long> vOccupes = trajetRepository.findBusyVehiculeIdsByDay(jour);
                    boolean estOccupe = vOccupes != null && vOccupes.stream().anyMatch(vid -> vid.equals(trajetDetails.getVehicule().getId()));

                    if (estOccupe && (trajetExistant.getVehicule() == null || !trajetExistant.getVehicule().getId().equals(trajetDetails.getVehicule().getId()))) {
                        return ResponseEntity.badRequest().body("Erreur : Ce véhicule est déjà assigné à un autre trajet le " + jour + ".");
                    }
                }

                if (trajetDetails.getChauffeur() != null && trajetDetails.getChauffeur().getId() != null) {
                    List<Long> cOccupes = trajetRepository.findBusyChauffeurIdsByDay(jour);
                    boolean estOccupe = cOccupes != null && cOccupes.stream().anyMatch(cid -> cid.equals(trajetDetails.getChauffeur().getId()));

                    if (estOccupe && (trajetExistant.getChauffeur() == null || !trajetExistant.getChauffeur().getId().equals(trajetDetails.getChauffeur().getId()))) {
                        return ResponseEntity.badRequest().body("Erreur : Ce chauffeur est déjà assigné à un autre trajet le " + jour + ".");
                    }
                }
            }

            // Mise à jour des informations de base
            trajetExistant.setDepart(trajetDetails.getDepart());
            trajetExistant.setDestination(trajetDetails.getDestination());
            trajetExistant.setJoursSemaine(trajetDetails.getJoursSemaine());
            trajetExistant.setDateHeureDepart(trajetDetails.getDateHeureDepart());
            trajetExistant.setPrix(trajetDetails.getPrix());
            trajetExistant.setPlacesDisponibles(trajetDetails.getPlacesDisponibles());
            trajetExistant.setStatut(trajetDetails.getStatut());

            // Assignation du véhicule
            if (trajetDetails.getVehicule() != null && trajetDetails.getVehicule().getId() != null) {
                Vehicule v = vehiculeRepository.findById(trajetDetails.getVehicule().getId())
                        .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));
                trajetExistant.setVehicule(v);
            }

            // Assignation du chauffeur avec mécanisme d'alerte de notification
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

            // ✅ NOTIFICATION : Informer le chauffeur des modifications apportées par l'agence
            if (chauffeurAvertir != null) {
                trajetService.envoyerNotificationChauffeur(
                        chauffeurAvertir,
                        "⚠️ L'agence a modifié les détails de votre trajet vers " + trajetMisAJour.getDestination()
                );
            }

            return ResponseEntity.ok(trajetMisAJour);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    // 4. Supprimer un trajet
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerTrajet(@PathVariable Long id) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateurConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

            // Vérification de sécurité pour la suppression
            if (utilisateurConnecte.getRole() != Role.SUPER_ADMIN) {
                Long agenceIdConnectee = (utilisateurConnecte.getRole() == Role.AGENCY_ADMIN)
                        ? utilisateurConnecte.getId()
                        : (utilisateurConnecte.getAgenceEmployeur() != null ? utilisateurConnecte.getAgenceEmployeur().getId() : null);

                if (agenceIdConnectee == null || !trajet.getAgence().getId().equals(agenceIdConnectee)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'êtes pas autorisé à supprimer ce trajet.");
                }
            }

            // ✅ NOTIFICATION : Prévenir le chauffeur de l'annulation avant suppression physique
            if (trajet.getChauffeur() != null) {
                trajetService.envoyerNotificationChauffeur(
                        trajet.getChauffeur(),
                        "🚨 Annulation : Votre trajet " + trajet.getDepart() + " ➔ " + trajet.getDestination() + " a été annulé par l'agence."
                );
            }

            trajetRepository.delete(trajet);
            return ResponseEntity.ok(Map.of("message", "Trajet supprimé avec succès."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    // 5. Recherche multicritère
    @GetMapping("/recherche")
    public List<Trajet> rechercherTrajets(
            @RequestParam(required = false) String depart,
            @RequestParam(required = false) String destination) {
        if (depart != null && destination != null) {
            return trajetRepository.findByDepartContainingIgnoreCaseAndDestinationContainingIgnoreCase(depart, destination);
        }
        return trajetRepository.findAll();
    }

    // 6. Obtenir le trajet actif d'un chauffeur connecté
    @GetMapping("/mon-trajet-actif")
    @PreAuthorize("hasRole('CHAUFFEUR')")
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

    // 7. Obtenir tous les trajets d'une agence (Admin connecté ou gestionnaire)
    @GetMapping("/mes-trajets")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getMesTrajets() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // Si c'est SUPER_ADMIN, il peut voir tous les trajets ou filtrer
            if (currentUser.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(trajetRepository.findAll());
            }

            // Détermination sécurisée de l'ID de l'agence pour l'administration de l'agence
            Long agenceId = (currentUser.getRole() == Role.AGENCY_ADMIN)
                    ? currentUser.getId()
                    : (currentUser.getAgenceEmployeur() != null ? currentUser.getAgenceEmployeur().getId() : null);

            if (agenceId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vous n'êtes rattaché à aucune agence active."));
            }

            // Correction de l'appel de méthode vers findByAgence_Id pour respecter l'ORM
            List<Trajet> trajets = trajetRepository.findByAgence_Id(agenceId);
            return ResponseEntity.ok(trajets);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des trajets : " + e.getMessage()));
        }
    }

    // 8. Chauffeurs disponibles de l'agence connectée
    @GetMapping("/chauffeurs-disponibles")
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

//    // =====================================================================
//    // 🔍 OBTENIR LES RESSOURCES DISPONIBLES (SaaS & Anti-Double Assignation)
//    // =====================================================================
//    @GetMapping("/ressources-disponibles")
//    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> obtenirRessourcesDisponibles(
//            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
//        try {
//            // 1. Identifier l'utilisateur connecté
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//            User currentUser = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));
//
//            // 2. Déterminer l'ID de l'agence (Logique SaaS stricte)
//            Long agenceId = (currentUser.getRole() == Role.AGENCY_ADMIN)
//                    ? currentUser.getId()
//                    : (currentUser.getAgenceEmployeur() != null ? currentUser.getAgenceEmployeur().getId() : null);
//
//            if (agenceId == null) {
//                return ResponseEntity.badRequest().body(Map.of("error", "Vous n'êtes rattaché à aucune agence."));
//            }
//
//            // 3. Récupérer les identifiants (IDs) occupés à cette date précise
//            List<Long> busyChauffeurs = trajetRepository.findBusyChauffeurIdsByDate(date);
//            List<Long> busyVehicules = trajetRepository.findBusyVehiculeIdsByDate(date);
//
//            // 4. Récupérer TOUS les chauffeurs et véhicules appartenant STRICTEMENT à cette agence
//            List<User> tousChauffeursAgence = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
//            List<Vehicule> tousVehiculesAgence = vehiculeRepository.findByAgence_Id(agenceId);
//
//            // 5. Filtrer pour ne garder que les ressources libres
//            List<User> chauffeursDispos = tousChauffeursAgence.stream()
//                    .filter(chauffeur -> !busyChauffeurs.contains(chauffeur.getId()))
//                    .collect(Collectors.toList());
//
//            List<Vehicule> vehiculesDispos = tousVehiculesAgence.stream()
//                    .filter(vehicule -> !busyVehicules.contains(vehicule.getId()))
//                    .collect(Collectors.toList());
//
//            // 6. Renvoyer le résultat combiné au frontend
//            return ResponseEntity.ok(Map.of(
//                    "chauffeurs", chauffeursDispos,
//                    "vehicules", vehiculesDispos
//            ));
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("error", "Erreur lors de la récupération des ressources disponibles : " + e.getMessage()));
//        }
//    }
    // =====================================================================
    // 🔍 OBTENIR LES VÉHICULES ET CHAUFFEURS DISPONIBLES POUR UNE DATE
    // =====================================================================
    @GetMapping("/ressources-disponibles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getRessourcesDisponibles(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            // 1. Identifier l'utilisateur connecté via le contexte de sécurité
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // 2. Déterminer l'ID de l'agence (Gère les cas ADMIN et MANAGER)
            Long agenceId = (currentUser.getRole() == Role.AGENCY_ADMIN)
                    ? currentUser.getId()
                    : (currentUser.getAgenceEmployeur() != null ? currentUser.getAgenceEmployeur().getId() : null);

            if (agenceId == null && currentUser.getRole() != Role.SUPER_ADMIN) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vous n'êtes rattaché à aucune agence."));
            }

            // 3. Récupérer TOUS les véhicules et chauffeurs appartenant strictement à CETTE agence
            List<Vehicule> tousVehiculesAgence;
            List<User> tousChauffeursAgence;

            if (currentUser.getRole() == Role.SUPER_ADMIN) {
                tousVehiculesAgence = vehiculeRepository.findAll();
                tousChauffeursAgence = userRepository.findByRole(Role.CHAUFFEUR);
            } else {
                tousVehiculesAgence = vehiculeRepository.findByAgence_Id(agenceId);
                tousChauffeursAgence = userRepository.findByRoleAndAgenceEmployeur_Id(Role.CHAUFFEUR, agenceId);
            }

            // 4. Identifier les IDs des ressources déjà occupées pour ce jour précis
            List<Long> busyVehicules = trajetRepository.findBusyVehiculeIdsByDate(date);
            List<Long> busyChauffeurs = trajetRepository.findBusyChauffeurIdsByDate(date);

            // Optionnel mais recommandé : Inclure les trajets récurrents si vous utilisez "joursSemaine"
            String jourSemaine = date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.FRENCH).toUpperCase();
            List<Long> recurringBusyVehicules = trajetRepository.findBusyVehiculeIdsByDay(jourSemaine);
            List<Long> recurringBusyChauffeurs = trajetRepository.findBusyChauffeurIdsByDay(jourSemaine);

            // Fusionner les listes d'occupés (Trajets uniques + Trajets récurrents)
            Set<Long> finalBusyVehicules = new HashSet<>(busyVehicules);
            finalBusyVehicules.addAll(recurringBusyVehicules);

            Set<Long> finalBusyChauffeurs = new HashSet<>(busyChauffeurs);
            finalBusyChauffeurs.addAll(recurringBusyChauffeurs);

            // 5. LE FILTRE FINAL : On prend la flotte de l'agence et on retire ceux qui sont dans la liste des occupés
            List<Vehicule> vehiculesDispo = tousVehiculesAgence.stream()
                    .filter(v -> !finalBusyVehicules.contains(v.getId()))
                    .toList();

            List<User> chauffeursDispo = tousChauffeursAgence.stream()
                    .filter(c -> !finalBusyChauffeurs.contains(c.getId()))
                    .toList();

            // 6. Retourner la réponse JSON structurée pour ton Frontend React
            return ResponseEntity.ok(Map.of(
                    "vehicules", vehiculesDispo,
                    "chauffeurs", chauffeursDispo
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des ressources disponibles : " + e.getMessage()));
        }
    }
    // =====================================================================
    // 🔍 OBTENIR UN SEUL TRAJET PAR SON ID (Doit impérativement être à la fin pour éviter les conflits d'URLs)
    // =====================================================================
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenirTrajetParId(@PathVariable Long id) {
        try {
            Trajet trajet = trajetRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable avec l'ID : " + id));
            return ResponseEntity.ok(trajet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}