package com.example.gariconnectbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean; // IMPORT MANQUANT
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // IMPORT MANQUANT
import org.springframework.security.crypto.password.PasswordEncoder; // IMPORT MANQUANT

@SpringBootApplication
public class GariConnectBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(GariConnectBackendApplication.class, args);
    }


}
/*@SpringBootApplication
public class GariConnectBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(GariConnectBackendApplication.class, args);
    }

}

// Ajoute le Bean ici directement pour tester
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}*/