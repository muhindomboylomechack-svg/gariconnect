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

   // @Transactional
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
//        // 2. 🟢 INTERCEPTION & CALCUL DU MONTANT COMPLET (Billet normal + VIP)
//        Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
//                ? res.getMontantPaye()
//                : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? res.getTrajet().getPrix() : 0.0);
//
//        Double montantTotal = prixBilletNormal;
//
//        // Ajouter les frais de récupération à domicile s'ils existent
//        Optional<DemandeRecuperation> optDemande = demandeRecuperationRepository.findByReservationId(res.getId());
//        if (optDemande.isPresent()) {
//            DemandeRecuperation demande = optDemande.get();
//            if (demande.getPrixSupplementaire() != null) {
//                montantTotal += demande.getPrixSupplementaire();
//                System.out.println("🚐 [SUPPLÉMENT VIP] Frais de récupération ajoutés au paiement : " + demande.getPrixSupplementaire() + " CDF/USD");
//
//                // Mettre à jour immédiatement la demande VIP au statut PAYE
//                demande.setStatut(StatutRecuperation.PAYE);
//                demandeRecuperationRepository.save(demande);
//            }
//        }
//
//        // Assigner le montant total (Billet + VIP) au paiement et à la réservation
//        p.setMontant(montantTotal);
//        res.setMontantPaye(montantTotal); // Indique combien a été payé en tout
//        String nouveauStatutReservation = "PAYE";
//
//        // =========================================================================
//        // 3. 💰 AUTOMATISATION FINANCIÈRE : Écriture dans le Livre de Caisse
//        // =========================================================================
//        User agence = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;
//        if (agence != null) {
//            String codeTicket = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
//            String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";
//
//            // A. ENTRÉE DE CAISSE GLOBALE (Argent total reçu : Billet + VIP)
//            FinanceTransaction transactionEntree = new FinanceTransaction();
//            transactionEntree.setDate(LocalDate.now());
//            transactionEntree.setTypeTransaction("ENTREE");
//            transactionEntree.setDescription("Encaissement " + mode + " - Ticket : " + codeTicket);
//            transactionEntree.setMontant(montantTotal); // L'agence reçoit l'intégralité
//            transactionEntree.setDevise("CDF");
//            transactionEntree.setAgence(agence);
//            transactionEntree.setEntite("Guichet Agence - " + nomClient);
//            transactionEntree.setDocumentRef(codeTicket);
//            financeRepository.save(transactionEntree);
//
//            // B. DÉBIT DE LA COMMISSION DE LA PLATEFORME (Calculé uniquement sur le billet de base)
//            if (prixBilletNormal > 0) {
//                Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
//                Double montantComm = (prixBilletNormal * taux) / 100.0;
//
//                FinanceTransaction transactionSortie = new FinanceTransaction();
//                transactionSortie.setDate(LocalDate.now());
//                transactionSortie.setTypeTransaction("SORTIE");
//                transactionSortie.setDescription("Commission Plateforme (" + taux + "%) - Ticket : " + codeTicket);
//                transactionSortie.setMontant(montantComm); // La plateforme prélève 10% du billet normal
//                transactionSortie.setDevise("CDF");
//                transactionSortie.setAgence(agence);
//                transactionSortie.setEntite("GariConnect Platform");
//                transactionSortie.setDocumentRef(codeTicket);
//                financeRepository.save(transactionSortie);
//
//                // C. Enregistrement de la dette dans la table des commissions
//                CommissionDette cd = new CommissionDette();
//                cd.setAgence(agence);
//                cd.setReservation(res);
//                cd.setPaiement(p);
//                cd.setMontant(montantComm);
//                cd.setMontantDu(montantComm);
//                commissionDetteRepository.save(cd);
//            }
//        }
//        // =========================================================================
//
//        // 4. Sauvegardes et bascule de l'état
//        Paiement savedPaiement = paiementRepository.save(p);
//        res.setStatut(nouveauStatutReservation);
//        reservationRepository.save(res);
//
//        // 5. Notification et synchronisation globale
//        try {
//            reservationService.mettreAJourStatut(res.getId(), nouveauStatutReservation);
//        } catch (Exception e) {
//            System.err.println("⚠️ Erreur lors de la mise à jour du statut global : " + e.getMessage());
//        }
//
//        return savedPaiement;
//    }
   @Transactional
   public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
       // 1. Récupération de la réservation
       Reservation res = reservationRepository.findById(reservationId)
               .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

       System.out.println("🚨 [SERVEUR PAIEMENT] Traitement paiement " + mode + " pour Réservation N°: " + reservationId);

       Paiement p = new Paiement();
       p.setReservation(res);
       p.setModePaiement(mode);
       p.setReferenceTransaction(referenceClient);
       p.setDatePaiement(LocalDateTime.now());
       p.setStatut("SUCCES");

       // 2. 🟢 INTERCEPTION & CALCUL DU MONTANT COMPLET (Billet normal + VIP)
       Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
               ? res.getMontantPaye()
               : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? res.getTrajet().getPrix() : 0.0);

       Double montantTotal = prixBilletNormal;

       // Ajouter les frais de récupération à domicile s'ils existent
       Optional<DemandeRecuperation> optDemande = demandeRecuperationRepository.findByReservationId(res.getId());
       if (optDemande.isPresent()) {
           DemandeRecuperation demande = optDemande.get();
           if (demande.getPrixSupplementaire() != null) {
               montantTotal += demande.getPrixSupplementaire();
               System.out.println("🚐 [SUPPLÉMENT VIP] Frais ajoutés au paiement : " + demande.getPrixSupplementaire());

               demande.setStatut(StatutRecuperation.PAYE);
               demandeRecuperationRepository.save(demande);
           }
       }

       p.setMontant(montantTotal);
       res.setMontantPaye(montantTotal);
       String nouveauStatutReservation = "PAYE";

       // =========================================================================
       // 3. 💰 AUTOMATISATION FINANCIÈRE : Écriture dans le Livre de Caisse
       // =========================================================================
       User agence = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;
       if (agence != null) {
           String codeTicket = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
           String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";

           // A. ENTRÉE DE CAISSE GLOBALE
           FinanceTransaction transactionEntree = new FinanceTransaction();
           transactionEntree.setDate(LocalDate.now());
           transactionEntree.setTypeTransaction("ENTREE");
           transactionEntree.setDescription("Encaissement " + mode + " - Ticket : " + codeTicket);
           transactionEntree.setMontant(montantTotal);
           transactionEntree.setDevise("CDF");
           transactionEntree.setAgence(agence);
           transactionEntree.setEntite("Guichet Agence - " + nomClient);
           transactionEntree.setDocumentRef(codeTicket);
           financeRepository.save(transactionEntree);

           // B. DÉBIT DE LA COMMISSION DE LA PLATEFORME (LOGIQUE SAAS)
           if (prixBilletNormal > 0) {
               boolean isAbonnementDefinitif = "DEFINITIF".equalsIgnoreCase(agence.getTypeAbonnement());

               if (!isAbonnementDefinitif) {
                   Double taux = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;
                   Double montantComm = (prixBilletNormal * taux) / 100.0;

                   FinanceTransaction transactionSortie = new FinanceTransaction();
                   transactionSortie.setDate(LocalDate.now());
                   transactionSortie.setTypeTransaction("SORTIE");
                   transactionSortie.setDescription("Commission Plateforme (" + taux + "%) - Ticket : " + codeTicket);
                   transactionSortie.setMontant(montantComm);
                   transactionSortie.setDevise("CDF");
                   transactionSortie.setAgence(agence);
                   transactionSortie.setEntite("GariConnect Platform");
                   transactionSortie.setDocumentRef(codeTicket);
                   financeRepository.save(transactionSortie);

                   CommissionDette cd = new CommissionDette();
                   cd.setAgence(agence);
                   cd.setReservation(res);
                   cd.setPaiement(p);
                   cd.setMontant(montantComm);
                   cd.setMontantDu(montantComm);
                   commissionDetteRepository.save(cd);
               } else {
                   System.out.println("✅ [SaaS] L'agence " + agence.getNom() + " est exemptée de commission (Abonnement DEFINITIF).");
               }
           }
       }
       // =========================================================================

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