package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.CotationRequest;
import com.example.gariconnectbackend.dto.DemandeRecuperationRequest;
import com.example.gariconnectbackend.model.DemandeRecuperation;
import com.example.gariconnectbackend.service.DemandeRecuperationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api") // Ajusté à /api pour gérer de manière flexible les sous-branches
@CrossOrigin("*")
public class DemandeRecuperationController {

    @Autowired
    private DemandeRecuperationService recuperationService;


    // CLIENT : Obtenir toutes ses demandes de récupération personnelles
    @GetMapping("/recuperations/mes-demandes")
    public ResponseEntity<?> obtenirMesDemandes() {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            List<DemandeRecuperation> demandes = recuperationService.obtenirDemandesDuClient(emailConnecte);
            return ResponseEntity.ok(demandes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // AGENT/ADMIN : Lister toutes les demandes en attente de prix (Cotation)
    // 🔥 MODIFICATION : Reçoit l'ancienne route client ET la nouvelle route de l'interface Guichet React
    @GetMapping({"/recuperations/en-attente", "/agences/demandes-recuperation/en-attente"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> obtenirDemandesEnAttente() {
        try {
            List<DemandeRecuperation> enAttente = recuperationService.obtenirDemandesEnAttente();
            return ResponseEntity.ok(enAttente);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    // CLIENT : Faire une demande de ramassage à domicile
    @PostMapping("/recuperations/demande")
    public ResponseEntity<?> soumettreDemande(@RequestBody DemandeRecuperationRequest request) {
        try {
            String emailConnecte = SecurityContextHolder.getContext().getAuthentication().getName();
            DemandeRecuperation nouvelleDemande = recuperationService.creerDemande(request, emailConnecte);
            return ResponseEntity.ok(nouvelleDemande);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // AGENT/ADMIN : Fixer le point de repère et le prix final pour le client
    // Supporte les deux formats d'URL pour assurer la compatibilité avec le frontend
    @PutMapping({"/recuperations/{id}/cotation", "/agences/demandes-recuperation/coter/{id}"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
    public ResponseEntity<?> fixerCotation(@PathVariable Long id, @RequestBody CotationRequest request) {
        try {
            // 🔥 BLOC DE SÉCURITÉ ANTI-400 : Traitement manuel des valeurs nulles ou mal formées
            if (request.getPointRepereAgence() == null || request.getPointRepereAgence().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le point de repère de l'agence ne peut pas être vide."));
            }

            // Si la distance ou le prix sont nulls ou indéfinis, on applique une valeur par défaut sécurisée (0)
            if (request.getDistanceEstimee() == null) {
                request.setDistanceEstimee(0.0);
            }
            if (request.getPrixSupplementaire() == null) {
                request.setPrixSupplementaire(0.0);
            }

            // Validation logique additionnelle
            if (request.getDistanceEstimee() < 0 || request.getPrixSupplementaire() < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "La distance et le prix doivent être des valeurs positives."));
            }

            // Exécution du traitement métier sécurisé
            DemandeRecuperation demandeCotee = recuperationService.attribuerCotation(id, request);
            return ResponseEntity.ok(demandeCotee);

        } catch (Exception e) {
            // Renvoie une erreur propre lisible par l'instruction "alert()" ou "catch" de votre code React
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur lors du traitement de la cotation : " + e.getMessage()));
        }
    }

    // SIMULATION / WEBHOOK PAIEMENT : Valider après paiement réussi du surplus
    @PutMapping("/recuperations/{id}/valider-paiement")
    public ResponseEntity<?> validerPaiement(@PathVariable Long id) {
        try {
            DemandeRecuperation valide = recuperationService.validerPaiementRecuperation(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Paiement de la récupération validé avec succès !",
                    "statut", valide.getStatut()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

}
