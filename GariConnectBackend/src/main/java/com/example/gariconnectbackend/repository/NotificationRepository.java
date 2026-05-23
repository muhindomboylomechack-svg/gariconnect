package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Récupérer les notifications d'une agence spécifique (les plus récentes en premier)
    List<Notification> findByDestinataireOrderByDateDesc(User destinataire);
    @Transactional
    @Modifying
    void deleteByDestinataireAndLueTrue(User destinataire);
    // Compter les notifications non lues pour afficher un badge sur la cloche
    long countByDestinataireAndLueFalse(User destinataire);
}