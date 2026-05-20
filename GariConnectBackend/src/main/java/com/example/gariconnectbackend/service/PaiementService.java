package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Paiement;
import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.repository.PaiementRepository;
import com.example.gariconnectbackend.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PaiementService {

    @Autowired
    private PaiementRepository paiementRepository; // Enlève l'erreur ligne 23 et 40

    @Autowired
    private ReservationRepository reservationRepository; // Enlève l'erreur ligne 20 et 39

    public Paiement effectuerPaiement(Long reservationId, String mode) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        Paiement p = new Paiement();
        p.setReservation(res);
        p.setMontant(res.getTrajet().getPrix());
        p.setModePaiement(mode); // "AIRTEL_MONEY", "GUICHET", ou "CHAUFFEUR"
        p.setDatePaiement(LocalDateTime.now());

        if (mode.equals("AIRTEL_MONEY") || mode.equals("M-PESA")) {
            p.setStatut("SUCCES");
            p.setReferenceTransaction("MOBILE-" + System.currentTimeMillis());
            res.setStatut("PAYEE_MOBILE");
        } else if (mode.equals("GUICHET")) {
            p.setStatut("VALIDE_AGENCE");
            p.setReferenceTransaction("CASH-AGENCE-" + res.getId());
            res.setStatut("PAYEE_CASH");
        } else if (mode.equals("CHAUFFEUR")) {
            p.setStatut("VALIDE_CHAUFFEUR");
            p.setReferenceTransaction("CASH-CHAUFFEUR-" + res.getId());
            res.setStatut("PAYEE_CHAUFFEUR");
        }

        reservationRepository.save(res);
        return paiementRepository.save(p);
    }
}