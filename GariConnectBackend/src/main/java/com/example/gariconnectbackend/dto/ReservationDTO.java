package com.example.gariconnectbackend.dto;

public class ReservationDTO {
    private Long id;
    private String codeReservation;
    private String passagerNom;
    private String villeDepart;
    private String villeArrivee;
    private String busMarque;
    private int numeroSiege;
    private String dateVoyage;
    private String statut;

    // Constructeur, Getters et Setter

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodeReservation() {
        return codeReservation;
    }

    public void setCodeReservation(String codeReservation) {
        this.codeReservation = codeReservation;
    }

    public String getPassagerNom() {
        return passagerNom;
    }

    public void setPassagerNom(String passagerNom) {
        this.passagerNom = passagerNom;
    }

    public String getVilleDepart() {
        return villeDepart;
    }

    public void setVilleDepart(String villeDepart) {
        this.villeDepart = villeDepart;
    }

    public String getVilleArrivee() {
        return villeArrivee;
    }

    public void setVilleArrivee(String villeArrivee) {
        this.villeArrivee = villeArrivee;
    }

    public String getBusMarque() {
        return busMarque;
    }

    public void setBusMarque(String busMarque) {
        this.busMarque = busMarque;
    }

    public int getNumeroSiege() {
        return numeroSiege;
    }

    public void setNumeroSiege(int numeroSiege) {
        this.numeroSiege = numeroSiege;
    }

    public String getDateVoyage() {
        return dateVoyage;
    }

    public void setDateVoyage(String dateVoyage) {
        this.dateVoyage = dateVoyage;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }
}
