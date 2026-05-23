

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
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<FinanceTransaction> addTransaction(@RequestBody FinanceTransaction transaction) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Agence non trouvée"));
        transaction.setAgence(agence);
        return ResponseEntity.ok(financeService.createTransaction(transaction));
    }

    /**
     * NOUVEAU : Modifier une transaction existante
     */
    @PutMapping("/transactions/{id}")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
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