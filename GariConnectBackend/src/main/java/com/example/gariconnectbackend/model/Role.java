package com.example.gariconnectbackend.model;

public enum Role {
    SUPER_ADMIN,    // Propriétaire de la plateforme
     AGENCY_ADMIN,   // Le propriétaire / représentant légal d'une agence
    AGENCY_MANAGER, // Un gestionnaire ou agent de comptoir employé par l'agence
   CHAUFFEUR,      // Le conducteur de l'agence
   CLIENT
}
