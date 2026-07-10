//package com.example.gariconnectbackend.service;
//
//import com.example.gariconnectbackend.model.*;
//import com.example.gariconnectbackend.repository.*;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.Optional;
//
//@Service
//public class PaiementService {
//
//    @Autowired private PaiementRepository paiementRepository;
//    @Autowired private ReservationRepository reservationRepository;
//    @Autowired private CommissionDetteRepository commissionDetteRepository;
//    @Autowired private ReservationService reservationService;
//    @Autowired private FinanceRepository financeRepository;
//    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;
//
//
//    @Transactional
//    public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
//        // 1. Récupération de la réservation
//        Reservation res = reservationRepository.findById(reservationId)
//                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));
//
//        System.out.println("🚨 [SERVEUR PAIEMENT] Traitement paiement " + mode + " pour Réservation N°: " + reservationId);
//
//        Paiement p = new Paiement();
//        p.setReservation(res);
//        p.setModePaiement(mode);
//        p.setReferenceTransaction(referenceClient);
//        p.setDatePaiement(LocalDateTime.now());
//        p.setStatut("SUCCES");
//
//        // 2. 🟢 Récupération du prix de base du billet normal
//        Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
//                ? res.getMontantPaye()
//                : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? res.getTrajet().getPrix() : 0.0);
//
//        Double montantTotal = prixBilletNormal;
//        boolean estReservationVIP = false;
//
//        // Vérification de la présence d'une demande de récupération à domicile (Service VIP)
//        Optional<DemandeRecuperation> optDemande = demandeRecuperationRepository.findByReservationId(res.getId());
//        if (optDemande.isPresent()) {
//            DemandeRecuperation demande = optDemande.get();
//            if (demande.getPrixSupplementaire() != null) {
//                montantTotal += demande.getPrixSupplementaire();
//                estReservationVIP = true; // Marqué comme VIP car il y a un supplément de récupération à domicile
//                System.out.println("🚐 [SUPPLÉMENT VIP] Frais ajoutés au paiement : " + demande.getPrixSupplementaire());
//
//                demande.setStatut(StatutRecuperation.PAYE);
//                demandeRecuperationRepository.save(demande);
//            }
//        }
//
//        p.setMontant(montantTotal);
//        res.setMontantPaye(montantTotal);
//        String nouveauStatutReservation = "PAYE";
//
//        // =========================================================================
//        // 3. 💰 AUTOMATISATION FINANCIÈRE : Écriture dans le Livre de Caisse & Commissions
//        // =========================================================================
//        User agenceCible = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;
//
//        if (agenceCible != null) {
//            // 🔥 REMONTÉE VERS L'AGENCY_ADMIN : Si l'agence liée est un MANAGER ou un agent, on prélève son employeur principal
//            if (agenceCible.getRole() == Role.AGENCY_MANAGER && agenceCible.getAgenceEmployeur() != null) {
//                agenceCible = agenceCible.getAgenceEmployeur();
//            }
//
//            String codeTicket = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
//            String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";
//
//            // A. ENTRÉE DE CAISSE GLOBALE
//            FinanceTransaction transactionEntree = new FinanceTransaction();
//            transactionEntree.setDate(LocalDate.now());
//            transactionEntree.setTypeTransaction("ENTREE");
//            transactionEntree.setDescription("Encaissement " + mode + " - Ticket : " + codeTicket);
//            transactionEntree.setMontant(montantTotal);
//            transactionEntree.setDevise("CDF");
//            transactionEntree.setAgence(agenceCible);
//            transactionEntree.setEntite("Guichet Agence - " + nomClient);
//            transactionEntree.setDocumentRef(codeTicket);
//            financeRepository.save(transactionEntree);
//
//            // B. DÉBIT DE LA COMMISSION DE LA PLATEFORME SELON LE TYPE D'ABONNEMENT
//            boolean isAbonnementDefinitif = "DEFINITIF".equalsIgnoreCase(agenceCible.getTypeAbonnement());
//
//            if (!isAbonnementDefinitif) {
//                // 🎯 Choix de la base de calcul selon vos orientations :
//                // - Si VIP (avec récupération à domicile) : commission prélevée sur montantTotal (Billet + Supplément)
//                // - Si Standard : commission prélevée uniquement sur prixBilletNormal
//                Double baseCalculCommission = estReservationVIP ? montantTotal : prixBilletNormal;
//
//                if (baseCalculCommission > 0) {
//                    // Récupération du pourcentage spécifique de l'agence (par défaut 10% si non défini)
//                    Double taux = (agenceCible.getTauxCommission() != null) ? agenceCible.getTauxCommission() : 10.0;
//                    Double montantComm = (baseCalculCommission * taux) / 100.0;
//
//                    FinanceTransaction transactionSortie = new FinanceTransaction();
//                    transactionSortie.setDate(LocalDate.now());
//                    transactionSortie.setTypeTransaction("SORTIE");
//                    transactionSortie.setDescription("Commission Plateforme (" + taux + "%) [" + (estReservationVIP ? "VIP" : "STANDARD") + "] - Ticket : " + codeTicket);
//                    transactionSortie.setMontant(montantComm);
//                    transactionSortie.setDevise("CDF");
//                    transactionSortie.setAgence(agenceCible);
//                    transactionSortie.setEntite("GariConnect Platform");
//                    transactionSortie.setDocumentRef(codeTicket);
//                    financeRepository.save(transactionSortie);
//
//                    // Création et enregistrement de la dette de commission
//                    CommissionDette cd = new CommissionDette();
//                    cd.setAgence(agenceCible);
//                    cd.setReservation(res);
//                    cd.setPaiement(p);
//                    cd.setLibelle("Commission Billet " + (estReservationVIP ? "VIP" : "Standard") + " - " + codeTicket);
//                    cd.setMontant(baseCalculCommission); // Enregistre la base brute qui a servi au calcul
//                    cd.setMontantCommission(montantComm); // Montant calculé de la commission
//                    cd.setMontantDu(montantComm);
//                    cd.setDateCreation(LocalDateTime.now());
//                    cd.setDateCalcul(LocalDate.now());
//                    commissionDetteRepository.save(cd);
//                }
//            } else {
//                System.out.println("✅ [SaaS Billet] L'agence " + agenceCible.getNom() + " est exemptée de commission (Abonnement DEFINITIF).");
//            }
//        }
//        // =========================================================================
//
//        Paiement savedPaiement = paiementRepository.save(p);
//        res.setStatut(nouveauStatutReservation);
//        reservationRepository.save(res);
//
//        try {
//            reservationService.mettreAJourStatut(res.getId(), nouveauStatutReservation);
//        } catch (Exception e) {
//            System.err.println("⚠️ Erreur lors de la mise à jour du statut global : " + e.getMessage());
//        }
//
//        return savedPaiement;
//    }
//}

package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PaiementService {

    @Autowired private PaiementRepository paiementRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private CommissionDetteRepository commissionDetteRepository;
    @Autowired private ReservationService reservationService;
    @Autowired private FinanceRepository financeRepository;
    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;

    @Transactional
    public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        System.out.println("🚨 [SERVEUR PAIEMENT] Traitement paiement " + mode + " pour Réservation N°: " + reservationId);

        Paiement p = new Paiement();
        p.setReservation(res);
        p.setModePaiement(mode);
        p.setReferenceTransaction(referenceClient);
        p.setDatePaiement(LocalDateTime.now());
        p.setStatut("SUCCES");

        Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
                ? res.getMontantPaye()
                : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? res.getTrajet().getPrix() : 0.0);

        Double montantTotal = prixBilletNormal;
        boolean estReservationVIP = false;

        Optional<DemandeRecuperation> optDemande = demandeRecuperationRepository.findByReservationId(res.getId());
        if (optDemande.isPresent()) {
            DemandeRecuperation demande = optDemande.get();
            if (demande.getPrixSupplementaire() != null) {
                montantTotal += demande.getPrixSupplementaire();
                estReservationVIP = true;
                System.out.println("🚐 [SUPPLÉMENT VIP] Frais ajoutés au paiement : " + demande.getPrixSupplementaire());

                demande.setStatut(StatutRecuperation.PAYE);
                demandeRecuperationRepository.save(demande);
            }
        }

        p.setMontant(montantTotal);
        res.setMontantPaye(montantTotal);
        String nouveauStatutReservation = "PAYE";

        User agenceCible = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;

        if (agenceCible != null) {
            if (agenceCible.getRole() == Role.AGENCY_MANAGER && agenceCible.getAgenceEmployeur() != null) {
                agenceCible = agenceCible.getAgenceEmployeur();
            }

            String codeTicket = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
            String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";

            FinanceTransaction transactionEntree = new FinanceTransaction();
            transactionEntree.setDate(LocalDate.now());
            transactionEntree.setTypeTransaction("ENTREE");
            transactionEntree.setDescription("Encaissement " + mode + " - Ticket : " + codeTicket);
            transactionEntree.setMontant(montantTotal);
            transactionEntree.setDevise("CDF");
            transactionEntree.setAgence(agenceCible);
            transactionEntree.setEntite("Guichet Agence - " + nomClient);
            transactionEntree.setDocumentRef(codeTicket);
            financeRepository.save(transactionEntree);

            boolean isAbonnementDefinitif = "DEFINITIF".equalsIgnoreCase(agenceCible.getTypeAbonnement());

            if (!isAbonnementDefinitif) {
                Double baseCalculCommission = estReservationVIP ? montantTotal : prixBilletNormal;

                if (baseCalculCommission > 0) {
                    Double taux = (agenceCible.getTauxCommission() != null) ? agenceCible.getTauxCommission() : 10.0;
                    Double montantComm = (baseCalculCommission * taux) / 100.0;

                    FinanceTransaction transactionSortie = new FinanceTransaction();
                    transactionSortie.setDate(LocalDate.now());
                    transactionSortie.setTypeTransaction("SORTIE");
                    transactionSortie.setDescription("Commission Plateforme (" + taux + "%) [" + (estReservationVIP ? "VIP" : "STANDARD") + "] - Ticket : " + codeTicket);
                    transactionSortie.setMontant(montantComm);
                    transactionSortie.setDevise("CDF");
                    transactionSortie.setAgence(agenceCible);
                    transactionSortie.setEntite("GariConnect Platform");
                    transactionSortie.setDocumentRef(codeTicket);
                    financeRepository.save(transactionSortie);

                    CommissionDette cd = new CommissionDette();
                    cd.setAgence(agenceCible);
                    cd.setReservation(res);
                    cd.setPaiement(p);
                    cd.setLibelle("Commission Billet " + (estReservationVIP ? "VIP" : "Standard") + " - " + codeTicket);
                    cd.setMontant(baseCalculCommission);
                    cd.setMontantCommission(montantComm);
                    cd.setMontantDu(montantComm);
                    cd.setDateCreation(LocalDateTime.now());
                    cd.setDateCalcul(LocalDate.now());
                    commissionDetteRepository.save(cd);
                }
            } else {
                System.out.println("✅ [SaaS Billet] L'agence " + agenceCible.getNom() + " est exemptée de commission (Abonnement DEFINITIF).");
            }
        }

        Paiement savedPaiement = paiementRepository.save(p);
        res.setStatut(nouveauStatutReservation);
        reservationRepository.save(res);

        try {
            reservationService.mettreAJourStatut(res.getId(), nouveauStatutReservation);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur lors de la mise à jour du statut global : " + e.getMessage());
        }

        return savedPaiement;
    }
}