package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_transaction")
@Getter // Génère uniquement les Getters
@Setter // Génère uniquement les Setters
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔥 CORRECTION 1 : Passage en EAGER pour éviter que le proxy Lazy ne fausse la requête de recherche findByAgence
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agence_id", nullable = false)
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

    @PrePersist
    @PreUpdate
    protected void onSaveOrUpdate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.date == null) {
            this.date = LocalDate.now();
        }
        this.annee = this.date.getYear();
        this.mois = this.date.getMonth().name();
    }
}