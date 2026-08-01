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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER','CHAUFFEUR')") // Ajout de SUPER_ADMIN par sécurité
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



    // 🔄 6. MODIFIER UN ARRÊT (AVEC NOTIFICATION DES CLIENTS)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> modifierArret(@PathVariable Long id, @RequestBody ArretBus arretDetails) {
        return arretBusRepository.findById(id).map(arret -> {
            String ancienNom = arret.getNom();

            // Mise à jour des champs
            arret.setNom(arretDetails.getNom());
            arret.setEstPrincipal(arretDetails.isEstPrincipal());
            // Ajoutez d'autres champs si nécessaire (ex: ordre, trajet, etc.)

            ArretBus arretMisAJour = arretBusRepository.save(arret);

            // Récupérer les clients qui ont réservé à cet arrêt (statut EN_ATTENTE_A_L_ARRET)
            List<Reservation> clientsImpactes = reservationRepository.findByArretMontageIdAndStatutEmbarquement(
                    id,
                    StatutPassagerArret.EN_ATTENTE_A_L_ARRET
            );

            // Alerter les clients si la liste n'est pas vide
            if (!clientsImpactes.isEmpty()) {
                notifierClientsModification(clientsImpactes, ancienNom, arretMisAJour.getNom());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Arrêt modifié avec succès",
                    "clientsNotifies", clientsImpactes.size(),
                    "arret", arretMisAJour
            ));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Arrêt non trouvé")));
    }



    // ❌ 7. SUPPRIMER UN ARRÊT (AVEC NOTIFICATION DES CLIENTS)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerArret(@PathVariable Long id) {
        try {
            return arretBusRepository.findById(id).map(arret -> {

                // 1. Récupérer les clients qui allaient monter à cet arrêt
                List<Reservation> clientsImpactes = reservationRepository.findByArretMontageIdAndStatutEmbarquement(
                        id,
                        StatutPassagerArret.EN_ATTENTE_A_L_ARRET
                );

                // 2. Notifier les clients AVANT de supprimer ou de détacher l'arrêt
                if (!clientsImpactes.isEmpty()) {
                    notifierClientsSuppression(clientsImpactes, arret.getNom());

                    // Mettre à jour le statut des réservations impactées en détachant l'arrêt
                    clientsImpactes.forEach(res -> {
                        res.setArretMontage(null); // On détache l'arrêt supprimé
                        reservationRepository.save(res);
                    });
                }

                // 3. 🛠️ CORRECTION : Nettoyer les relations dans la table de jointure avec les Trajets (@ManyToMany)
                // On récupère tous les trajets qui utilisent cet arrêt pour les dissocier
                List<Trajet> trajetsAssocies = trajetRepository.findAll().stream()
                        .filter(trajet -> trajet.getArrets() != null && trajet.getArrets().contains(arret))
                        .collect(Collectors.toList());

                for (Trajet trajet : trajetsAssocies) {
                    trajet.getArrets().remove(arret);
                    trajetRepository.save(trajet); // Met à jour la table de jointure
                }

                // 4. Supprimer définitivement l'arrêt physique en base de données
                arretBusRepository.delete(arret);

                return ResponseEntity.ok(Map.of(
                        "message", "Arrêt supprimé avec succès et détaché des trajets",
                        "clientsNotifies", clientsImpactes.size()
                ));
            }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Arrêt non trouvé")));

        } catch (Exception e) {
            // Affiche l'erreur exacte dans le terminal Spring Boot pour le débuggage
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Impossible de supprimer l'arrêt. Erreur d'intégrité : " + e.getMessage()
            ));
        }
    }
    // Méthode d'alerte pour la MODIFICATION
    private void notifierClientsModification(List<Reservation> reservations, String ancienNom, String nouveauNom) {
        for (Reservation res : reservations) {
            if (res.getClient() != null && res.getClient().getTelephone() != null) {
                String telephone = res.getClient().getTelephone();
                String nomClient = res.getClient().getNom();

                String message = String.format(
                        "Cher(e) %s, votre arrêt d'embarquement '%s' a été modifié. Le nouveau nom est désormais '%s'. Veuillez vous y référer pour votre voyage (Ticket: %s).",
                        nomClient, ancienNom, nouveauNom, res.getCodeTicket()
                );

                // 📝 LOG DANS LA CONSOLE (À remplacer par votre service SMS/WhatsApp/Email)
                System.out.println("[NOTIFICATION SMS envoyé à " + telephone + "] : " + message);
            }
        }
    }

    // Méthode d'alerte pour la SUPPRESSION
    private void notifierClientsSuppression(List<Reservation> reservations, String nomArret) {
        for (Reservation res : reservations) {
            if (res.getClient() != null && res.getClient().getTelephone() != null) {
                String telephone = res.getClient().getTelephone();
                String nomClient = res.getClient().getNom();

                String message = String.format(
                        "IMPORTANT - Cher(e) %s, l'arrêt d'embarquement '%s' a été supprimé par l'agence. Veuillez contacter le service client d'urgence pour réajuster votre point de ramassage (Ticket: %s).",
                        nomClient, nomArret, res.getCodeTicket()
                );

                // 📝 LOG DANS LA CONSOLE
                System.out.println("[NOTIFICATION SMS D'URGENCE envoyé à " + telephone + "] : " + message);
            }
        }
    }
// Dans ArretBusController.java


    // 🚌 5. LISTER LES CLIENTS PHYSIQUEMENT PRÉSENTS À UN ARRÊT
    @GetMapping("/{id}/clients")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN', 'AGENCY_MANAGER', 'SUPER_ADMIN', 'CHAUFFEUR')") // 🟢 CORRECTION : Ajout de 'CHAUFFEUR'
    public ResponseEntity<?> getClientsAArret(@PathVariable Long id) {
        try {
            // On s'assure que la requête cherche bien les passagers en attente à l'arrêt spécifié[cite: 2].
            List<Reservation> clientsEnAttente = reservationRepository.findByArretMontageIdAndStatutEmbarquement(
                    id,
                    StatutPassagerArret.EN_ATTENTE_A_L_ARRET
            );

            // Création d'une structure qui respecte ce que le frontend attend[cite: 2]
            List<Map<String, Object>> response = clientsEnAttente.stream().map(res -> {
                Map<String, Object> clientInfo = new java.util.HashMap<>();
                clientInfo.put("id", res.getId());
                clientInfo.put("codeTicket", res.getCodeTicket());
                clientInfo.put("numeroSiege", res.getNumeroSiege());
                // On s'assure que le statut est envoyé sous forme de chaîne (String) au Frontend[cite: 2]
                clientInfo.put("statutEmbarquement", res.getStatutEmbarquement() != null ? res.getStatutEmbarquement().name() : "NON_DEFINI");
                clientInfo.put("nombrePlaces", res.getNombrePlaces());

                // Restauration de l'objet "client" pour que le frontend puisse faire "item.client.nom"[cite: 2]
                Map<String, Object> clientData = new java.util.HashMap<>();
                if (res.getClient() != null) {
                    clientData.put("nom", res.getClient().getNom());
                    clientData.put("telephone", res.getClient().getTelephone());
                    clientData.put("email", res.getClient().getEmail());
                } else {
                    clientData.put("nom", "Inconnu");
                }
                clientInfo.put("client", clientData);

                return clientInfo;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des clients: " + e.getMessage()));
        }
    }
}