// --- CLASSE COMPLÈTE CORRIGÉE : TrackingController.java ---
package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.repository.CourrierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class TrackingController {

    @Autowired
    private CourrierRepository repository;

    @GetMapping("/track/{code}")
    public ResponseEntity<?> track(@PathVariable String code) {
        // Recherche le colis par son code unique (GC-XXXX)
        return repository.findByCodeRetrait(code)
                .map(courrier -> ResponseEntity.ok(courrier))
                .orElse(ResponseEntity.notFound().build());
    }
}