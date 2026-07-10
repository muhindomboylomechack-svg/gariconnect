package com.example.gariconnectbackend.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EcritureCaisseDTO {
    private LocalDateTime dateCreation;
    private String libelle;
    private String type; // "ENTREE" ou "SORTIE"
    private BigDecimal montant;
    private String devise; // "CDF" ou "USD"
    private BigDecimal soldeCalculer;

    // Constructeur par défaut
    public EcritureCaisseDTO() {}

    // Getters et Setters
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }

    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }

    public BigDecimal getSoldeCalculer() { return soldeCalculer; }
    public void setSoldeCalculer(BigDecimal soldeCalculer) { this.soldeCalculer = soldeCalculer; }
}