package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.CourrierRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.CourrierService;
import com.example.gariconnectbackend.service.IntelligenceArtificielleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courriers")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CLIENT', 'USER')")
public class CourrierController {

    @Autowired
    private CourrierService courrierService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourrierRepository courrierRepository;

    @Autowired
    private IntelligenceArtificielleService iaService;

    /**
     * 📦 Récupérer les colis et courriers de l'agence connectée
     */
    @GetMapping
    public ResponseEntity<?> listerCourriers() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();

            if (email == null || email.equals("anonymousUser")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Session expirée ou utilisateur non authentifié."));
            }

            User utilisateur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

            if (utilisateur.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.ok(courrierRepository.findAll());
            }

            User agenceConnectee = getAgencePourUtilisateur(utilisateur);
            if (agenceConnectee == null) {
                return ResponseEntity.ok(new ArrayList<Courrier>());
            }

            List<Courrier> courriersAgence = courrierRepository.findByAgenceOrigineOrderByIdDesc(agenceConnectee);
            return ResponseEntity.ok(courriersAgence);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération : " + e.getMessage()));
        }
    }

    /**
     * 🤖 POST : Lancement de l'analyse avec détection de devises, équivalents et justifications complètes
     */
    @PostMapping("/analyser-ia")
    public ResponseEntity<?> analyserColisParIA(@RequestBody Courrier simulationColis) {
        try {
            if (simulationColis == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Données du colis manquantes ou invalides."));
            }

            // Traitement dynamique par Gemini (Calcul du prix, conversion et extraction des raisons logistiques)
            iaService.evaluerRisqueEtPrix(simulationColis);

            return ResponseEntity.ok(simulationColis);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Échec de l'analyse intelligente : " + e.getMessage()));
        }
    }

    /**
     * 💾 POST : Enregistrement et persistance d'un colis
     */
    @PostMapping("/envoyer")
    public ResponseEntity<?> enregistrerCourrier(@RequestBody Courrier courrier) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            User agencecible = getAgencePourUtilisateur(utilisateur);
            if (agencecible == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Votre compte n'est rattaché à aucune agence."));
            }

            Courrier sauvegarde = courrierService.enregistrerColis(courrier, agencecible);
            return ResponseEntity.ok(sauvegarde);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur d'enregistrement : " + e.getMessage()));
        }
    }

    /**
     * 🔄 PUT : Modifier un colis existant
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> modifierCourrier(@PathVariable Long id, @RequestBody Courrier donnees) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Courrier existant = courrierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Colis introuvable"));

            if (!aAccesAuCourrier(userConnecte, existant)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Permissions insuffisantes pour interagir avec ce colis."));
            }

            // Transfert des données de base
            existant.setNomExpediteur(donnees.getNomExpediteur());
            existant.setTelExpediteur(donnees.getTelExpediteur());
            existant.setNomDestinataire(donnees.getNomDestinataire());
            existant.setTelDestinataire(donnees.getTelDestinataire());
            existant.setDescription(donnees.getDescription());
            existant.setPrix(donnees.getPrix());
            existant.setType(donnees.getType());
            existant.setPoidsKg(donnees.getPoidsKg());
            existant.setValeurEstimee(donnees.getValeurEstimee());
            existant.setEstFragile(donnees.isEstFragile());

            // Sauvegarde définitive des champs enrichis par l'IA (Risques, Équivalences monétaires et raisons logistiques)
            existant.setNiveauRisqueIA(donnees.getNiveauRisqueIA());
            existant.setJustificationIA(donnees.getJustificationIA());
            existant.setPrixSuggereIA(donnees.getPrixSuggereIA());

            if (donnees.getTrajet() != null) {
                existant.setTrajet(donnees.getTrajet());
            }

            Courrier modifie = courrierRepository.save(existant);
            return ResponseEntity.ok(modifie);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la mise à jour : " + e.getMessage()));
        }
    }

    /**
     * ❌ DELETE : Supprimer un colis
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerCourrier(@PathVariable Long id) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Courrier courrier = courrierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Colis introuvable"));

            if (!aAccesAuCourrier(userConnecte, courrier)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Droits d'accès insuffisants."));
            }

            courrierRepository.delete(courrier);
            return ResponseEntity.ok(Map.of("message", "Colis supprimé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors de la suppression."));
        }
    }

    private boolean aAccesAuCourrier(User userConnecte, Courrier courrier) {
        if (userConnecte.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        User agenceIdConnected = getAgencePourUtilisateur(userConnecte);
        return agenceIdConnected != null &&
                courrier.getAgence() != null &&
                courrier.getAgence().getId().equals(agenceIdConnected.getId());
    }

    private User getAgencePourUtilisateur(User utilisateur) {
        if (utilisateur.getRole() == Role.AGENCY_MANAGER) {
            return utilisateur;
        }
        return utilisateur.getAgenceEmployeur();
    }



}
