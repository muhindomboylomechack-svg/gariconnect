

package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.CourrierRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.CourrierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.ArrayList;
import java.util.Map;

@RestController
@RequestMapping("/api/agences/courriers")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
public class CourrierController {

    @Autowired
    private CourrierService courrierService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourrierRepository courrierRepository;

    /**
     * Récupérer les courriers / colis
     * - SUPER_ADMIN : Liste l'intégralité des colis de la plateforme.
     * - ADMIN & AGENCE : Liste uniquement les colis liés à l'agence.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> getMesCourriers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Cas 1 : Le Super Admin - Vision globale
        if (userConnecte.getRole() == Role.SUPER_ADMIN) {
            return ResponseEntity.ok(courrierRepository.findAll());
        }

        // Cas 2 : L'Admin ou l'Agence - Isolation par entité
        User agence = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
        if (agence == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée à ce compte."));
        }

        return ResponseEntity.ok(courrierService.getCourriersParAgence(agence.getId()));
    }

    /**
     * Modifier un colis
     * Soumis au cloisonnement multi-tenant.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> modifierColis(@PathVariable Long id, @RequestBody Courrier details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        Courrier courrier = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis introuvable"));

        if (!aAccesAuCourrier(userConnecte, courrier)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès refusé. Ce colis n'appartient pas à votre agence."));
        }

        return ResponseEntity.ok(courrierService.modifier(id, details));
    }

    /**
     * Supprimer un colis
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> supprimerColis(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        Courrier courrier = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis introuvable"));

        if (!aAccesAuCourrier(userConnecte, courrier)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Action non autorisée pour votre établissement."));
        }

        courrierService.supprimer(id);
        return ResponseEntity.ok(Map.of("message", "Colis supprimé avec succès"));
    }

    /**
     * Assigner un chauffeur et un véhicule à un colis (Transport)
     */
    @PatchMapping("/{id}/assigner-transport")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> assignerTransport(@PathVariable Long id, @RequestBody Map<String, Long> ids) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email).orElseThrow();

            Courrier courrier = courrierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Colis introuvable"));

            if (!aAccesAuCourrier(userConnecte, courrier)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Vous ne pouvez pas assigner de transport à un colis d'une autre agence."));
            }

            Long vehiculeId = ids.get("vehiculeId");
            Long chauffeurId = ids.get("chauffeurId");

            Courrier updated = courrierService.assignerTransport(id, vehiculeId, chauffeurId);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Erreur lors de l'assignation du transport",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Récupération des envois (Espace client ou espace gestionnaire)
     */
    @GetMapping("/mes-envois")
    public ResponseEntity<?> getMesEnvois() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Role role = user.getRole();

            // 1. Cas du SUPER_ADMIN
            if (role == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(courrierRepository.findAll());
            }

            // 2. Cas de l'ADMIN d'agence
            if (role == Role.AGENCY_ADMIN) {
                User agence = user.getAgenceEmployeur();
                if (agence == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence associée à votre profil admin."));
                }
                return ResponseEntity.ok(courrierService.getCourriersParAgence(agence.getId()));
            }

            // 3. Cas du compte de l'AGENCE elle-même
            if (role == Role.AGENCY_MANAGER) {
                return ResponseEntity.ok(courrierService.getCourriersParAgence(user.getId()));
            }

            // 4. Cas du CLIENT / USER (Recherche par numéro de téléphone floue)
            String telephone = user.getTelephone();
            if (telephone == null || telephone.trim().isEmpty()) {
                return ResponseEntity.ok(new ArrayList<Courrier>());
            }

            String telNettoye = telephone.replaceAll("[^0-9]", "");
            if (telNettoye.length() > 9) {
                telNettoye = telNettoye.substring(telNettoye.length() - 9);
            }
            return ResponseEntity.ok(courrierRepository.findByTelephoneFuzzy(telNettoye));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Erreur lors de la récupération des envois",
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Mettre à jour manuellement le statut d'un colis
     */
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENCE')")
    public ResponseEntity<?> changerStatut(@PathVariable Long id, @RequestParam String statut) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email).orElseThrow();

            Courrier courrier = courrierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Colis introuvable"));

            if (!aAccesAuCourrier(userConnecte, courrier)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Interdit. Modification du statut non autorisée."));
            }

            System.out.println("🚀 REQUÊTE REÇUE : Changement de statut pour le colis " + id + " vers " + statut);
            Courrier maj = courrierService.mettreAJourStatut(id, statut);
            return ResponseEntity.ok(maj);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Enregistrer et envoyer un nouveau colis
     */
    @PostMapping("/envoyer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENCE')")
    public ResponseEntity<?> envoyerColis(@RequestBody Courrier courrier) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        User agencecible;

        if (userConnecte.getRole() == Role.SUPER_ADMIN) {
            agencecible = courrier.getAgence();
            if (agencecible == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le Super Admin doit spécifier une agence d'envoi dans le corps de la requête."));
            }
        } else {
            agencecible = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
            if (agencecible == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Votre compte n'est lié à aucune agence active."));
            }
        }

        Courrier sauvegarde = courrierService.enregistrerColis(courrier, agencecible);
        return ResponseEntity.ok(sauvegarde);
    }

    /**
     * Méthode utilitaire privée de vérification multi-tenancy
     */
    private boolean aAccesAuCourrier(User userConnecte, Courrier courrier) {
        if (userConnecte.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        User agenceIdConnected = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
        return agenceIdConnected != null &&
                courrier.getAgence() != null &&
                courrier.getAgence().getId().equals(agenceIdConnected.getId());
    }
}