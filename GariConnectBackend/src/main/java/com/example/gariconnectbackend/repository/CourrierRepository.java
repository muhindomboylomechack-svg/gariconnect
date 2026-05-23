package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourrierRepository extends JpaRepository<Courrier, Long> {

    // CORRECTION : Un code de retrait doit être unique pour le suivi


    List<Courrier> findByTelDestinataire(String tel);
    List<Courrier> findByAgence_Id(Long agenceId);
    List<Courrier> findByTelExpediteur(String telExpediteur);



    // Pour filtrer par agence et par type (Colis vs Courrier)
    List<Courrier> findByAgenceAndType(User agence, String type);

    // Pour filtrer par statut (ex: voir tout ce qui est "EN_ROUTE")
    List<Courrier> findByAgenceAndStatut(User agence, String statut);

    List<Courrier> findByAgence(User agence);
    Optional<Courrier> findByCodeRetrait(String code);

    @Query("SELECT c FROM Courrier c WHERE c.telExpediteur LIKE %:tel% OR c.telDestinataire LIKE %:tel%")
    List<Courrier> findByTelephoneFuzzy(@Param("tel") String tel);
}

