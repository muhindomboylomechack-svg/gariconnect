package com.example.gariconnectbackend.exception;

/**
 * Exception personnalisée pour les conflits de disponibilité
 * (Chauffeur ou Véhicule déjà pris).
 */
public class RessourceOccupeeException extends RuntimeException {
    public RessourceOccupeeException(String message) {
        super(message);
    }
}