package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;

        import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Le trajet (la ligne) affecté à cette course
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chauffeur_id", nullable = false)
    private User chauffeur;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    // Le statut de l'affectation du jour
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCourse statut = StatutCourse.PROGRAMMEE; // PROGRAMMEE, EN_COURS, TERMINEE

    private LocalDateTime dateHeureDebut;
    private LocalDateTime dateHeureFin;
}