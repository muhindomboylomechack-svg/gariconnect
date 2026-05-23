package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Paiement;
import com.example.gariconnectbackend.model.User; // Ajouté
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {


    // NOUVELLE MÉTHODE : Somme des revenus filtrée par agence

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.statut IN :statuts")
    Double sumMontantByStatutIn(@Param("statuts") List<String> statuts);

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.statut = ?1")
    Double sumMontantByStatut(String statut);

    @Query("SELECT SUM(p.montant) FROM Paiement p WHERE p.statut = :statut AND p.reservation.trajet.agence = :agence")
    Double sumMontantByStatutAndTrajet_Agence(@Param("statut") String statut, @Param("agence") User agence);

    // On calcule 10% (0.1) du montant de chaque paiement réussi par agence
    @Query("SELECT p.reservation.trajet.agence.nom as partenaire, " +
            "SUM(p.montant) as volumeVentes, " +
            "SUM(p.montant * 0.1) as commissionNet " +
            "FROM Paiement p " +
            "WHERE p.statut = 'SUCCES' " +
            "GROUP BY p.reservation.trajet.agence.nom")
    List<Map<String, Object>> getCommissionsParAgence();

    List<Paiement> findByReservation_Trajet_Agence(User agence);
    @Query(value = "SELECT CAST(p.date_paiement AS DATE) as date_paiement, COUNT(*) as total " +
            "FROM paiements p " +
            "JOIN reservations r ON p.reservation_id = r.id " +
            "JOIN trajets t ON r.trajet_id = t.id " +
            "WHERE t.agence_id = :agenceId " +
            "AND p.statut IN ('SUCCES', 'VALIDE_AGENCE') " +
            "GROUP BY CAST(p.date_paiement AS DATE) " +
            "ORDER BY date_paiement ASC", nativeQuery = true)
    List<Map<String, Object>> getStatsPaiementsParJourPourAgence(@Param("agenceId") Long agenceId);
    Optional<Paiement> findByReservationId(Long reservationId);
}

