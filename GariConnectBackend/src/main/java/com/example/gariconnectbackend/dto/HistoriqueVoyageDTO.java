package com.example.gariconnectbackend.dto;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HistoriqueVoyageDTO {
    private Long id; // ID de la réservation
    private LocalDateTime dateReservation;
    private String villeDepart;
    private String villeArrivee;
    private String heureDepart;
    private Double montantTotal;
    private String statutPaiement; // PAYE, ATTENTE_PAIEMENT, ATTENTE_PAIEMENT_SURPLUS
    private String typeReservation; // NORMAL ou VID
    private String adresseRamassage; // null si NORMAL
    private Double prixSupplementaire; // 0 si NORMAL
}