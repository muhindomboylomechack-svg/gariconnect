package com.example.gariconnectbackend.dto;

import com.example.gariconnectbackend.model.Trajet;
import lombok.Data;

import java.time.format.TextStyle;
import java.util.Locale;

@Data
public class TrajetDTO {
    private Long id;
    private String depart;
    private String destination;
    private String heureDepart;
    private String jourDepart;
    private String statut;
    private Double prix;

    // Sous-objet pour garder la compatibilité avec React (trajet.agence.nom)
    private AgenceDTO agence;

    @Data
    public static class AgenceDTO {
        private String nom;
    }

    // Méthode de conversion (Entité -> DTO)
    public static TrajetDTO fromEntity(Trajet trajet) {
        TrajetDTO dto = new TrajetDTO();
        dto.setId(trajet.getId());
        dto.setDepart(trajet.getDepart());
        dto.setDestination(trajet.getDestination());
        dto.setStatut(trajet.getStatut());
        dto.setPrix(trajet.getPrix());

        if (trajet.getAgence() != null) {
            AgenceDTO agenceDTO = new AgenceDTO();
            agenceDTO.setNom(trajet.getAgence().getNom());
            dto.setAgence(agenceDTO);
        }

        if (trajet.getDateHeureDepart() != null) {
            // 1. Extraire l'heure précise (ex: "14:30")
            dto.setHeureDepart(String.format("%02d:%02d",
                    trajet.getDateHeureDepart().getHour(),
                    trajet.getDateHeureDepart().getMinute()));

            // 2. Extraire le jour de la semaine en Français
            String jourSemaine = trajet.getDateHeureDepart().getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.FRENCH);
            jourSemaine = jourSemaine.substring(0, 1).toUpperCase() + jourSemaine.substring(1);

            int jourDuMois = trajet.getDateHeureDepart().getDayOfMonth();
            String mois = trajet.getDateHeureDepart().getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH);

            dto.setJourDepart(jourSemaine + " " + jourDuMois + " " + mois);
        } else if (trajet.getJoursSemaine() != null) {
            dto.setJourDepart(trajet.getJoursSemaine());
            dto.setHeureDepart("--:--");
        } else {
            dto.setJourDepart("Non défini");
            dto.setHeureDepart("--:--");
        }

        return dto;
    }
}