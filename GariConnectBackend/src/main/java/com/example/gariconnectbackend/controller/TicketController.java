package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Ticket;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.TicketRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/tickets") // 👈 Vérifie que l'URL de base est exactement "/api/tickets"
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private UserRepository userRepository;
    // 1. Déclarer le champ privé final
    private final TicketRepository ticketRepository;

    // 2. L'injecter via le constructeur
    public TicketController(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

        @GetMapping("/mes-tickets-actifs") // ✅ Utilise bien @GetMapping et l'URL exacte
        public ResponseEntity<?> getMesTicketsActifs(Authentication authentication) {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Non autorisé");
            }

            String email = authentication.getName();
            List<Ticket> tickets = ticketService.getTicketsPourUtilisateur(email);

            return ResponseEntity.ok(tickets);
        }



//    @GetMapping("/mes-tickets")
//    public ResponseEntity<?> getMesTicketsActifs(Authentication authentication) {
//        if (authentication == null || !authentication.isAuthenticated()) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Non autorisé");
//        }
//
//        String email = authentication.getName();
//        List<Ticket> tickets = ticketService.getTicketsPourUtilisateur(email);
//
//        return ResponseEntity.ok(tickets);
//    }
    // 🟢 Masquer un ticket spécifique
    @PutMapping("/{id}/masquer")
    public ResponseEntity<?> masquerTicket(@PathVariable Long id) {
        ticketService.masquerTicket(id);
        return ResponseEntity.ok(Map.of("message", "Ticket masqué avec succès"));
    }

    // 🟢 Scanner/Valider l'embarquement d'un ticket au guichet/bus
    @PutMapping("/valider-embarquement/{codeTicket}")
    public ResponseEntity<?> validerEmbarquement(@PathVariable String codeTicket) {
        Ticket ticketValide = ticketService.validerEmbarquement(codeTicket);
        return ResponseEntity.ok(Map.of(
                "message", "Embarquement confirmé",
                "ticket", ticketValide
        ));
    }



// ...

    @GetMapping("/historique")
    public ResponseEntity<?> getHistoriqueTickets(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Utilisateur non authentifié");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé pour l'email: " + email));

        List<Ticket> historique = ticketService.obtenirHistoriqueUtilisateur(user.getId());
        return ResponseEntity.ok(historique);
    }

    // 🟢 AJOUTER OU CORRIGER CET ENDPOINT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerTicket(@PathVariable Long id) {
        try {
            ticketService.supprimerTicket(id);
            return ResponseEntity.ok(Map.of("message", "Ticket supprimé avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", "Ticket introuvable avec l'ID : " + id));
        }
    }

    @PatchMapping("/tickets/{id}/embarquer")
    public ResponseEntity<?> validerEmbarquement(@PathVariable Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        // Vérification de sécurité
        if ("EMBARQUE".equals(ticket.getStatut())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ce ticket a déjà été scanné et embarqué !"));
        }

        // Mise à jour du statut du ticket
        ticket.setStatut("EMBARQUE");

        // (Optionnel) Mise à jour du statut de la réservation associée
        if (ticket.getReservation() != null) {
            ticket.getReservation().setStatut("EMBARQUE");
        }

        ticketRepository.save(ticket);

        return ResponseEntity.ok(ticket);
    }
}
