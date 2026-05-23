package com.example.gariconnectbackend.controller;


import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.CourrierRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.CourrierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agences/courriers")
@CrossOrigin("*")
public class CourrierController {
    @Autowired
    private CourrierService courrierService;
    @Autowired private UserRepository userRepository;
    // AJOUTEZ CETTE LIGNE ICI :
    @Autowired
    private CourrierRepository courrierRepository;

    // --- À AJOUTER DANS CourrierController.java ---

    @GetMapping
    public ResponseEntity<?> getMesCourriers() {
        // 1. Récupérer l'email de l'agence connectée
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Trouver l'utilisateur agence
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        // 3. Récupérer les courriers via le repository (ou service)
        // Assurez-vous que cette méthode existe dans votre CourrierService ou Repository
        return ResponseEntity.ok(courrierService.getCourriersParAgence(agence.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modifierColis(@PathVariable Long id, @RequestBody Courrier details) {
        return ResponseEntity.ok(courrierService.modifier(id, details));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerColis(@PathVariable Long id) {
        courrierService.supprimer(id);
        return ResponseEntity.ok().build();
    }



    // --- MÉTHODE ASSIGNER TRANSPORT (MISE À JOUR) ---
    @PatchMapping("/{id}/assigner-transport")
    public ResponseEntity<?> assignerTransport(
            @PathVariable Long id,
            @RequestBody Map<String, Long> ids) {
        try {
            // Extraction des IDs envoyés par le Frontend
            Long vehiculeId = ids.get("vehiculeId");
            Long chauffeurId = ids.get("chauffeurId");

            // Appel au service et retour immédiat du résultat
            Courrier updated = courrierService.assignerTransport(id, vehiculeId, chauffeurId);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            // Gestion d'erreur indispensable pour éviter le "Missing return statement"
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Erreur lors de l'assignation du transport",
                    "error", e.getMessage()
            ));
        }
    }

    // --- MÉTHODE MES ENVOIS (VÉRIFIÉE) ---
    @PreAuthorize("hasAnyRole('CLIENT', 'USER', 'AGENCE', 'ADMIN')")
    @GetMapping("/mes-envois")
    public ResponseEntity<?> getMesEnvois() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String role = user.getRole().name();
            String telephone = user.getTelephone();

            // 1. Cas du CLIENT / VOYAGEUR
            if (role.contains("CLIENT") || role.contains("USER")) {
                if (telephone == null || telephone.trim().isEmpty()) {
                    return ResponseEntity.ok(new ArrayList<Courrier>());
                }

                String telNettoye = telephone.replaceAll("[^0-9]", "");
                if (telNettoye.length() > 9) {
                    telNettoye = telNettoye.substring(telNettoye.length() - 9);
                }
                return ResponseEntity.ok(courrierRepository.findByTelephoneFuzzy(telNettoye));
            }

            // 2. Cas de l'AGENCE
            if (role.contains("AGENCE")) {
                return ResponseEntity.ok(courrierService.getCourriersParAgence(user.getId()));
            }

            // Cas par défaut (ex: ADMIN)
            return ResponseEntity.ok(new ArrayList<Courrier>());

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Erreur lors de la récupération des envois",
                    "error", e.getMessage()
            ));
        }
    }

    // Dans CourrierController.java


    // NOUVEL ENDPOINT : Pour changer le statut depuis le tableau (ex: Bouton "Marquer comme Arrivé")
// Dans CourrierController.java
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasRole('AGENCE')")
    public ResponseEntity<?> changerStatut(@PathVariable Long id, @RequestParam String statut) {
        // AJOUTE CETTE LIGNE ICI :
        System.out.println("🚀 REQUÊTE REÇUE : Changement de statut pour le colis " + id + " vers " + statut);

        try {
            Courrier maj = courrierService.mettreAJourStatut(id, statut);
            return ResponseEntity.ok(maj);
        } catch (Exception e) {
            System.err.println("❌ ERREUR CONTROLLER : " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/envoyer")
    public ResponseEntity<?> envoyerColis(@RequestBody Courrier courrier) {
        // 1. Récupérer l'authentification
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return ResponseEntity.status(401).body("Non authentifié");

        String email = auth.getName();

        // 2. RÉCUPÉRER L'AGENCE (C'est ici que l'erreur se trouvait)
        // On cherche l'utilisateur en base de données pour créer la variable 'agence'
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

        // 3. Appeler le service avec la variable 'agence' maintenant définie
        Courrier sauvgarde = courrierService.enregistrerColis(courrier, agence);

        return ResponseEntity.ok(sauvgarde);
    }
} // <--- UNE SEULE ACCOLADE ICI POUR FERMER LA CLASSE (Vérifie bien la fin de ton fichier)

