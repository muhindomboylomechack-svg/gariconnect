package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    // Trouver uniquement les bus d'une agence


    long countByAgence(User agence);

    Object countByAgenceId(Long id);
    // Trouve tous les véhicules d'une agence spécifique
    List<Vehicule> findByAgenceId(Long agenceId);


    List<Vehicule> findByTrajet_Id(Long trajetId);

    List<Vehicule> findByAgence(User agence);


    List<Vehicule> findByAgenceAndTrajet_Id(User agence, Long trajetId);
}