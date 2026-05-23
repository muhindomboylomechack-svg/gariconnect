package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import com.example.gariconnectbackend.service.PaiementService;
import com.example.gariconnectbackend.service.ReservationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/paiements")
@CrossOrigin("*")
public class PaiementController {

    @Autowired private PaiementService paiementService;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private FinanceRepository financeRepository;

    // NOUVEAU : Injection du service de réservation pour déclencher les notifications
    @Autowired private ReservationService reservationService;

    @PostMapping("/payer/{reservationId}")
    public ResponseEntity<Paiement> payer(
            @PathVariable Long reservationId,
            @RequestParam String mode,
            @RequestParam(required = false) String reference) {
        Paiement p = paiementService.effectuerPaiement(reservationId, mode, reference);
        return ResponseEntity.ok(p);
    }

    @PutMapping("/approuver/{paiementId}")
    public ResponseEntity<Paiement> approuverPaiement(@PathVariable Long paiementId) {
        Paiement p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));
        p.setStatut("CONFIRME_PAR_AGENCE");
        return ResponseEntity.ok(paiementRepository.save(p));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public List<Paiement> getTousLesPaiements() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User agence = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
        return paiementRepository.findByReservation_Trajet_Agence(agence);
    }

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyAuthority('AGENCE', 'ROLE_AGENCE', 'ADMIN')")
    public ResponseEntity<?> validerPaiement(@PathVariable Long id) {
        return paiementRepository.findById(id).map(paiement -> {
            paiement.setStatut("SUCCES");
            paiementRepository.save(paiement);
            Reservation res = paiement.getReservation();

            if (res != null && !"CONFIRMEE".equals(res.getStatut())) {
                User agence = res.getTrajet().getAgence();
                Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
                Double montantComm = (res.getTrajet().getPrix() * taux) / 100;

                // On met à jour les champs financiers et de ticket
                res.setMontantCommission(montantComm);
                if (res.getCodeTicket() == null) {
                    res.setCodeTicket("GARI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                }
                reservationRepository.save(res); // Sauvegarde préliminaire

                // 🔥 CORRECTION : Appel du service pour déclencher le statut et la NOTIFICATION
                reservationService.mettreAJourStatut(res.getId(), "CONFIRMEE");

                CommissionDette cd = new CommissionDette();
                cd.setAgence(agence);
                cd.setReservation(res);
                cd.setPaiement(paiement);
                cd.setMontant(montantComm);
                cd.setMontantDu(montantComm);
                commissionRepo.save(cd);

                FinanceTransaction transaction = new FinanceTransaction();
                transaction.setDate(LocalDate.now());
                transaction.setTypeTransaction("ENTREE");
                transaction.setDescription("Paiement validé - Ticket : " + res.getCodeTicket());
                transaction.setMontant(paiement.getMontant());
                transaction.setDevise("CDF");
                transaction.setEntite(res.getClient() != null ? res.getClient().getNom() + " " + res.getClient().getPrenom() : "Client");
                financeRepository.save(transaction);
            }
            return ResponseEntity.ok(Map.of(
                    "message", "Paiement encaissé et ticket validé",
                    "ticket", res != null ? res.getCodeTicket() : "N/A"
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/encaisser")
    @PreAuthorize("hasAnyRole('AGENCE', 'ADMIN')")
    public ResponseEntity<?> encaisserPaiement(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload) {

        try {
            Paiement paiement = paiementRepository.findById(id)
                    .orElseGet(() -> paiementRepository.findByReservationId(id).orElse(null));

            Reservation res;

            if (paiement == null) {
                res = reservationRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Réservation n°" + id + " introuvable"));

                paiement = new Paiement();
                paiement.setReservation(res);
                paiement.setStatut("EN_ATTENTE");
            } else {
                res = paiement.getReservation();
            }

            User agence = res.getTrajet().getAgence();

            Double montantSaisi = res.getTrajet().getPrix();
            if (payload != null && payload.containsKey("montant") && payload.get("montant") != null) {
                montantSaisi = Double.valueOf(payload.get("montant").toString());
            }

            paiement.setStatut("VALIDE");
            paiement.setMontant(montantSaisi);
            paiement.setModePaiement("CASH");
            paiement.setDatePaiement(LocalDateTime.now());
            paiement = paiementRepository.save(paiement);

            // Mise à jour des informations de réservation (SANS le statut)
            res.setMontantPaye(montantSaisi);
            res.setModePaiement("CASH");

            Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
            Double montantComm = (montantSaisi * taux) / 100;
            res.setMontantCommission(montantComm);

            if (res.getCodeTicket() == null) {
                res.setCodeTicket("GARI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }
            reservationRepository.save(res); // Sauvegarde des modifications

            // 🔥 CORRECTION : Appel du service pour valider le statut et NOTIFIER le client
            reservationService.mettreAJourStatut(res.getId(), "CONFIRMEE");

            CommissionDette cd = new CommissionDette();
            cd.setAgence(agence);
            cd.setReservation(res);
            cd.setPaiement(paiement);
            cd.setMontant(montantComm);
            cd.setMontantDu(montantComm);
            commissionRepo.save(cd);

            FinanceTransaction transaction = new FinanceTransaction();
            transaction.setDate(LocalDate.now());
            transaction.setTypeTransaction("ENTREE");
            transaction.setDescription("Encaissement Cash - Ticket : " + res.getCodeTicket());
            transaction.setMontant(montantSaisi);
            transaction.setDevise("CDF");
            transaction.setAgence(agence);

            String nomClient = "Client";
            if (res.getClient() != null) {
                nomClient = res.getClient().getNom() + (res.getClient().getPrenom() != null ? " " + res.getClient().getPrenom() : "");
            }
            transaction.setEntite(nomClient);
            financeRepository.save(transaction);

            return ResponseEntity.ok(Map.of(
                    "message", "Paiement encaissé avec succès",
                    "ticketCode", res.getCodeTicket(),
                    "montant", montantSaisi
            ));

        } catch (Exception e) {
            System.err.println("Erreur encaissement : " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }


}









