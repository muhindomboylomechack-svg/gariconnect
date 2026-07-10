package com.example.gariconnectbackend.dto;

import java.math.BigDecimal;
import java.util.List;

public class LivreCaisseResponse {
    private BigDecimal soldeActuel;
    private List<EcritureCaisseDTO> ecritures;

    public LivreCaisseResponse(BigDecimal soldeActuel, List<EcritureCaisseDTO> ecritures) {
        this.soldeActuel = soldeActuel;
        this.ecritures = ecritures;
    }

    // Getters et Setters
    public BigDecimal getSoldeActuel() { return soldeActuel; }
    public void setSoldeActuel(BigDecimal soldeActuel) { this.soldeActuel = soldeActuel; }

    public List<EcritureCaisseDTO> getEcritures() { return ecritures; }
    public void setEcritures(List<EcritureCaisseDTO> ecritures) { this.ecritures = ecritures; }
}