package com.example.gariconnectbackend.repository;
import com.example.gariconnectbackend.model.ArretBus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArretBusRepository extends JpaRepository<ArretBus, Long> {


    // 🔥 RECHERCHE PAR NOM : Filtre par agence + nom contenant le mot-clé (Insensible à la casse)
    List<ArretBus> findByAgenceIdAndNomContainingIgnoreCase(Long agenceId, String nom);
    List<ArretBus> findByAgenceId(Long agenceId);

    // 📍 AJOUT : Récupérer les arrêts d'une agence liés à un trajet spécifique
    @Query("SELECT a FROM ArretBus a JOIN a.trajets t WHERE a.agence.id = :agenceId AND t.id = :trajetId")
    List<ArretBus> findByAgenceIdAndTrajetId(@Param("agenceId") Long agenceId, @Param("trajetId") Long trajetId);
}