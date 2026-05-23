
package com.example.gariconnectbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class LivreDeCaisseRow {
    private LocalDate date;
    private String description;
    private String entite;
    private String devise;
    private Double entree;
    private Double sortie;
    private Double soldeUSD;
    private Double soldeCDF;
}