package com.example.gariconnectbackend.repository;
import com.example.gariconnectbackend.model.Course;
import com.example.gariconnectbackend.model.StatutCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // Historique des courses pour une agence
    List<Course> findByTrajet_Agence_Id(Long agenceId);

    // Récupérer la course en cours d'un chauffeur spécifique
    Optional<Course> findByChauffeurIdAndStatut(Long chauffeurId, StatutCourse statut);
}