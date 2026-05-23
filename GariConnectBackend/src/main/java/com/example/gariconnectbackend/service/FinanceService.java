package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.LivreDeCaisseRow;
import com.example.gariconnectbackend.model.FinanceTransaction;
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

    public List<LivreDeCaisseRow> generateLivreDeCaisse() {
        List<FinanceTransaction> transactions = financeRepository.findAllByOrderByDateAsc();
        List<LivreDeCaisseRow> report = new ArrayList<>();

        double cumulUSD = 0.0;
        double cumulCDF = 0.0;

        for (FinanceTransaction t : transactions) {
            LivreDeCaisseRow row = new LivreDeCaisseRow();
            row.setDate(t.getDate());
            row.setDescription(t.getDescription());
            row.setEntite(t.getEntite());
            row.setDevise(t.getDevise());

            boolean isEntree = t.getTypeTransaction().equalsIgnoreCase("ENTREE");
            double montant = t.getMontant();

            if (isEntree) {
                row.setEntree(montant);
                row.setSortie(0.0);
                if (t.getDevise().equals("USD")) cumulUSD += montant;
                else cumulCDF += montant;
            } else {
                row.setEntree(0.0);
                row.setSortie(montant);
                if (t.getDevise().equals("USD")) cumulUSD -= montant;
                else cumulCDF -= montant;
            }

            row.setSoldeUSD(cumulUSD);
            row.setSoldeCDF(cumulCDF);
            report.add(row);
        }
        return report;
    }
}