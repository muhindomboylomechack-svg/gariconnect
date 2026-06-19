package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FinanceRepository extends JpaRepository<FinanceTransaction, Long> {

    List<FinanceTransaction> findAllByOrderByDateAsc();

    // 🔥 SOLUTION RADICALE : Requête personnalisée par ID d'agence pour contourner tout problème de Proxy Hibernate
    @Query("SELECT f FROM FinanceTransaction f WHERE f.agence.id = :agenceId ORDER BY f.date ASC")
    List<FinanceTransaction> findByAgenceIdCustom(@Param("agenceId") Long agenceId);

    List<FinanceTransaction> findByAgenceOrderByDateAsc(User agence);

    Object findByAgence(User agence);
}