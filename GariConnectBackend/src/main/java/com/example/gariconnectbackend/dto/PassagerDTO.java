package com.example.gariconnectbackend.dto;

public class PassagerDTO {
    private String nom;
    private String telephone;
    private String codeTicket;

    public PassagerDTO(String nom, String telephone, String codeTicket, Integer numeroSiege) {
        this.nom = nom;
        this.telephone = telephone;
        this.codeTicket = codeTicket;
    }
    // Getters et Setters

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getCodeTicket() {
        return codeTicket;
    }

    public void setCodeTicket(String codeTicket) {
        this.codeTicket = codeTicket;
    }
}