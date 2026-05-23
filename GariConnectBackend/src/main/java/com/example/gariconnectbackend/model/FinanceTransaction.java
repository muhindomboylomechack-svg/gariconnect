package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_transaction") // Recommandé pour éviter les conflits de noms SQL
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id", nullable = false) // Une transaction appartient forcément à une agence
    private User agence;

    private Integer annee;
    private String mois;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "type_transaction", nullable = false)
    private String typeTransaction; // "ENTREE" ou "SORTIE"

    private String description;

    @Column(length = 3)
    private String devise; // "USD" ou "CDF"

    private Double montant;
    private String entite;
    private String documentRef;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Synchronise les données temporelles avant chaque insertion ou mise à jour.
     */
    @PrePersist
    @PreUpdate
    protected void onSaveOrUpdate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }

        if (this.date != null) {
            this.annee = this.date.getYear();
            // Récupère le nom du mois en majuscules (ex: APRIL)[cite: 2, 10]
            this.mois = this.date.getMonth().name();
        }
    }
}