package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.EcritureCaisseDTO;
import com.example.gariconnectbackend.dto.LivreCaisseResponse;
import com.example.gariconnectbackend.model.EcritureCaisseSuperAdmin;
import com.example.gariconnectbackend.repository.EcritureCaisseSuperAdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SuperAdminFinancesService {

    @Autowired
    private EcritureCaisseSuperAdminRepository repository;

    /**
     * Calcule le solde actuel et convertit l'historique pour le Front-End
     */
    public LivreCaisseResponse obtenirLivreCaisseSuperAdmin() {
        // 1. Récupérer le solde actuel basé sur la dernière transaction
        BigDecimal soldeActuel = repository.findFirstByOrderByDateCreationDesc()
                .map(EcritureCaisseSuperAdmin::getSoldeCalculer)
                .orElse(BigDecimal.ZERO);

        // 2. Récupérer l'historique des écritures du Superadmin
        List<EcritureCaisseDTO> ecrituresDTO = repository.findAllByOrderByDateCreationDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new LivreCaisseResponse(soldeActuel, ecrituresDTO);
    }

    /**
     * Enregistre de manière sécurisée une nouvelle opération financière propre au Superadmin
     */
    @Transactional
    public void enregistrerEcritureSuperAdmin(EcritureCaisseDTO dto) {
        // Récupérer le dernier solde calculé
        BigDecimal dernierSolde = repository.findFirstByOrderByDateCreationDesc()
                .map(EcritureCaisseSuperAdmin::getSoldeCalculer)
                .orElse(BigDecimal.ZERO);

        // Calculer le nouveau solde progressif
        BigDecimal nouveauSolde;
        if ("ENTREE".equalsIgnoreCase(dto.getType())) {
            nouveauSolde = dernierSolde.add(dto.getMontant());
        } else if ("SORTIE".equalsIgnoreCase(dto.getType())) {
            nouveauSolde = dernierSolde.subtract(dto.getMontant());
        } else {
            throw new IllegalArgumentException("Type d'écriture inconnu : " + dto.getType());
        }

        // Créer et sauvegarder l'entité
        EcritureCaisseSuperAdmin nouvelleEcriture = new EcritureCaisseSuperAdmin();
        nouvelleEcriture.setLibelle(dto.getLibelle());
        nouvelleEcriture.setType(dto.getType().toUpperCase());
        nouvelleEcriture.setMontant(dto.getMontant());
        nouvelleEcriture.setDevise(dto.getDevise());
        nouvelleEcriture.setSoldeCalculer(nouveauSolde);

        repository.save(nouvelleEcriture);
    }

    private EcritureCaisseDTO convertToDTO(EcritureCaisseSuperAdmin entity) {
        EcritureCaisseDTO dto = new EcritureCaisseDTO();
        dto.setDateCreation(entity.getDateCreation());
        dto.setLibelle(entity.getLibelle());
        dto.setType(entity.getType());
        dto.setMontant(entity.getMontant());
        dto.setDevise(entity.getDevise());
        dto.setSoldeCalculer(entity.getSoldeCalculer());
        return dto;
    }
}