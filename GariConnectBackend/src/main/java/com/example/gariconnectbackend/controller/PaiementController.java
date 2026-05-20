package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Paiement;
import com.example.gariconnectbackend.repository.PaiementRepository;
import com.example.gariconnectbackend.service.PaiementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
/*
@RestController
@RequestMapping("/api/paiements")
public class PaiementController {
    @Autowired
    private PaiementService paiementService;

    @PostMapping("/payer/{reservationId}")
    public Paiement payer(@PathVariable Long reservationId, @RequestParam String mode) {
        return paiementService.effectuerPaiement(reservationId, mode);
    }

    @PutMapping("/approuver/{paiementId}")
    public Paiement approuverPaiementChauffeur(@PathVariable Long paiementId) {
        Paiement p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));

        p.setStatut("CONFIRME_PAR_AGENCE");
        return paiementRepository.save(p);
    }
}*/

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    @Autowired
    private PaiementService paiementService;

    // AJOUTE CETTE LIGNE ICI :
    @Autowired
    private PaiementRepository paiementRepository;

    @PostMapping("/payer/{reservationId}")
    public Paiement payer(@PathVariable Long reservationId, @RequestParam String mode) {
        return paiementService.effectuerPaiement(reservationId, mode);
    }

    @PutMapping("/approuver/{paiementId}")
    public Paiement approuverPaiementChauffeur(@PathVariable Long paiementId) {
        // Maintenant paiementRepository sera reconnu ici
        Paiement p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));

        p.setStatut("CONFIRME_PAR_AGENCE");
        return paiementRepository.save(p);
    }
}