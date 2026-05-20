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
}