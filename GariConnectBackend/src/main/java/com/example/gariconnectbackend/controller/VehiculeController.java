package com.example.gariconnectbackend.controller;


import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.service.VehiculeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
@CrossOrigin(origins = "*") // Pour permettre à n'importe quel client de tester
public class VehiculeController {

    @Autowired
    private VehiculeService vehiculeService;

    // Route pour AJOUTER un véhicule (POST)
    @PostMapping
    public Vehicule ajouterVehicule(@RequestBody Vehicule vehicule) {
        return vehiculeService.enregistrerVehicule(vehicule);
    }

    // Route pour VOIR tous les véhicules (GET)
    @GetMapping
    public List<Vehicule> recupererTousLesVehicules() {
        return vehiculeService.listerTous();
    }
}