package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Trajet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrajetRepository extends JpaRepository<Trajet, Long> {
    // Cette méthode génère automatiquement la requête SQL :
    // SELECT * FROM trajets WHERE depart = ? AND destination = ?
    List<Trajet> findByDepartAndDestination(String depart, String destination);
}