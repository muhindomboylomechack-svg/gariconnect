package com.example.gariconnectbackend.dto;


import lombok.Data;

@Data
public class DemandeRecuperationRequest {
    private Long reservationId;
    private Double latitudeClient;
    private Double longitudeClient;
    private String adresseTextuelle;
}