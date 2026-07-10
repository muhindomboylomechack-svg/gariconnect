package com.example.gariconnectbackend.model;
import jakarta.persistence.*;
        import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ecritures_caisse_superadmin")
public class EcritureCaisseSuperAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false) // "ENTREE" ou "SORTIE"
    private String type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false, length = 3) // "CDF" ou "USD"
    private String devise;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal soldeCalculer;

    // Constructeurs
    public EcritureCaisseSuperAdmin() {
        this.dateCreation = LocalDateTime.now();
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }

    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }

    public BigDecimal getSoldeCalculer() { return soldeCalculer; }
    public void setSoldeCalculer(BigDecimal soldeCalculer) { this.soldeCalculer = soldeCalculer; }
}