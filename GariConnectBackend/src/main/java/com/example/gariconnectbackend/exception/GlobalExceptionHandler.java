package com.example.gariconnectbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // 1. Gère spécifiquement les conflits de ressources (Chauffeur/Véhicule occupés)
    @ExceptionHandler(RessourceOccupeeException.class)
    public ResponseEntity<Map<String, String>> handleRessourceOccupee(RessourceOccupeeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("erreur", "Conflit de disponibilité");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.CONFLICT); // Code 409
    }

    // 2. Gère les autres erreurs d'exécution (ex: ressources introuvables)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        ex.printStackTrace(); // Utile pour le débogage en console
        Map<String, String> response = new HashMap<>();
        response.put("erreur", "Une erreur technique est survenue");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}