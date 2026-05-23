package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    long countByReservationIdAndClientId(Long reservationId, Long clientId);

    // --- REQUÊTES POUR L'INTERFACE CHAUFFEUR (FILTRÉES) ---[cite: 33]
    @Query("SELECT AVG(e.noteGlobale) FROM Evaluation e WHERE e.chauffeur.id = :id")
    Double getMoyenneGlobaleChauffeur(@Param("id") Long chauffeurId);

    @Query("SELECT AVG(e.noteConduite) FROM Evaluation e WHERE e.chauffeur.id = :id")
    Double getMoyenneConduiteChauffeur(@Param("id") Long chauffeurId);

    @Query("SELECT AVG(e.notePonctualite) FROM Evaluation e WHERE e.chauffeur.id = :id")
    Double getMoyennePonctualiteChauffeur(@Param("id") Long chauffeurId);

    List<Evaluation> findByChauffeurIdOrderByDateEvaluationDesc(Long chauffeurId);

    // --- REQUÊTES POUR LE DASHBOARD AGENCE (GLOBALES) ---[cite: 33]
    @Query("SELECT AVG(e.noteGlobale) FROM Evaluation e")
    Double getMoyenneGlobaleAgence();

    @Query("SELECT AVG(e.noteConduite) FROM Evaluation e")
    Double getMoyenneConduiteGlobale();

    @Query("SELECT AVG(e.noteConfort) FROM Evaluation e")
    Double getMoyenneConfortGlobale();

    @Query("SELECT AVG(e.notePonctualite) FROM Evaluation e")
    Double getMoyennePonctualiteGlobale();

    List<Evaluation> findAllByOrderByDateEvaluationDesc();

    List<Evaluation> findByNoteGlobaleLessThanOrderByDateEvaluationDesc(Integer noteLimite);
}