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
    private String typeReservation; // STANDARD ou VIP
    private String adresseRamassage; // null si STANDARD
    private Double prixSupplementaire; // 0 si STANDARD
    private Integer nombrePlaces; // 🟢 Ajouté pour remonter la quantité de sièges réservés
}