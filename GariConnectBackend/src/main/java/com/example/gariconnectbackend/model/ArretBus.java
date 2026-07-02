package com.example.gariconnectbackend.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
        import lombok.*;

        import java.util.List;

@Entity
@Table(name = "arrets_bus")
@Getter
@Setter
@Builder
@NoArgsConstructor  // 🔥 INDISPENSABLE POUR JACKSON
@AllArgsConstructor
public class ArretBus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom; // Ex: Arrêt Victoire, Arrêt UPN

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Integer capaciteMaximale; // Optionnel

    // Lien avec l'agence (SaaS) : Chaque agence peut définir ses propres arrêts
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id", nullable = false)
    @JsonIgnore
    private User agence;

    // Lien avec les trajets (Un arrêt peut appartenir à plusieurs trajets)
    @ManyToMany(mappedBy = "arrets")
    @JsonIgnore
    private List<Trajet> trajets;

    // 🛠️ AJOUT : Indicateur pour savoir s'il s'agit de l'arrêt principal (ex: Gare principale)
    @Column(nullable = false)
    private boolean estPrincipal = false;


}