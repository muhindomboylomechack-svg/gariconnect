package com.example.gariconnectbackend.dto;

import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class EvaluationRequestDTO {

    @NotNull(message = "L'ID de la réservation est obligatoire")
    private Long reservationId;

    @Min(1) @Max(5)
    @NotNull(message = "La note globale est requise")
    private Integer noteGlobale;

    @Min(1) @Max(5)
    private Integer noteConduite;

    @Min(1) @Max(5)
    private Integer noteConfort;

    @Min(1) @Max(5)
    private Integer notePonctualite;

    private String commentaire;
}