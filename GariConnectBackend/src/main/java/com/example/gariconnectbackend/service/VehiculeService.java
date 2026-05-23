package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VehiculeService {

    @Autowired
    private VehiculeRepository vehiculeRepository;

    public Vehicule enregistrerVehicule(Vehicule vehicule) {
        return vehiculeRepository.save(vehicule);
    }

    public List<Vehicule> listerTous() {
        return vehiculeRepository.findAll();
    }
    // Méthode pour supprimer un véhicule

// Dans VehiculeService.java

    public void supprimerVehicule(Long id) {
        // Vérifie d'abord si le véhicule existe pour éviter les erreurs 400/500
        if (!vehiculeRepository.existsById(id)) {
            throw new RuntimeException("Véhicule introuvable avec l'ID : " + id);
        }
        vehiculeRepository.deleteById(id);
    }

    // Dans VehiculeService.java
    public Vehicule mettreAJourVehicule(Long id, Vehicule details) {
        Vehicule vehicule = vehiculeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus non trouvé"));

        vehicule.setMarque(details.getMarque());
        vehicule.setModele(details.getModele());
        vehicule.setPlaque_immatriculation(details.getPlaque_immatriculation());
        vehicule.setStatut(details.getStatut());
        // AJOUT DES DEUX LIGNES SUIVANTES :
        vehicule.setCapacite(details.getCapacite());
        vehicule.setCapaciteTotale(details.getCapaciteTotale());

        return vehiculeRepository.save(vehicule);
    }

}