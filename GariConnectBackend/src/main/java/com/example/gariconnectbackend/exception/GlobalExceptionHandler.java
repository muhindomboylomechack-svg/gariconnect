
package com.example.gariconnectbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        // Affiche l'erreur détaillée dans ta console IntelliJ
        ex.printStackTrace();

        Map<String, String> response = new HashMap<>();
        response.put("erreur", "Une erreur est survenue");
        response.put("cause", ex.getMessage()); // Affiche la cause réelle dans Postman

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}