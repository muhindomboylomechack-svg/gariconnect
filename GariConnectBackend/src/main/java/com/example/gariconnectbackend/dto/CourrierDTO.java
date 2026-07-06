package com.example.gariconnectbackend.dto;

// CourrierDTO.java
public class CourrierDTO {
    private String codeRetrait;
    private String statut;
    private String nomExpediteur;
    private String telExpediteur;
    private String nomDestinataire;
    private String telDestinataire;
    private String type;
    private String description;
    private Double poidsKg;
    private Double valeurEstimee;
    private String devise;
    private boolean estFragile;
    private Long trajetId;
    private TrajetDTO trajet;

    // --- GETTERS & SETTERS ---

    public String getCodeRetrait() { return codeRetrait; }
    public void setCodeRetrait(String codeRetrait) { this.codeRetrait = codeRetrait; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getNomExpediteur() { return nomExpediteur; }
    public void setNomExpediteur(String nomExpediteur) { this.nomExpediteur = nomExpediteur; }

    public String getTelExpediteur() { return telExpediteur; }
    public void setTelExpediteur(String telExpediteur) { this.telExpediteur = telExpediteur; }

    public String getNomDestinataire() { return nomDestinataire; }
    public void setNomDestinataire(String nomDestinataire) { this.nomDestinataire = nomDestinataire; }

    public String getTelDestinataire() { return telDestinataire; }
    public void setTelDestinataire(String telDestinataire) { this.telDestinataire = telDestinataire; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getPoidsKg() { return poidsKg; }
    public void setPoidsKg(Double poidsKg) { this.poidsKg = poidsKg; }

    public Double getValeurEstimee() { return valeurEstimee; }
    public void setValeurEstimee(Double valeurEstimee) { this.valeurEstimee = valeurEstimee; }

    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }

    public boolean isEstFragile() { return estFragile; }
    public void setEstFragile(boolean estFragile) { this.estFragile = estFragile; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }

    public TrajetDTO getTrajet() { return trajet; }
    public void setTrajet(TrajetDTO trajet) { this.trajet = trajet; }
}