//package com.example.gariconnectbackend.repository;
//
//import com.example.gariconnectbackend.model.Reservation;
//import com.example.gariconnectbackend.model.User;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//import com.example.gariconnectbackend.model.StatutPassagerArret;
//@Repository
//public interface ReservationRepository extends JpaRepository<Reservation, Long> {
//    List<Reservation> findByClientId(Long clientId);
//    List<Reservation> findByTrajetId(Long trajetId);
//    long countByTrajet_IdAndVehicule_Id(Long trajetId, Long vehiculeId);
//    List<Reservation> findTop5ByOrderByDateReservationDesc();
//    Optional<Reservation> findByCodeTicket(String codeTicket);
//    List<Reservation> findByTrajet_Agence(User agence);
//    long countByTrajet_Agence(User agence);
//    List<Reservation> findByTrajet_Chauffeur_Id(Long chauffeurId);
//    long countByStatut(String statut);
//
//    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.trajet.agence = :agence AND r.dateReservation >= :date")
//    long countByAgenceAndDateAfter(@Param("agence") User agence, @Param("date") LocalDateTime date);
//
//    // Ajoute cette ligne dans ReservationRepository.java (n'oublie pas d'importer StatutPassagerArret)
//
//    // Dans ReservationRepository.java
//    List<Reservation> findByCourseAssigneeIdAndArretMontageId(Long courseId, Long arretId);
//    long countByArretMontageIdAndStatutEmbarquement(Long arretId, StatutPassagerArret statutEmbarquement);
//    List<Reservation> findByClient_EmailOrderByDateReservationDesc(String email);
//
//    @Query(value = "SELECT CAST(r.date_reservation AS DATE) as date, COUNT(r.id) as count " +
//            "FROM reservations r " +  // Ajout du 's'
//            "JOIN trajets t ON r.trajet_id = t.id " + // Ajout du 's'
//            "WHERE t.agence_id = :agenceId " +
//            "AND r.date_reservation >= CURRENT_DATE - INTERVAL '30 days' " +
//            "GROUP BY CAST(r.date_reservation AS DATE) " +
//            "ORDER BY date ASC",
//            nativeQuery = true)
//    List<Map<String, Object>> getReservationsStatsParJour(@Param("agenceId") Long agenceId);
//    @Query("SELECT FUNCTION('DATE', r.dateReservation) as date, COUNT(r.id) as count " +
//            "FROM Reservation r " +
//            "WHERE r.trajet.agence.id = :agenceId " +
//            "AND r.dateReservation >= :sevenDaysAgo " +
//            "GROUP BY FUNCTION('DATE', r.dateReservation) " +
//            "ORDER BY date ASC")
//    List<Map<String, Object>> getReservationsStatsJPQL(@Param("agenceId") Long agenceId,
//                                                       @Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);
//
//    long countByTrajetIdAndStatutIn(Long id, List<String> confirme);
//
//    List<Reservation> findByArretMontageIdAndStatutEmbarquement(Long id, StatutPassagerArret statutPassagerArret);
//
//    long countByTrajetId(Long id);
//    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.statut = :statut")
//    long countByStatutPaiement(@Param("statut") String statut);
//
//    long countByStatutIn(List<String> paye);
//
//}

package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.example.gariconnectbackend.model.StatutPassagerArret;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByClientId(Long clientId);
    List<Reservation> findByTrajetId(Long trajetId);
    long countByTrajet_IdAndVehicule_Id(Long trajetId, Long vehiculeId);
    List<Reservation> findTop5ByOrderByDateReservationDesc();
    Optional<Reservation> findByCodeTicket(String codeTicket);
    List<Reservation> findByTrajet_Agence(User agence);
    long countByTrajet_Agence(User agence);
    List<Reservation> findByTrajet_Chauffeur_Id(Long chauffeurId);

    // Compte les réservations par statut (ex: "PAYE")
    long countByStatut(String statut);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.trajet.agence = :agence AND r.dateReservation >= :date")
    long countByAgenceAndDateAfter(@Param("agence") User agence, @Param("date") LocalDateTime date);

    List<Reservation> findByCourseAssigneeIdAndArretMontageId(Long courseId, Long arretId);
    long countByArretMontageIdAndStatutEmbarquement(Long arretId, StatutPassagerArret statutEmbarquement);
    List<Reservation> findByClient_EmailOrderByDateReservationDesc(String email);

    @Query(value = "SELECT CAST(r.date_reservation AS DATE) as date, COUNT(r.id) as count " +
            "FROM reservations r " +
            "JOIN trajets t ON r.trajet_id = t.id " +
            "WHERE t.agence_id = :agenceId " +
            "AND r.date_reservation >= CURRENT_DATE - INTERVAL '30 days' " +
            "GROUP BY CAST(r.date_reservation AS DATE) " +
            "ORDER BY date ASC",
            nativeQuery = true)
    List<Map<String, Object>> getReservationsStatsParJour(@Param("agenceId") Long agenceId);

    @Query("SELECT FUNCTION('DATE', r.dateReservation) as date, COUNT(r.id) as count " +
            "FROM Reservation r " +
            "WHERE r.trajet.agence.id = :agenceId " +
            "AND r.dateReservation >= :sevenDaysAgo " +
            "GROUP BY FUNCTION('DATE', r.dateReservation) " +
            "ORDER BY date ASC")
    List<Map<String, Object>> getReservationsStatsJPQL(@Param("agenceId") Long agenceId,
                                                       @Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);

    long countByTrajetIdAndStatutIn(Long id, List<String> confirme);

    List<Reservation> findByArretMontageIdAndStatutEmbarquement(Long id, StatutPassagerArret statutPassagerArret);

    long countByTrajetId(Long id);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.statut = :statut")
    long countByStatutPaiement(@Param("statut") String statut);

    long countByStatutIn(List<String> paye);
}