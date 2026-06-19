//package com.example.gariconnectbackend.controller;
//
//import com.example.gariconnectbackend.model.*;
//        import com.example.gariconnectbackend.repository.*;
//import com.example.gariconnectbackend.service.DemandeRecuperationService;
//import com.example.gariconnectbackend.service.PaiementService;
//import com.example.gariconnectbackend.service.ReservationService;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.web.bind.annotation.*;
//
//        import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Map;
//import java.util.UUID;
//
//@RestController
//@RequestMapping("/api/paiements")
//@CrossOrigin("*")
//public class PaiementController {
//
//    @Autowired private PaiementService paiementService;
//    @Autowired private PaiementRepository paiementRepository;
//    @Autowired private UserRepository userRepository;
//    @Autowired private ReservationRepository reservationRepository;
//    @Autowired private CommissionDetteRepository commissionRepo;
//    @Autowired private NotificationRepository notificationRepository;
//    @Autowired private FinanceRepository financeRepository;
//    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;
//    @Autowired private DemandeRecuperationService demandeRecuperationService;
//    // NOUVEAU : Injection du service de réservation pour déclencher les notifications
//    @Autowired private ReservationService reservationService;
//
//    @PostMapping("/payer/{reservationId}")
//    public ResponseEntity<Paiement> payer(
//            @PathVariable Long reservationId,
//            @RequestParam String mode,
//            @RequestParam(required = false) String reference) {
//        Paiement p = paiementService.effectuerPaiement(reservationId, mode, reference);
//        return ResponseEntity.ok(p);
//    }
//
//    @PutMapping("/approuver/{paiementId}")
//    public ResponseEntity<Paiement> approuverPaiement(@PathVariable Long paiementId) {
//        Paiement p = paiementRepository.findById(paiementId)
//                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));
//        p.setStatut("CONFIRME_PAR_AGENCE");
//        return ResponseEntity.ok(paiementRepository.save(p));
//    }
//
//    @GetMapping
//
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCE')")
//    public List<Paiement> getTousLesPaiements() {
//        String email = SecurityContextHolder.getContext().getAuthentication().getName();
//        User agence = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
//        return paiementRepository.findByReservation_Trajet_Agence(agence);
//    }
//
//    @PatchMapping("/{id}/valider")
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCE')")
//    public ResponseEntity<?> validerPaiement(@PathVariable Long id) {
//        return paiementRepository.findById(id).map(paiement -> {
//            paiement.setStatut("SUCCES");
//            paiementRepository.save(paiement);
//            Reservation res = paiement.getReservation();
//
//            if (res != null && !"CONFIRMEE".equals(res.getStatut())) {
//                User agence = res.getTrajet().getAgence();
//                Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
//                Double montantComm = (res.getTrajet().getPrix() * taux) / 100;
//
//                // On met à jour les champs financiers et de ticket
//                res.setMontantCommission(montantComm);
//                if (res.getCodeTicket() == null) {
//                    res.setCodeTicket("GARI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
//                }
//                reservationRepository.save(res); // Sauvegarde préliminaire
//
//                // 🔥 CORRECTION : Appel du service pour déclencher le statut et la NOTIFICATION
//                reservationService.mettreAJourStatut(res.getId(), "CONFIRMEE");
//
//                CommissionDette cd = new CommissionDette();
//                cd.setAgence(agence);
//                cd.setReservation(res);
//                cd.setPaiement(paiement);
//                cd.setMontant(montantComm);
//                cd.setMontantDu(montantComm);
//                commissionRepo.save(cd);
//
//                FinanceTransaction transaction = new FinanceTransaction();
//                transaction.setDate(LocalDate.now());
//                transaction.setTypeTransaction("ENTREE");
//                transaction.setDescription("Paiement validé - Ticket : " + res.getCodeTicket());
//                transaction.setMontant(paiement.getMontant());
//                transaction.setDevise("CDF");
//                transaction.setEntite(res.getClient() != null ? res.getClient().getNom() + " " + res.getClient().getPrenom() : "Client");
//                financeRepository.save(transaction);
//            }
//            return ResponseEntity.ok(Map.of(
//                    "message", "Paiement encaissé et ticket validé",
//                    "ticket", res != null ? res.getCodeTicket() : "N/A"
//            ));
//        }).orElse(ResponseEntity.notFound().build());
//    }
//
//    @PostMapping("/{id}/encaisser")
//    @PreAuthorize("hasAnyRole('AGENCY_MANAGER', 'SUPER_ADMIN'")
//    public ResponseEntity<?> encaisserPaiement(
//            @PathVariable Long id,
//            @RequestBody(required = false) Map<String, Object> payload) {
//
//        try {
//            Paiement paiement = paiementRepository.findById(id)
//                    .orElseGet(() -> paiementRepository.findByReservationId(id).orElse(null));
//
//            Reservation res;
//
//            if (paiement == null) {
//                res = reservationRepository.findById(id)
//                        .orElseThrow(() -> new RuntimeException("Réservation n°" + id + " introuvable"));
//
//                paiement = new Paiement();
//                paiement.setReservation(res);
//                paiement.setStatut("EN_ATTENTE");
//            } else {
//                res = paiement.getReservation();
//            }
//
//            User agence = res.getTrajet().getAgence();
//
//            Double montantSaisi = res.getTrajet().getPrix();
//            if (payload != null && payload.containsKey("montant") && payload.get("montant") != null) {
//                montantSaisi = Double.valueOf(payload.get("montant").toString());
//            }
//
//            paiement.setStatut("VALIDE");
//            paiement.setMontant(montantSaisi);
//            paiement.setModePaiement("CASH");
//            paiement.setDatePaiement(LocalDateTime.now());
//            paiement = paiementRepository.save(paiement);
//
//            // Mise à jour des informations de réservation (SANS le statut)
//            res.setMontantPaye(montantSaisi);
//            res.setModePaiement("CASH");
//
//            Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
//            Double montantComm = (montantSaisi * taux) / 100;
//            res.setMontantCommission(montantComm);
//
//            if (res.getCodeTicket() == null) {
//                res.setCodeTicket("GARI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
//            }
//            reservationRepository.save(res); // Sauvegarde des modifications
//
//            // 🔥 CORRECTION : Appel du service pour valider le statut et NOTIFIER le client
//            reservationService.mettreAJourStatut(res.getId(), "CONFIRMEE");
//
//            CommissionDette cd = new CommissionDette();
//            cd.setAgence(agence);
//            cd.setReservation(res);
//            cd.setPaiement(paiement);
//            cd.setMontant(montantComm);
//            cd.setMontantDu(montantComm);
//            commissionRepo.save(cd);
//
//            FinanceTransaction transaction = new FinanceTransaction();
//            transaction.setDate(LocalDate.now());
//            transaction.setTypeTransaction("ENTREE");
//            transaction.setDescription("Encaissement Cash - Ticket : " + res.getCodeTicket());
//            transaction.setMontant(montantSaisi);
//            transaction.setDevise("CDF");
//            transaction.setAgence(agence);
//
//            String nomClient = "Client";
//            if (res.getClient() != null) {
//                nomClient = res.getClient().getNom() + (res.getClient().getPrenom() != null ? " " + res.getClient().getPrenom() : "");
//            }
//            transaction.setEntite(nomClient);
//            financeRepository.save(transaction);
//
//            return ResponseEntity.ok(Map.of(
//                    "message", "Paiement encaissé avec succès",
//                    "ticketCode", res.getCodeTicket(),
//                    "montant", montantSaisi
//            ));
//
//        } catch (Exception e) {
//            System.err.println("Erreur encaissement : " + e.getMessage());
//            return ResponseEntity.badRequest().body(Map.of("message", "Erreur : " + e.getMessage()));
//        }
//    }
//
//    @PostMapping("/encaisser/{reservationId}")
//    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER')")
//    public ResponseEntity<?> encaisserPaiementCash(@PathVariable Long reservationId, @RequestBody Map<String, Double> payload) {
//        try {
//            Double montantSaisi = payload.get("montant");
//            Reservation res = reservationRepository.findById(reservationId)
//                    .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
//
//            User agence = res.getTrajet().getAgence();
//
//            // 1. Validation du paiement
//            Paiement paiement = new Paiement();
//            paiement.setReservation(res);
//            paiement.setMontant(montantSaisi);
//            paiement.setModePaiement("CASH");
//            paiement.setStatut("VALIDE");
//            paiement.setReferenceTransaction("CASH-" + UUID.randomUUID().toString().substring(0,6).toUpperCase());
//            paiement.setDatePaiement(LocalDateTime.now());
//            paiementRepository.save(paiement);
//
//            res.setStatut("VALIDE");
//            res.setModePaiement("CASH");
//            res.setReferencePaiement(paiement.getReferenceTransaction());
//            reservationRepository.save(res);
//
//            // 2. Gestion des commissions d'agence
//            Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
//            Double montantComm = (montantSaisi * taux) / 100;
//
//            CommissionDette cd = new CommissionDette();
//            cd.setAgence(agence);
//            cd.setReservation(res);
//            cd.setPaiement(paiement);
//            cd.setMontant(montantComm);
//            cd.setMontantDu(montantComm);
//            commissionRepo.save(cd);
//
//            // 3. ENTRÉE AUTOMATIQUE : Argent reçu du client
//            FinanceTransaction transactionEntree = new FinanceTransaction();
//            transactionEntree.setDate(LocalDate.now());
//            transactionEntree.setTypeTransaction("ENTREE");
//            transactionEntree.setDescription("Paiement Billet - Ticket : " + res.getCodeTicket());
//            transactionEntree.setMontant(montantSaisi);
//            transactionEntree.setDevise("CDF");
//            transactionEntree.setAgence(agence);
//
//            String nomClient = res.getClient() != null ? res.getClient().getNom() : "Client Divers";
//            transactionEntree.setEntite(nomClient);
//            transactionEntree.setDocumentRef(res.getCodeTicket());
//            financeRepository.save(transactionEntree);
//
//            // 4. SORTIE AUTOMATIQUE : Commission prélevée par la plateforme
//            FinanceTransaction transactionSortie = new FinanceTransaction();
//            transactionSortie.setDate(LocalDate.now());
//            transactionSortie.setTypeTransaction("SORTIE");
//            transactionSortie.setDescription("Commission Plateforme (" + taux + "%) - Ticket : " + res.getCodeTicket());
//            transactionSortie.setMontant(montantComm);
//            transactionSortie.setDevise("CDF"); // Assurez-vous de la devise
//            transactionSortie.setAgence(agence);
//            transactionSortie.setEntite("GariConnect Platform");
//            transactionSortie.setDocumentRef(res.getCodeTicket());
//            financeRepository.save(transactionSortie);
//
//            // Validation automatique VIP (Si applicable)
//            demandeRecuperationRepository.findByReservationId(res.getId()).ifPresent(demande -> {
//                demandeRecuperationService.validerPaiementRecuperation(demande.getId());
//            });
//
//            return ResponseEntity.ok(Map.of(
//                    "message", "Paiement encaissé et transactions financières générées automatiquement.",
//                    "ticketCode", res.getCodeTicket()
//            ));
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("message", "Erreur : " + e.getMessage()));
//        }
//    }
//


package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import com.example.gariconnectbackend.service.DemandeRecuperationService;
import com.example.gariconnectbackend.service.PaiementService;
import com.example.gariconnectbackend.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

        import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;
    @Autowired private DemandeRecuperationService demandeRecuperationService;
    @Autowired private ReservationService reservationService;

    /**
     * 🔥 EXCLUSIF INTERFACE AGENT : Récupérer le calcul dynamique de la facture réelle (Billet + VIP)
     * Cela permet d'afficher les 19000 CDF au guichet de manière fiable !
     */
    @GetMapping("/details-facture/{reservationId}")
    @PreAuthorize("hasAnyRole('AGENCE', 'AGENCY_MANAGER', 'AGENCY_ADMIN')")
    public ResponseEntity<?> obtenirDetailsFacturePourAgent(@PathVariable Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        double prixBillet = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
                ? res.getMontantPaye()
                : (res.getTrajet() != null ? res.getTrajet().getPrix() : 0.0);

        double fraisVIP = 0.0;

        Optional<DemandeRecuperation> demandeOpt = demandeRecuperationRepository.findByReservationId(res.getId());
        if (demandeOpt.isPresent() && demandeOpt.get().getPrixSupplementaire() != null) {
            fraisVIP = demandeOpt.get().getPrixSupplementaire();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("reservationId", res.getId());
        response.put("codeTicket", res.getCodeTicket());
        response.put("prixBilletNormal", prixBillet);
        response.put("fraisRecuperationDomicile", fraisVIP);
        response.put("montantTotalAEncaisser", (prixBillet + fraisVIP)); // Envoie les 19000
        response.put("statutActuel", res.getStatut());

        return ResponseEntity.ok(response);
    }

    /**
     * 🔥 ACTION DIRECTE ENCAISSEMENT CASH AU GUICHET PAR L'AGENT
     */
    @PostMapping("/encaisser-guichet")
    @PreAuthorize("hasAnyRole('AGENCE', 'AGENCY_MANAGER', 'AGENCY_ADMIN')")
    public ResponseEntity<?> encaisserAuGuichet(@RequestBody Map<String, Object> payload) {
        try {
            Long reservationId = Long.valueOf(payload.get("reservationId").toString());
            String mode = payload.get("modePaiement") != null ? payload.get("modePaiement").toString() : "CASH";
            String referenceClient = payload.get("reference") != null ? payload.get("reference").toString() : "CASH-GUICHET";

            Paiement paiementEffectue = paiementService.effectuerPaiement(reservationId, mode, referenceClient);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture complète enregistrée avec succès !",
                    "montantEncaisse", paiementEffectue.getMontant(),
                    "statutReservation", "Paye"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * HISTORIQUE : Obtenir tous les paiements effectués
     */
    @GetMapping
    public ResponseEntity<List<Paiement>> getAllPaiements() {
        return ResponseEntity.ok(paiementRepository.findAll());
    }

    /**
     * ENCAISSEMENT STANDARD (ANCIENNE MÉTHODE MOBILE MONEY / PROCESS DISTANT)
     */
    @PostMapping("/encaisser")
    public ResponseEntity<?> encaisserPaiement(@RequestBody Map<String, Object> request) {
        try {
            Long reservationId = Long.valueOf(request.get("reservationId").toString());
            String reference = (String) request.get("reference");
            Double montantRecu = Double.valueOf(request.get("montant").toString());

            Reservation res = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

            // Sauvegarde du Paiement
            Paiement p = new Paiement();
            p.setReservation(res);
            p.setMontant(montantRecu);
            p.setModePaiement("MOBILE_MONEY");
            p.setStatut("SUCCES");
            p.setReferenceTransaction(reference != null ? reference : UUID.randomUUID().toString());
            p.setDatePaiement(LocalDateTime.now());
            paiementRepository.save(p);

            // Changement statut réservation
            res.setStatut("Paye");
            res.setMontantPaye(montantRecu);
            reservationRepository.save(res);

            // Traitement com & livre de caisse
            double taux = 10.0;
            double montantComm = (montantRecu * taux) / 100.0;

            User agence = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;
            if (agence != null) {
                FinanceTransaction transactionEntree = new FinanceTransaction();
                transactionEntree.setDate(LocalDate.now());
                transactionEntree.setTypeTransaction("ENTREE");
                transactionEntree.setDescription("Encaissement Mobile - Ticket : " + res.getCodeTicket());
                transactionEntree.setMontant(montantRecu);
                transactionEntree.setDevise("CDF");
                transactionEntree.setAgence(agence);
                transactionEntree.setEntite("Mobile Gateway");
                transactionEntree.setDocumentRef(res.getCodeTicket());
                financeRepository.save(transactionEntree);

                FinanceTransaction transactionSortie = new FinanceTransaction();
                transactionSortie.setDate(LocalDate.now());
                transactionSortie.setTypeTransaction("SORTIE");
                transactionSortie.setDescription("Commission Plateforme (" + taux + "%) - Ticket : " + res.getCodeTicket());
                transactionSortie.setMontant(montantComm);
                transactionSortie.setDevise("CDF");
                transactionSortie.setAgence(agence);
                transactionSortie.setEntite("GariConnect Platform");
                transactionSortie.setDocumentRef(res.getCodeTicket());
                financeRepository.save(transactionSortie);
            }

            // Validation automatique VIP (Si applicable)
            demandeRecuperationRepository.findByReservationId(res.getId()).ifPresent(demande -> {
                demandeRecuperationService.validerPaiementRecuperation(demande.getId());
            });

            return ResponseEntity.ok(Map.of(
                    "message", "Paiement encaissé et transactions financières générées automatiquement.",
                    "ticketCode", res.getCodeTicket()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }
}




