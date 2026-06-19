
/*
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.LivreDeCaisseRow;
import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.FinanceRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin("*")
public class FinanceController {

    @Autowired private FinanceService financeService;
    @Autowired private UserRepository userRepository;
    @Autowired private FinanceRepository financeRepository;

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('AGENCE','SUPER_ADMIN')")
    public ResponseEntity<FinanceTransaction> addTransaction(@RequestBody FinanceTransaction transaction) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Agence non trouvée"));
        transaction.setAgence(agence);
        return ResponseEntity.ok(financeService.createTransaction(transaction));
    }


    @PutMapping("/transactions/{id}")
    @PreAuthorize("hasAnyRole('AGENCE', 'SUPER_ADMIN')")
    public ResponseEntity<FinanceTransaction> updateTransaction(@PathVariable Long id, @RequestBody FinanceTransaction details) {
        FinanceTransaction transaction = financeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

        // Mise à jour des champs autorisés
        transaction.setDate(details.getDate());
        transaction.setEntite(details.getEntite());
        transaction.setDescription(details.getDescription());
        transaction.setMontant(details.getMontant());
        transaction.setDevise(details.getDevise());
        transaction.setTypeTransaction(details.getTypeTransaction());
        transaction.setDocumentRef(details.getDocumentRef());

        return ResponseEntity.ok(financeRepository.save(transaction));
    }

    @GetMapping("/livre-de-caisse")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<List<LivreDeCaisseRow>> getReport() {
        return ResponseEntity.ok(financeService.generateLivreDeCaisse());
    }
}
*/
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.LivreDeCaisseRow;
import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.FinanceRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/finance")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
public class FinanceController {

    @Autowired private FinanceService financeService;
    @Autowired private UserRepository userRepository;
    @Autowired private FinanceRepository financeRepository;

    /**
     * Récupérer les transactions
     * - SUPER_ADMIN : Accès global.
     * - ADMIN / AGENCE : Accès restreint à son agence.
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        if (userConnecte.getRole() == Role.SUPER_ADMIN) {
            return ResponseEntity.ok(financeRepository.findAll());
        }

        User agence = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
        return ResponseEntity.ok(financeRepository.findByAgence(agence));
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<?> updateTransaction(@PathVariable Long id, @RequestBody FinanceTransaction details) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        FinanceTransaction transaction = financeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

        // Sécurité : Vérifier si l'admin a le droit de modifier cette transaction
        if (userConnecte.getRole() != Role.SUPER_ADMIN) {
            User agence = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
            if (transaction.getAgence() == null || !transaction.getAgence().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Accès refusé."));
            }
        }

        transaction.setDate(details.getDate());
        transaction.setEntite(details.getEntite());
        transaction.setDescription(details.getDescription());
        transaction.setMontant(details.getMontant());
        transaction.setDevise(details.getDevise());
        transaction.setTypeTransaction(details.getTypeTransaction());
        transaction.setDocumentRef(details.getDocumentRef());

        return ResponseEntity.ok(financeRepository.save(transaction));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        FinanceTransaction transaction = financeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

        if (userConnecte.getRole() != Role.SUPER_ADMIN) {
            User agence = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
            if (transaction.getAgence() == null || !transaction.getAgence().getId().equals(agence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Action non autorisée."));
            }
        }

        financeRepository.delete(transaction);
        return ResponseEntity.ok(Map.of("message", "Transaction supprimée."));
    }




    @GetMapping("/livre-de-caisse")
    public ResponseEntity<?> getReport() {
        System.out.println("\n=====================================================");
        System.out.println("🚀 APPEL API : /api/finance/livre-de-caisse");

        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("👤 Email connecté : " + email);

            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            System.out.println("🔑 Rôle de l'utilisateur : " + userConnecte.getRole());
            System.out.println("🆔 ID de l'utilisateur connecté : " + userConnecte.getId());
            if (userConnecte.getAgenceEmployeur() != null) {
                System.out.println("🏢 ID de l'agence employeur : " + userConnecte.getAgenceEmployeur().getId());
            }

            // 🔥 LE BYPASS ABSOLU : On récupère TOUTES les transactions de la DB, sans aucun filtre
            System.out.println("⏳ Interrogation de la base de données (findAll)...");
            var allData = financeService.generateLivreDeCaisseGlobal();

            System.out.println("📦 Nombre de lignes générées : " + allData.size());

            if (allData.isEmpty()) {
                System.out.println("🚨 ALERTE : Le service retourne 0 lignes ! Le problème vient de la lecture JPA (Hibernate ne lit pas la bonne table ou la table est vraiment vide pour lui).");
            } else {
                System.out.println("✅ SUCCÈS : Les données sont lues ! Envoi au frontend...");
            }
            System.out.println("=====================================================\n");

            // On renvoie TOUT au frontend pour forcer l'affichage
            return ResponseEntity.ok(allData);

        } catch (Exception e) {
            System.err.println("❌ ERREUR CRITIQUE : " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('AGENCE','SUPER_ADMIN', 'AGENCY_MANAGER', 'AGENCY_ADMIN')") // Extension des rôles autorisés
    public ResponseEntity<?> addTransaction(@RequestBody FinanceTransaction transaction) {
        try {
            // 1. Récupérer l'utilisateur actuellement connecté via le token SecurityContext
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userConnecte = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));

            System.out.println("📝 [FINANCE] Création manuelle de transaction par : " + email + " (Rôle: " + userConnecte.getRole() + ")");

            // 2. Détermination de l'agence propriétaire de cette écriture comptable
            User agenceCible = null;

            if (userConnecte.getRole() == Role.AGENCY_MANAGER || userConnecte.getRole() == Role.AGENCY_ADMIN) {
                // Le gestionnaire est lui-même l'entité agence
                agenceCible = userConnecte;
            } else if (userConnecte.getAgenceEmployeur() != null) {
                // C'est un employé, on récupère son agence de rattachement
                agenceCible = userConnecte.getAgenceEmployeur();
            } else if (userConnecte.getRole() == Role.SUPER_ADMIN) {
                // Si c'est le Super Admin qui crée une opération manuelle, il faut s'assurer qu'il a choisi
                // une agence dans le formulaire frontend, sinon on lui refuse pour ne pas violer le 'nullable = false'
                if (transaction.getAgence() != null && transaction.getAgence().getId() != null) {
                    agenceCible = userRepository.findById(transaction.getAgence().getId())
                            .orElseThrow(() -> new RuntimeException("L'agence spécifiée par le Super Admin n'existe pas"));
                } else {
                    return ResponseEntity.badRequest().body("Erreur : En tant que SUPER_ADMIN, vous devez spécifier une agence destinataire pour cette transaction.");
                }
            }

            // 3. Sécurité finale : Si aucune agence n'est trouvée, on refuse la création
            if (agenceCible == null) {
                return ResponseEntity.badRequest().body("Erreur : Impossible de lier cette transaction à une agence valide.");
            }

            // 4. Injecter l'agence validée dans l'entité avant la sauvegarde
            transaction.setAgence(agenceCible);

            // 5. Forcer les valeurs par défaut au cas où le frontend ne les envoie pas
            if (transaction.getTypeTransaction() == null) {
                return ResponseEntity.badRequest().body("Erreur : Le type de transaction (ENTREE ou SORTIE) est obligatoire.");
            }
            // Normalisation des chaînes de caractères (ex: "entree" -> "ENTREE")
            transaction.setTypeTransaction(transaction.getTypeTransaction().toUpperCase());

            // 6. Enregistrement via le service
            FinanceTransaction nouvelleTransaction = financeService.createTransaction(transaction);
            System.out.println("✅ [FINANCE] Transaction manuelle enregistrée avec succès. ID: " + nouvelleTransaction.getId());

            return ResponseEntity.ok(nouvelleTransaction);

        } catch (Exception e) {
            System.err.println("❌ [FINANCE ERROR] Échec lors de la création de la transaction : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'enregistrement : " + e.getMessage());
        }
    }
    }
