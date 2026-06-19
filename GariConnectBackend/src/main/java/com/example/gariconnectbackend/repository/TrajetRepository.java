/*package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    // --- FILTRAGE DES VÉHICULES OCCUPÉS ---



    // --- VÉRIFICATIONS UNITAIRES (INDISPENSABLE POUR CREERTRAJET) ---

    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.vehicule.id = :id " +
            "AND CAST(t.dateHeureDepart AS date) = CAST(:date AS date) " +
            "AND t.statut <> 'TERMINE'")
    boolean isVehiculeOccupeADate(@Param("id") Long id, @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.chauffeur.id = :id " +
            "AND CAST(t.dateHeureDepart AS date) = CAST(:date AS date) " +
            "AND t.statut <> 'TERMINE'")
    boolean isChauffeurOccupeADate(@Param("id") Long id, @Param("date") LocalDateTime date);



    // --- MÉTHODES DE RECHERCHE CLASSIQUES ---
    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.chauffeur.id = :chauffeurId " +
            "AND (t.joursSemaine = :jour OR t.joursSemaine = 'TOUS' OR :jour = 'TOUS') " +
            "AND t.statut <> 'TERMINE'")
    boolean existsByChauffeurAndJourSemaine(@Param("chauffeurId") Long chauffeurId, @Param("jour") String jour);

    // Vérifie si le chauffeur a déjà un trajet à une date précise
    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.chauffeur.id = :chauffeurId " +
            "AND CAST(t.dateHeureDepart AS date) = :date " +
            "AND t.statut <> 'TERMINE'")
    boolean existsByChauffeurAndDate(@Param("chauffeurId") Long chauffeurId, @Param("date") LocalDate date);
    List<Trajet> findByAgenceId(Long agenceId);
    List<Trajet> findByStatut(String statut);
    Optional<Trajet> findByChauffeurIdAndStatut(Long chauffeurId, String statut);
    List<Trajet> findByDepartContainingIgnoreCaseAndDestinationContainingIgnoreCase(String depart, String destination);

    // Ajoute celle-ci pour corriger ton erreur précédente dans l'AgenceController
    long countByAgenceAndStatut(User agence, String statut);

    Object findByAgenceAndStatut(User agence, String enRoute);

    Object findByAgence(User agence);

    List<Trajet> findByChauffeurId(Long id);




        @Query("SELECT t.vehicule.id FROM Trajet t WHERE " +
                "CAST(t.dateHeureDepart AS date) = :date " +
                "AND t.statut <> 'TERMINE' AND t.vehicule.id IS NOT NULL")
        List<Long> findBusyVehiculeIdsByDate(@Param("date") LocalDate date);

        @Query("SELECT t.chauffeur.id FROM Trajet t WHERE " +
                "CAST(t.dateHeureDepart AS date) = :date " +
                "AND t.statut <> 'TERMINE' AND t.chauffeur.id IS NOT NULL")
        List<Long> findBusyChauffeurIdsByDate(@Param("date") LocalDate date);
    @Query("SELECT t.vehicule.id FROM Trajet t WHERE t.vehicule IS NOT NULL " +
            "AND (" +
            "  UPPER(t.joursSemaine) = UPPER(:jour) " +
            "  OR UPPER(t.joursSemaine) IN ('TOUS', 'TOUS LES JOURS') " +
            "  OR UPPER(:jour) IN ('TOUS', 'TOUS LES JOURS')" +
            ")")
    List<Long> findBusyVehiculeIdsByDay(@Param("jour") String jour);

    @Query("SELECT t.chauffeur.id FROM Trajet t WHERE t.chauffeur IS NOT NULL " +
            "AND (" +
            "  UPPER(t.joursSemaine) = UPPER(:jour) " +
            "  OR UPPER(t.joursSemaine) IN ('TOUS', 'TOUS LES JOURS') " +
            "  OR UPPER(:jour) IN ('TOUS', 'TOUS LES JOURS')" +
            ")")
    List<Long> findBusyChauffeurIdsByDay(@Param("jour") String jour);

    // Récupérer le trajet actif d'un chauffeur (qui n'est pas encore terminé)
    @Query("SELECT t FROM Trajet t WHERE t.chauffeur.id = :chauffeurId AND t.statut <> 'TERMINE'")
    Optional<Trajet> findActiveTrajetByChauffeurId(@Param("chauffeurId") Long chauffeurId);
    @Query("SELECT t FROM Trajet t WHERE t.chauffeur.email = :email AND t.statut <> 'TERMINE'")
    Optional<Trajet> findActiveTrajetByChauffeurEmail(@Param("email") String email);
}

*/
package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.vehicule.id = :id " +
            "AND CAST(t.dateHeureDepart AS date) = CAST(:date AS date) " +
            "AND t.statut <> 'TERMINE'")
    boolean isVehiculeOccupeADate(@Param("id") Long id, @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(t) > 0 FROM Trajet t WHERE t.chauffeur.id = :id " +
            "AND CAST(t.dateHeureDepart AS date) = CAST(:date AS date) " +
            "AND t.statut <> 'TERMINE'")
    boolean isChauffeurOccupeADate(@Param("id") Long id, @Param("date") LocalDateTime date);

    List<Trajet> findByAgenceAndStatut(User agence, String statut);

    List<Trajet> findByAgence(User agence);

    List<Trajet> findByChauffeurId(Long id);

    @Query("SELECT t FROM Trajet t WHERE t.chauffeur.email = :email AND t.statut = 'EN_ROUTE'")
    Optional<Trajet> findActiveTrajetByChauffeurEmail(@Param("email") String email);
    @Query("SELECT t.vehicule.id FROM Trajet t WHERE " +
            "CAST(t.dateHeureDepart AS date) = :date " +
            "AND t.statut <> 'TERMINE' AND t.vehicule.id IS NOT NULL")
    List<Long> findBusyVehiculeIdsByDate(@Param("date") LocalDate date);

    @Query("SELECT t.chauffeur.id FROM Trajet t WHERE " +
            "CAST(t.dateHeureDepart AS date) = :date " +
            "AND t.statut <> 'TERMINE' AND t.chauffeur.id IS NOT NULL")
    List<Long> findBusyChauffeurIdsByDate(@Param("date") LocalDate date);

    @Query("SELECT t.vehicule.id FROM Trajet t WHERE t.vehicule IS NOT NULL " +
            "AND (UPPER(t.joursSemaine) LIKE UPPER(CONCAT('%', :jour, '%')) " +
            "OR UPPER(t.joursSemaine) IN ('TOUS', 'TOUS LES JOURS')) AND t.statut <> 'TERMINE'")
    List<Long> findBusyVehiculeIdsByDay(@Param("jour") String jour);

    @Query("SELECT t.chauffeur.id FROM Trajet t WHERE t.chauffeur IS NOT NULL " +
            "AND (UPPER(t.joursSemaine) LIKE UPPER(CONCAT('%', :jour, '%')) " +
            "OR UPPER(t.joursSemaine) IN ('TOUS', 'TOUS LES JOURS')) AND t.statut <> 'TERMINE'")
    List<Long> findBusyChauffeurIdsByDay(@Param("jour") String jour);

    Optional<Trajet> findActiveTrajetByChauffeurId(Long chauffeurId);

    Object countByAgenceAndStatut(User agence, String enRoute);
    // Récupérer tous les trajets appartenant à une agence spécifique
    List<Trajet> findByAgence_Id(Long agenceId);
    List<Trajet> findByDepartContainingIgnoreCaseAndDestinationContainingIgnoreCase(String depart, String destination);
}
