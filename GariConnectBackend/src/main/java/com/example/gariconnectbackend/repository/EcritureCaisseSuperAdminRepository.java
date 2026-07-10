package com.example.gariconnectbackend.repository;


import com.example.gariconnectbackend.model.EcritureCaisseSuperAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EcritureCaisseSuperAdminRepository extends JpaRepository<EcritureCaisseSuperAdmin, Long> {

    // Récupère l'historique complet trié du plus récent au plus ancien
    List<EcritureCaisseSuperAdmin> findAllByOrderByDateCreationDesc();

    // Récupère la toute dernière écriture pour extraire le solde actuel progressif
    Optional<EcritureCaisseSuperAdmin> findFirstByOrderByDateCreationDesc();
}