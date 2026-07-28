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
//    @Transactional
//    public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
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
//        Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
//                ? res.getMontantPaye()
//                : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? res.getTrajet().getPrix() : 0.0);
//
//        Double montantTotal = prixBilletNormal;
//        boolean estReservationVIP = false;
//
//        Optional<DemandeRecuperation> optDemande = demandeRecuperationRepository.findByReservationId(res.getId());
//        if (optDemande.isPresent()) {
//            DemandeRecuperation demande = optDemande.get();
//            if (demande.getPrixSupplementaire() != null) {
//                montantTotal += demande.getPrixSupplementaire();
//                estReservationVIP = true;
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
//        User agenceCible = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;
//
//        if (agenceCible != null) {
//            if (agenceCible.getRole() == Role.AGENCY_MANAGER && agenceCible.getAgenceEmployeur() != null) {
//                agenceCible = agenceCible.getAgenceEmployeur();
//            }
//
//            String codeTicket = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
//            String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";
//
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
//            boolean isAbonnementDefinitif = "DEFINITIF".equalsIgnoreCase(agenceCible.getTypeAbonnement());
//
//            if (!isAbonnementDefinitif) {
//                Double baseCalculCommission = estReservationVIP ? montantTotal : prixBilletNormal;
//
//                if (baseCalculCommission > 0) {
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
//                    CommissionDette cd = new CommissionDette();
//                    cd.setAgence(agenceCible);
//                    cd.setReservation(res);
//                    cd.setPaiement(p);
//                    cd.setLibelle("Commission Billet " + (estReservationVIP ? "VIP" : "Standard") + " - " + codeTicket);
//                    cd.setMontant(baseCalculCommission);
//                    cd.setMontantCommission(montantComm);
//                    cd.setMontantDu(montantComm);
//                    cd.setDateCreation(LocalDateTime.now());
//                    cd.setDateCalcul(LocalDate.now());
//                    commissionDetteRepository.save(cd);
//                }
//            } else {
//                System.out.println("✅ [SaaS Billet] L'agence " + agenceCible.getNom() + " est exemptée de commission (Abonnement DEFINITIF).");
//            }
//        }
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
import java.util.UUID;

@Service
public class PaiementService {

    @Autowired private PaiementRepository paiementRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private CommissionDetteRepository commissionDetteRepository;
    @Autowired private ReservationService reservationService;
    @Autowired private FinanceRepository financeRepository;
    @Autowired private DemandeRecuperationRepository demandeRecuperationRepository;
    @Autowired private TicketRepository ticketRepository; // Injecté pour gérer la table tickets

    @Transactional
    public Paiement effectuerPaiement(Long reservationId, String mode, String referenceClient) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        System.out.println("🚨 [SERVEUR PAIEMENT] Traitement paiement " + mode + " pour Réservation N°: " + reservationId);

        // 1. Initialisation du Paiement
        Paiement p = new Paiement();
        p.setReservation(res);
        p.setModePaiement(mode);
        p.setReferenceTransaction(referenceClient);
        p.setDatePaiement(LocalDateTime.now());
        p.setStatut("SUCCES");

        // 2. Calcul des montants
        int nombreDePlaces = (res.getNombrePlaces() != null && res.getNombrePlaces() > 0) ? res.getNombrePlaces() : 1;

        Double prixBilletNormal = (res.getMontantPaye() != null && res.getMontantPaye() > 0)
                ? res.getMontantPaye()
                : (res.getTrajet() != null && res.getTrajet().getPrix() != null ? (res.getTrajet().getPrix() * nombreDePlaces) : 0.0);

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

        // 3. Traitement Financier (Transactions et Commissions)
        User agenceCible = (res.getTrajet() != null) ? res.getTrajet().getAgence() : null;

        if (agenceCible != null) {
            if (agenceCible.getRole() == Role.AGENCY_MANAGER && agenceCible.getAgenceEmployeur() != null) {
                agenceCible = agenceCible.getAgenceEmployeur();
            }

            String codeTicketGeneral = (res.getCodeTicket() != null) ? res.getCodeTicket() : "TK-" + res.getId();
            String nomClient = (res.getClient() != null) ? res.getClient().getNom() : "Client Divers";

            FinanceTransaction transactionEntree = new FinanceTransaction();
            transactionEntree.setDate(LocalDate.now());
            transactionEntree.setTypeTransaction("ENTREE");
            transactionEntree.setDescription("Encaissement " + mode + " - Ticket : " + codeTicketGeneral);
            transactionEntree.setMontant(montantTotal);
            transactionEntree.setDevise("CDF");
            transactionEntree.setAgence(agenceCible);
            transactionEntree.setEntite("Guichet Agence - " + nomClient);
            transactionEntree.setDocumentRef(codeTicketGeneral);
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
                    transactionSortie.setDescription("Commission Plateforme (" + taux + "%) [" + (estReservationVIP ? "VIP" : "STANDARD") + "] - Ticket : " + codeTicketGeneral);
                    transactionSortie.setMontant(montantComm);
                    transactionSortie.setDevise("CDF");
                    transactionSortie.setAgence(agenceCible);
                    transactionSortie.setEntite("GariConnect Platform");
                    transactionSortie.setDocumentRef(codeTicketGeneral);
                    financeRepository.save(transactionSortie);

                    CommissionDette cd = new CommissionDette();
                    cd.setAgence(agenceCible);
                    cd.setReservation(res);
                    cd.setPaiement(p);
                    cd.setLibelle("Commission Billet " + (estReservationVIP ? "VIP" : "Standard") + " - " + codeTicketGeneral);
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

        // 🎟️ 4. CRÉATION AUTOMATIQUE DES TICKETS INDIVIDUELS SCANNABLES
        // Générer autant de tickets que de places réservées par le client
        Long userId = res.getClient() != null ? res.getClient().getId() : 0L;

        for (int i = 0; i < nombreDePlaces; i++) {
            Ticket ticket = new Ticket();
            ticket.setReservation(res);
            ticket.setUser(res.getClient());

            // Code unique pour ce ticket spécifique
            String codeUnique = "TCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            ticket.setCodeTicket(codeUnique);

            // 📷 JSON PAYLOAD POUR LE SCANNER (Garantit une lecture facile côté Frontend)
            String payloadQrCode = String.format(
                    "{\"ticketCode\":\"%s\",\"reservationId\":%d,\"userId\":%d,\"placesAchetées\":%d,\"statut\":\"VALIDE\"}",
                    codeUnique, res.getId(), userId, nombreDePlaces
            );
            ticket.setQrCodeData(payloadQrCode);

            ticketRepository.save(ticket);
        }

        // 5. Mise à jour globale et notifications
        try {
            reservationService.mettreAJourStatut(res.getId(), nouveauStatutReservation);
        } catch (Exception e) {
            System.err.println("⚠️ Erreur lors de la mise à jour du statut global : " + e.getMessage());
        }

        return savedPaiement;
    }
}