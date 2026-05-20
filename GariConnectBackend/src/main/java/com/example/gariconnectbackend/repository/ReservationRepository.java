package com.example.gariconnectbackend.repository;






import com.example.gariconnectbackend.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    // Spring va chercher automatiquement dans la colonne 'client' l'attribut 'id'
    List<Reservation> findByClientId(Long clientId);

    long countByTrajetIdAndVehiculeId(Long trajetId, Long vehiculeId);

    Optional<Reservation> findByCodeTicket(String codeTicket);
}