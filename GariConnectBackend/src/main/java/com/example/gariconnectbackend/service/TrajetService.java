package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TrajetService {

    @Autowired
    private TrajetRepository trajetRepository;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    public Trajet creerTrajet(Trajet trajet) {
        // On récupère le véhicule associé pour connaître sa capacité
        Vehicule vehicule = vehiculeRepository.findById(trajet.getVehicule().getId())
                .orElseThrow(() -> new RuntimeException("Véhicule non trouvé"));

        // On initialise les places disponibles avec la capacité du bus
        trajet.setPlacesDisponibles(vehicule.getCapaciteTotale());

        return trajetRepository.save(trajet);
    }

    public List<Trajet> listerTousLesTrajets() {
        return trajetRepository.findAll();
    }

    public List<Trajet> rechercherTrajets(String depart, String destination) {
        return trajetRepository.findByDepartAndDestination(depart, destination);
    }


}