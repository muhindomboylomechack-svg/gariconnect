package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.LivreDeCaisseRow;
import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.FinanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceService {

    @Autowired
    private FinanceRepository financeRepository;

    public FinanceTransaction createTransaction(FinanceTransaction transaction) {
        return financeRepository.save(transaction);
    }


    /**
     * Génère le livre de caisse global pour le SUPER_ADMIN (Toutes les transactions).
     */
    public List<LivreDeCaisseRow> generateLivreDeCaisseGlobal() {
        List<FinanceTransaction> transactions = financeRepository.findAllByOrderByDateAsc();
        return processTransactionsToRows(transactions);
    }

    /**
     * Méthode générique et sécurisée pour transformer les entités de transaction en lignes comptables.
     */
    private List<LivreDeCaisseRow> processTransactionsToRows(List<FinanceTransaction> transactions) {
        List<LivreDeCaisseRow> report = new ArrayList<>();

        if (transactions == null || transactions.isEmpty()) {
            System.out.println("⚠️ [FINANCE SERVICE] Aucune transaction trouvée dans la base de données pour cette sélection.");
            return report;
        }

        double cumulUSD = 0.0;
        double cumulCDF = 0.0;

        for (FinanceTransaction t : transactions) {
            LivreDeCaisseRow row = new LivreDeCaisseRow();
            row.setDate(t.getDate());
            row.setDescription(t.getDescription() != null ? t.getDescription() : "Sans description");
            row.setEntite(t.getEntite() != null ? t.getEntite() : "GariConnect");

            // Sécurisation de la devise (par défaut CDF si nul)
            String devise = t.getDevise() != null ? t.getDevise().toUpperCase() : "CDF";
            row.setDevise(devise);

            // Sécurisation contre le NullPointerException sur le montant
            double montant = t.getMontant() != null ? t.getMontant() : 0.0;

            // Sécurisation contre le NullPointerException sur le type de transaction
            boolean isEntree = t.getTypeTransaction() != null && t.getTypeTransaction().equalsIgnoreCase("ENTREE");

            if (isEntree) {
                row.setEntree(montant);
                row.setSortie(0.0);
                if ("USD".equals(devise)) {
                    cumulUSD += montant;
                } else {
                    cumulCDF += montant;
                }
            } else {
                row.setEntree(0.0);
                row.setSortie(montant);
                if ("USD".equals(devise)) {
                    cumulUSD -= montant;
                } else {
                    cumulCDF -= montant;
                }
            }

            row.setSoldeUSD(cumulUSD);
            row.setSoldeCDF(cumulCDF);
            report.add(row);
        }

        System.out.println("✅ [FINANCE SERVICE] " + report.size() + " lignes traitées avec succès pour le livre de caisse.");
        return report;
    }
    public List<LivreDeCaisseRow> generateLivreDeCaisse(User agence) {
        // On utilise l'ID de l'agence pour être 100% certain que la jointure SQL fonctionne sans interférence
        List<FinanceTransaction> transactions = financeRepository.findByAgenceIdCustom(agence.getId());
        return processTransactionsToRows(transactions);
    }
}