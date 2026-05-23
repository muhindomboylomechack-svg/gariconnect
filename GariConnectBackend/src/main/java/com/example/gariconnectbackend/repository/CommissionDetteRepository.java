package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.CommissionDette;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommissionDetteRepository extends JpaRepository<CommissionDette, Long> {

    @Query("SELECT COALESCE(SUM(c.montantDu), 0.0) FROM CommissionDette c WHERE c.reglee = false")
    Double sumTotalDettesEnAttente();

    @Query("SELECT COALESCE(SUM(c.montantDu), 0.0) FROM CommissionDette c WHERE c.agence.id = :agenceId AND c.reglee = false")
    Double totalDuRestantParAgence(@Param("agenceId") Long agenceId);

    // L'ANCIENNE MÉTHODE EST LÀ : L'annotation @Query empêche l'erreur Spring !
    @Query("SELECT COALESCE(SUM(c.montant), 0.0) FROM CommissionDette c WHERE c.agence.id = :agenceId")
    Double totalDuParAgence(@Param("agenceId") Long agenceId);

    @Query("SELECT COALESCE(SUM(c.reservation.montantPaye), 0.0) FROM CommissionDette c WHERE c.agence.id = :agenceId")
    Double sumVentesBrutesParAgence(@Param("agenceId") Long agenceId);

    List<CommissionDette> findByAgenceAndReglee(User agence, boolean reglee);

    List<CommissionDette> findByAgenceAndRegleeOrderByIdAsc(User agence, boolean b);
}