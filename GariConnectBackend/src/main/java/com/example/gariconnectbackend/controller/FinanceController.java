
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

        import java.util.List;
import java.util.Map;

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

    @PostMapping("/transactions")
    public ResponseEntity<?> addTransaction(@RequestBody FinanceTransaction transaction) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        // Le SUPER_ADMIN peut forcer une agence, sinon on assigne celle de l'admin/agence
        if (userConnecte.getRole() != Role.SUPER_ADMIN) {
            User agence = (userConnecte.getRole() == Role.AGENCY_MANAGER) ? userConnecte : userConnecte.getAgenceEmployeur();
            transaction.setAgence(agence);
        }

        return ResponseEntity.ok(financeService.createTransaction(transaction));
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
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User userConnecte = userRepository.findByEmail(email).orElseThrow();

        // Note : Votre service generateLivreDeCaisse devra être adapté pour accepter un ID d'agence
        return ResponseEntity.ok(financeService.generateLivreDeCaisse());
    }
}