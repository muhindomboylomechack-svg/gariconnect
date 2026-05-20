package com.example.gariconnectbackend.controller;


import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.repository.ReservationRepository;
import com.example.gariconnectbackend.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:3000") // Autorise ton app React (VS Code) à appeler ce backend
public class ReservationController {

    @Autowired
    private ReservationService reservationService;
    // AJOUTE CETTE LIGNE ICI :
    @Autowired
    private ReservationRepository reservationRepository;
    // Route pour créer une réservation : POST http://localhost:8080/api/reservations
    @PostMapping
    public ResponseEntity<?> effectuerReservation(@RequestBody Reservation reservation) {
        try {
            Reservation nouvelleReservation = reservationService.creerReservation(reservation);
            return ResponseEntity.ok(nouvelleReservation);
        } catch (RuntimeException e) {
            // Si le véhicule est plein (erreur lancée dans le service), on renvoie un message d'erreur
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/ticket/{codeTicket}")
    public Reservation obtenirTicket(@PathVariable String codeTicket) {
        return reservationRepository.findByCodeTicket(codeTicket)
                .orElseThrow(() -> new RuntimeException("Ticket invalide ou inexistant"));
    }
    // Route pour voir toutes les réservations (pour l'Admin/Gestionnaire)
    @GetMapping
    public List<Reservation> listerToutesLesReservations() {
        return reservationService.listerToutes(); // Pense à ajouter cette méthode simple dans ton service
    }

    @GetMapping("/client/{clientId}")
    public List<Reservation> getReservationsParClient(@PathVariable Long clientId) {











































































































        return reservationService.recupererParClient(clientId);
    }


}
