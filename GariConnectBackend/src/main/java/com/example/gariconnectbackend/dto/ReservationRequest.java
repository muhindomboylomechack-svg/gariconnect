package com.example.gariconnectbackend.dto;

import lombok.Data;

@Data
public class ReservationRequest {

    private Long trajetId;
    private Integer nombrePlaces = 1; // Permet à request.getNombrePlaces() de fonctionner
    private String typeReservation;   // "STANDARD" ou "VIP"
    private Long arretMontageId;
    private Long arretDescenteId;
    private String modePaiement;

    // Si tu as d'autres champs envoyés par le frontend, ajoute-les ici
}