package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class PaiementService {

    @Autowired private PaiementRepository paiementRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private CommissionDetteRepository commissionDetteRepository;

    // NOUVEAU : Injection du service de réservation
    @Autowired private ReservationService reservationService;

    @Transactional
    public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        User agence = res.getTrajet().getAgence();

        Paiement p = new Paiement();
        p.setReservation(res);
        p.setMontant(res.getTrajet().getPrix());
        p.setModePaiement(mode);
        p.setDatePaiement(LocalDateTime.now());

        String nouveauStatutReservation;

        if ("CASH".equals(mode)) {
            p.setStatut("EN_ATTENTE_CAISSE");
            p.setReferenceTransaction("CASH-PENDING");

            res.setModePaiement("CASH");
            res.setReferencePaiement("A_PAYER_A_L_AGENCE");
            nouveauStatutReservation = "ATTENTE_PAIEMENT";
        }
        else {
            p.setStatut("VERIFICATION_MOBILE");
            p.setReferenceTransaction(referenceClient);

            res.setModePaiement(mode);
            res.setReferencePaiement(referenceClient);
            nouveauStatutReservation = "PAYEE_MOBILE";
        }

        // Sauvegarde d'abord les nouveaux attributs
        reservationRepository.save(res);
        Paiement savedPaiement = paiementRepository.save(p);

        // 🔥 CORRECTION : Met à jour le statut et déclenche la notification au client !
        reservationService.mettreAJourStatut(res.getId(), nouveauStatutReservation);

        return savedPaiement;
    }

    public void genererCommissionDette(Paiement p, User agence) {
        Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
        Double montantComm = (p.getMontant() * taux) / 100;

        CommissionDette dette = new CommissionDette();
        dette.setAgence(agence);
        dette.setPaiement(p);
        dette.setMontant(montantComm);
        dette.setStatut("NON_PAYEE");
        dette.setDateGeneration(LocalDateTime.now());

        commissionDetteRepository.save(dette);
    }
}