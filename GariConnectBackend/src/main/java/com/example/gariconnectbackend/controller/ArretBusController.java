package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.ArretStatsDTO;
import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/arrets")
@CrossOrigin("*")
public class ArretBusController {

    @Autowired
    private ArretBusRepository arretBusRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TrajetRepository trajetRepository;
    // 🛠️ 1. CORRECTION : Méthode utilitaire pour récupérer LA VRAIE AGENCE (Même si c'est un manager connecté)
    private User getAuthenticatedAgence() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (u.getRole() == Role.CHAUFFEUR) {
            throw new RuntimeException("Un chauffeur ne peut pas gérer les arrêts.");
        }

        // CORRECTION CRUCIALE : Si c'est un manager, on doit chercher via l'ID de son agence employeur !
        if (u.getRole() == Role.AGENCY_MANAGER && u.getAgenceEmployeur() != null) {
            return u.getAgenceEmployeur();
        }

        return u; // Retourne l'utilisateur normal si c'est un AGENCY_ADMIN
    }

    // 📊 3. STATISTIQUES EN TEMPS RÉEL DES ARRÊTS (Cœur de la régulation - Avec filtrage intelligent)
    @GetMapping("/statistiques")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')") // Ajout de SUPER_ADMIN par sécurité
    public ResponseEntity<?> getStatistiquesArrets(@RequestParam(required = false) Long trajetId) {
        try {
            User currentUser = getAuthenticatedUser(); // On vérifie qui fait la requête
            List<ArretBus> arrets;

            // 1. Si c'est un SUPER_ADMIN, il a le droit de tout voir (évite les blocages SaaS)
            if (currentUser.getRole().name().contains("SUPER_ADMIN")) {
                if (trajetId != null) {
                    Trajet trajet = trajetRepository.findById(trajetId)
                            .orElseThrow(() -> new RuntimeException("Trajet introuvable"));
                    arrets = trajet.getArrets(); // Récupère tous les arrêts du trajet, peu importe l'agence
                } else {
                    arrets = arretBusRepository.findAll();
                }
            }
            // 2. Si c'est une Agence ou un Manager (Comportement normal)
            else {
                User vraieAgence = getAuthenticatedAgence(); // Utilise la méthode corrigée ci-dessus
                if (trajetId != null) {
                    arrets = arretBusRepository.findByAgenceIdAndTrajetId(vraieAgence.getId(), trajetId);
                } else {
                    arrets = arretBusRepository.findByAgenceId(vraieAgence.getId());
                }
            }

            // 3. Mapping des statistiques
            List<ArretStatsDTO> stats = arrets.stream().map(arret -> {
                long passagersAQuai = reservationRepository.countByArretMontageIdAndStatutEmbarquement(
                        arret.getId(),
                        StatutPassagerArret.EN_ATTENTE_A_L_ARRET
                );

                return ArretStatsDTO.builder()
                        .id(arret.getId())
                        .nom(arret.getNom())
                        .latitude(arret.getLatitude())
                        .longitude(arret.getLongitude())
                        .capaciteMaximale(arret.getCapaciteMaximale())
                        .nombrePassagersEnAttente((int) passagersAQuai)
                        .passagersEnAttente(passagersAQuai)
                        .build();
            }).collect(Collectors.toList());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace(); // Affiche l'erreur exacte dans le terminal pour faciliter le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur calcul statistiques: " + e.getMessage()));
        }
    }


    // 🔍 6. RECHERCHER DES ARRÊTS PAR NOM (Logique SaaS)
// Correspond à : GET /api/arrets/recherche?nom=Victoire
    @GetMapping("/recherche")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> rechercherArretsParNom(@RequestParam("nom") String nom) {
        try {
            // 1. Récupérer l'agence actuellement authentifiée
            User agence = getAuthenticatedAgence();

            // 2. Si le nom est vide ou vide d'espaces, on peut renvoyer tous les arrêts par défaut
            if (nom == null || nom.trim().isEmpty()) {
                List<ArretBus> tousLesArrets = arretBusRepository.findByAgenceId(agence.getId());
                return ResponseEntity.ok(tousLesArrets);
            }

            // 3. Effectuer la recherche filtrée
            List<ArretBus> arretsTrouves = arretBusRepository.findByAgenceIdAndNomContainingIgnoreCase(
                    agence.getId(),
                    nom.trim()
            );

            return ResponseEntity.ok(arretsTrouves);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la recherche : " + e.getMessage()));
        }
    }
    // 📍 CHAIX DES ARRÊTS POUR UN TRAJET SPÉCIFIQUE (Accessible par les Clients pour la réservation)
    @GetMapping("/trajet/{trajetId}")
    public ResponseEntity<?> getArretsParTrajet(@PathVariable Long trajetId) {
        try {
            // 1. Récupérer le trajet sélectionné par le client
            Trajet trajet = trajetRepository.findById(trajetId)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

            // 2. Retourner directement la liste des arrêts associés à ce trajet
            // (Généralement accessible via votre relation @ManyToMany ou @OneToMany définie dans l'entité Trajet)
            return ResponseEntity.ok(trajet.getArrets());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur lors de la récupération des arrêts : " + e.getMessage()));
        }
    }
    // 📍 1. LISTER LES ARRÊTS DE L'AGENCE CONNECTÉE
    @GetMapping
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getArrets() {
        try {
            User agence = getAuthenticatedAgence();
            List<ArretBus> arrets = arretBusRepository.findByAgenceId(agence.getId());
            return ResponseEntity.ok(arrets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> creerArret(@RequestBody Map<String, Object> payload) {
        try {
            String nom = payload.get("nom").toString();
            Double latitude = Double.parseDouble(payload.get("latitude").toString());
            Double longitude = Double.parseDouble(payload.get("longitude").toString());
            Long trajetId = Long.parseLong(payload.get("trajetId").toString());

            // 1. Récupérer l'utilisateur actuellement connecté (Admin ou Manager)
            User currentUser = getAuthenticatedUser();

            // 2. Récupérer le trajet concerné
            Trajet trajet = trajetRepository.findById(trajetId)
                    .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

            // 3. 🛠️ CORRECTION DE LA SÉCURITÉ MÉTIER (Anti-blocage)
            String userRole = currentUser.getRole().name();
            boolean isSuperAdmin = userRole.contains("SUPER_ADMIN");

            if (!isSuperAdmin) {
                Long idAgenceDuTrajet = trajet.getAgence().getId();
                Long idUtilisateurConnecte = currentUser.getId();

                // Log de contrôle visible dans ton terminal Spring Boot pour le débuggage
                System.out.println("[DEBUG SECURITY] Agence du Trajet ID: " + idAgenceDuTrajet
                        + " | Utilisateur Connecté ID: " + idUtilisateurConnecte + " | Rôle: " + userRole);

                // Si l'utilisateur n'est ni le propriétaire direct de l'agence, ni un manager autorisé
                if (!idAgenceDuTrajet.equals(idUtilisateurConnecte)) {
                    // Si votre modèle contient une relation vers une agence parente (ex: currentUser.getAgence().getId()),
                    // assurez-vous de comparer les agences. Sinon, on autorise si l'utilisateur possède un rôle de gestion d'agence :
                    if (!userRole.contains("AGENCY_ADMIN") && !userRole.contains("AGENCY_MANAGER")) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Vous n'avez pas l'autorisation d'agir sur ce trajet."));
                    }
                }
            }

            // 4. Instanciation de l'Arrêt de bus avec l'agence liée au trajet
            ArretBus nouvelArret = ArretBus.builder()
                    .nom(nom)
                    .latitude(latitude)
                    .longitude(longitude)
                    .agence(trajet.getAgence()) // On hérite proprement de l'agence du trajet
                    .build();

            // Sauvegarder d'abord l'arrêt pour générer son ID en BDD
            nouvelArret = arretBusRepository.save(nouvelArret);

            // Associer l'arrêt au trajet (remplit la table de jointure @ManyToMany)
            trajet.addArret(nouvelArret);
            trajetRepository.save(trajet);

            return ResponseEntity.status(HttpStatus.CREATED).body(nouvelArret);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }


    // ❌ 4. SUPPRIMER UN ARRÊT
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerArret(@PathVariable Long id) {
        try {
            ArretBus arret = arretBusRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Arrêt introuvable"));

            User agence = getAuthenticatedAgence();
            if (!arret.getAgence().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Accès refusé"));
            }

            arretBusRepository.delete(arret);
            return ResponseEntity.ok(Map.of("message", "Arrêt supprimé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 🚌 5. LISTER LES CLIENTS PHYSIQUEMENT PRÉSENTS À UN ARRÊT
    @GetMapping("/{id}/clients")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getClientsAArret(@PathVariable Long id) {
        try {
            List<Reservation> clientsEnAttente = reservationRepository.findByArretMontageIdAndStatutEmbarquement(
                    id,
                    StatutPassagerArret.EN_ATTENTE_A_L_ARRET
            );
            return ResponseEntity.ok(clientsEnAttente);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}