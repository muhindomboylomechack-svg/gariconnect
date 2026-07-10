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
import java.util.Optional;

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

//    @GetMapping
//    public ResponseEntity<?> listerCourriers() {
//        try {
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//
//            if (email == null || email.equals("anonymousUser")) {
//                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                        .body(Map.of("message", "Session expirée ou utilisateur non authentifié."));
//            }
//
//            User utilisateur = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
//
//            if (utilisateur.getRole() == Role.SUPER_ADMIN) {
//                return ResponseEntity.ok(courrierRepository.findAll());
//            }
//
//            User agenceConnectee = getAgencePourUtilisateur(utilisateur);
//            if (agenceConnectee == null) {
//                return ResponseEntity.ok(new ArrayList<Courrier>());
//            }
//
//            List<Courrier> courriersAgence = courrierRepository.findByAgenceOrigineOrderByIdDesc(agenceConnectee);
//            return ResponseEntity.ok(courriersAgence);
//
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Map.of("message", "Erreur lors de la récupération : " + e.getMessage()));
//        }
//    }

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
// À ajouter ou modifier dans CourrierController.java

    @GetMapping("/mon-hub")
    public ResponseEntity<?> getMonHubCourriers() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Utilise la requête unifiée (par ID de compte ou par téléphone alternatif)
            List<Courrier> mesColis = courrierService.getCourriersPourClientConnecte(userConnecte);
            return ResponseEntity.ok(mesColis);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur lors du chargement du hub : " + e.getMessage()));
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

            // CORRECTION : Assigner explicitement l'agence cible au courrier avant de le créer
            courrier.setAgence(agencecible);

            Courrier nouveau = courrierService.creerCourrier(courrier);
            return ResponseEntity.ok(nouveau);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Erreur d'enregistrement : " + e.getMessage()));
        }
    }

    /**
     * 📦 GET : Récupérer les courriers
     */
    @GetMapping
    public ResponseEntity<?> getAllCourriers() {
        try {
            // 1. Récupérer l'utilisateur actuellement connecté via Spring Security
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));

            // 2. Si c'est un SUPER_ADMIN, il voit l'intégralité des flux de colis du système
            if (userConnecte.getRole() == Role.SUPER_ADMIN) {
                List<Courrier> tousLesCourriers = courrierRepository.findAll();
                return ResponseEntity.ok(tousLesCourriers);
            }

            // 3. Récupérer l'agence associée à l'utilisateur connecté (Gestionnaire ou Employé)
            User agenceConnected = getAgencePourUtilisateur(userConnecte);
            if (agenceConnected == null) {
                // Si l'utilisateur n'est rattaché à aucune agence, on retourne une liste vide sécurisée
                return ResponseEntity.ok(new ArrayList<>());
            }

            // 4. CORRECTION : On récupère tous les courriers directement liés à l'agence connectée
            List<Courrier> courriersAgence = courrierRepository.findByAgenceOrigineOrderByIdDesc(agenceConnected);

            return ResponseEntity.ok(courriersAgence);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du chargement des colis : " + e.getMessage()));
        }
    }
    @PutMapping("/{id}/statut")
    public ResponseEntity<?> modifierStatutCourrier(
            @PathVariable Long id,
            @RequestParam("statut") String nouveauStatut) {
        try {
            // 1. Validation de la chaîne reçue vers l'énumération pour éviter les crashs
            try {
                StatutCourrier.valueOf(nouveauStatut.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Statut invalide : " + nouveauStatut));
            }

            // 2. Appel au service métier pour la mise à jour réelle en Base de Données
            Courrier courrierMisAJour = courrierService.mettreAJourStatut(id, nouveauStatut.toUpperCase());

            return ResponseEntity.ok(Map.of(
                    "message", "Statut mis à jour avec succès",
                    "id", id,
                    "statut", courrierMisAJour.getStatut()
            ));

        } catch (RuntimeException e) {
            // Gère l'exception lancée par courrierService si le courrier n'est pas trouvé
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du changement de statut : " + e.getMessage()));
        }
    }
    @GetMapping("/suivi/{code}")
    public ResponseEntity<?> suivreColis(@PathVariable String code) {
        // 1. Attention à la casse : est-ce que "codeRetrait" en BDD correspond à "FEE2035F" ?
        Optional<Courrier> courrier = courrierService.findByCodeRetrait(code);

        if (courrier.isEmpty()) {
            // Si le code n'existe pas, ton backend renvoie peut-être une 404 ici !
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Aucun colis trouvé avec le code : " + code);
        }

        return ResponseEntity.ok(courrier.get());
    }
    @PutMapping("/agences/courriers/{id}/statut")
    public ResponseEntity<?> updateStatut(
            @PathVariable("id") Long id,
            @RequestParam("statut") String statutStr) {

        try {
            // Log de sécurité pour le débogage en console
            System.out.println("Mise à jour demandée pour le courrier ID: " + id + " avec le statut: " + statutStr);

            // 1. Validation de la chaîne reçue vers l'énumération (évite les exceptions 500 silencieuses)
            // Assurez-vous que votre Enum possède bien les valeurs : EN_ATTENTE, EN_ROUTE, ARRIVE
            StatutCourrier statut;
            try {
                statut = StatutCourrier.valueOf(statutStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Statut invalide : " + statutStr));
            }

            // 2. Appel au service métier pour la mise à jour en Base de Données
            // Courrier updatedCourrier = courrierService.modifierStatut(id, statut);
            // Si le courrier n'existe pas, renvoyez une erreur explicite
            // if (updatedCourrier == null) return ResponseEntity.notFound().build();

            // Simulation d'un objet de retour pour correspondre aux attentes du front
            Map<String, Object> mockResponse = Map.of(
                    "id", id,
                    "statut", statut.toString(),
                    "message", "Le statut a été mis à jour avec succès par l'agence."
            );

            return ResponseEntity.ok(mockResponse);

        } catch (Exception e) {
            return ResponseEntity
                    .status(500)
                    .body(Map.of("error", "Une erreur interne est survenue: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<?> rejeterColis(
            @PathVariable Long id,
            @RequestParam(required = false) String motif) {

        try {
            // 1. Vérification de l'utilisateur connecté via Spring Security
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Courrier courrier = courrierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Colis introuvable"));

            // 2. Vérification des droits d'accès de l'agence sur ce colis
            if (!aAccesAuCourrier(userConnecte, courrier)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Permissions insuffisantes pour rejeter ce colis."));
            }

            // 3. Appel du service métier pour exécuter le rejet et notifier le client
            Courrier courrierRejete = courrierService.rejeterDemande(id, motif);

            return ResponseEntity.ok(Map.of(
                    "message", "La demande de colis a été rejetée avec succès.",
                    "id", id,
                    "statut", courrierRejete.getStatut()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du rejet du colis : " + e.getMessage()));
        }
    }

    @PostMapping("/pre-enregistrer")
    public ResponseEntity<Courrier> preEnregistrerColis(@RequestBody Courrier courrier) {
        // Correction de statut pour éviter la confusion avec les colis agence[cite: 3]
        courrier.setStatut("EN_ATTENTE_DE_VALIDATION");

        // On utilise la méthode générique de sauvegarde
        Courrier nouveauCourrier = courrierService.sauvegarder(courrier);
        return ResponseEntity.ok(nouveauCourrier);
    }

//
//    @PutMapping("/{id}/valider")
//    public ResponseEntity<?> validerColis(
//            @PathVariable Long id,
//            @RequestParam Double poidsReel,
//            @RequestParam String devise,
//            @RequestParam Double valeurEstimee,
//            @RequestParam(required = false, defaultValue = "1.0") Double tauxChange) { // 👈 Réception du paramètre taux
//
//        try {
//            // 1. Récupérer l'agent/agence connecté qui valide le colis
//            String email = SecurityContextHolder.getContext().getAuthentication().getName();
//            User utilisateur = userRepository.findByEmail(email)
//                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
//
//            User agenceConnectee = getAgencePourUtilisateur(utilisateur);
//            if (agenceConnectee == null) {
//                return ResponseEntity.badRequest().body(Map.of("message", "Votre compte n'est rattaché à aucune agence pour valider ce colis."));
//            }
//
//            // 2. Appel du service avec le paramètre du tauxChange transmis
//            Courrier courrierValide = courrierService.validerDemande(id, poidsReel, devise, valeurEstimee, tauxChange, agenceConnectee);
//            return ResponseEntity.ok(courrierValide);
//
//        } catch (RuntimeException e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur lors de la validation : " + e.getMessage()));
//        }
//    }

    /**
     * 🔍 GET : Récupérer les courriers filtrés par statut pour l'agence connectée
     * CORRIGÉ : Gère les colis pré-enregistrés qui n'ont pas encore d'agence assignée.
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<?> getCourriersParStatut(@PathVariable String statut) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));

            List<Courrier> courriersFiltres;

            if (userConnecte.getRole() == Role.SUPER_ADMIN) {
                courriersFiltres = courrierRepository.findAll().stream()
                        .filter(c -> c.getStatut() != null && c.getStatut().equalsIgnoreCase(statut))
                        .toList();
            } else {
                User agenceConnected = getAgencePourUtilisateur(userConnecte);
                if (agenceConnected == null) {
                    return ResponseEntity.ok(new ArrayList<>());
                }

                // 🔴 CORRECTION : Gérer spécifiquement les colis pré-enregistrés
                // Ces colis n'ont pas encore d'agence, on ignore donc le filtre findByAgenceOrigine...
                if (statut.equalsIgnoreCase("EN_ATTENTE_DE_VALIDATION")) {
                    courriersFiltres = courrierRepository.findAll().stream()
                            .filter(c -> c.getStatut() != null &&
                                    c.getStatut().equalsIgnoreCase(statut) &&
                                    c.getAgence() == null) // Seulement ceux sans agence
                            .toList();
                } else {
                    // Pour les autres statuts, on filtre normalement par l'agence connectée
                    List<Courrier> tousLesCourriers = courrierRepository.findByAgenceOrigineOrderByIdDesc(agenceConnected);
                    courriersFiltres = tousLesCourriers.stream()
                            .filter(c -> c.getStatut() != null && c.getStatut().equalsIgnoreCase(statut))
                            .toList();
                }
            }

            return ResponseEntity.ok(courriersFiltres);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du chargement des colis par statut : " + e.getMessage()));
        }
    }



    /**
     * ⚙️ PUT : Valider un colis et synchroniser le taux de l'agence
     */
    @PutMapping("/{id}/valider")
    public ResponseEntity<?> validerColis(
            @PathVariable Long id,
            @RequestParam Double poidsReel,
            @RequestParam String devise,
            @RequestParam Double valeurEstimee,
            @RequestParam(required = false, defaultValue = "1.0") Double tauxChange) {

        try {
            // 1. Récupérer l'agent/agence connecté qui valide le colis
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            User agenceConnectee = getAgencePourUtilisateur(utilisateur);
            if (agenceConnectee == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Votre compte n'est rattaché à aucune agence pour valider ce colis."));
            }

            // 2. MISE À JOUR MULTI-TENANT : Sauvegarder également le taux saisi comme le taux par défaut de l'agence
            if (tauxChange != null && tauxChange > 1.0) {
                agenceConnectee.setTauxEchangeCourant(tauxChange);
                userRepository.save(agenceConnectee);
            }

            // 3. Appel du service avec le paramètre du tauxChange transmis pour figer le taux sur le colis
            Courrier courrierValide = courrierService.validerDemande(id, poidsReel, devise, valeurEstimee, tauxChange, agenceConnectee);
            return ResponseEntity.ok(courrierValide);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Erreur lors de la validation : " + e.getMessage()));
        }
    }

    /**
     * 🔍 GET : Récupérer le taux de change courant de l'agence
     */
    @GetMapping("/agences/taux-change")
    public ResponseEntity<?> getTauxAgence() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateur = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            User agence = getAgencePourUtilisateur(utilisateur);
            if (agence == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));
            }

            // Si le taux n'est pas encore défini en base de données, on renvoie 2800 par défaut
            Double taux = agence.getTauxEchangeCourant() != null ? agence.getTauxEchangeCourant() : 2800.0;
            return ResponseEntity.ok(Map.of("valeur", taux));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération du taux : " + e.getMessage()));
        }
    }

    /**
     * 🔄 PUT : Modifier le taux de change de l'agence (Multi-tenant)
     */
    @PutMapping("/agences/taux-change")
    public ResponseEntity<?> modifierTauxAgence(@RequestBody Map<String, Double> payload) {
        try {
            Double tauxChange = payload.get("valeur");
            if (tauxChange == null || tauxChange <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le taux de change doit être supérieur à 0."));
            }

            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User utilisateur = userRepository.findByEmail(email).orElseThrow();
            User agenceConnectee = getAgencePourUtilisateur(utilisateur);

            if (agenceConnectee == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Aucune agence rattachée."));
            }

            agenceConnectee.setTauxEchangeCourant(tauxChange);
            userRepository.save(agenceConnectee);

            return ResponseEntity.ok(Map.of(
                    "message", "Taux mis à jour avec succès.",
                    "valeur", tauxChange
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la mise à jour du taux."));
        }
    }
}
// Exemple de l'Enum Backend attendu
enum StatutCourrier {
    EN_ATTENTE,
    EN_ROUTE,
    EN_ATTENTE_DE_VALIDATION,
    ARRIVE,
    LIVRE,
    REJETE
}

