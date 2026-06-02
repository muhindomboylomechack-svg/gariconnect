package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.EvaluationRequestDTO;
import com.example.gariconnectbackend.model.Evaluation;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.EvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
        import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/evaluations")
@CrossOrigin(origins = "http://localhost:5173") // Sécurité CORS ciblée sur votre React
public class EvaluationController {

    @Autowired
    private EvaluationService evaluationService;

    @Autowired
    private UserRepository userRepository;

    // --- DASHBOARD AGENCE ---
    @GetMapping("/rapport-performance")
    @PreAuthorize("hasAnyRole('AGENCY_ADMIN','AGENCY_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getRapportPerformance() {
        return ResponseEntity.ok(evaluationService.genererRapportPerformance());
    }

    // --- SOUMISSION DU FORMULAIRE ---
    // Ajout du rôle 'AGENCE' pour permettre vos tests actuels sans erreur 403[cite: 17]
    @PostMapping("/soumettre")
    @PreAuthorize("hasAnyRole('CLIENT', 'USER', 'AGENC','SUPER_ADMIN')")
    public ResponseEntity<?> soumettre(@Valid @RequestBody EvaluationRequestDTO dto) {
        try {
            String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            User clientConnecte = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            evaluationService.soumettreEvaluation(dto, clientConnecte);

            return ResponseEntity.ok().body(Map.of(
                    "message", "Merci pour votre évaluation !",
                    "count", evaluationService.getNombreEvaluations(dto.getReservationId(), clientConnecte.getId())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // --- VÉRIFICATION DE LA LIMITE ---
    @GetMapping("/count/{reservationId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'USER', 'AGENCE','SUPER_ADMIN')")
    public ResponseEntity<?> getCount(@PathVariable Long reservationId) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User client = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        long count = evaluationService.getNombreEvaluations(reservationId, client.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }


    @GetMapping("/mon-rapport")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getMonRapportPerformance() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User chauffeur = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

        return ResponseEntity.ok(evaluationService.genererRapportChauffeur(chauffeur.getId()));
    }
}

