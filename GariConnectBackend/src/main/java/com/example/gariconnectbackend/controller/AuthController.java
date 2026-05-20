package com.example.gariconnectbackend.controller;


import com.example.gariconnectbackend.dto.LoginRequest;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public User authenticate(@RequestBody LoginRequest request) {
        return authService.login(request.email(), request.motDePasse());
    }
}