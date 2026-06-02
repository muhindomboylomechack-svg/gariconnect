
package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
// MODIFICATION : Changer String par Long ici
public interface FinanceRepository extends JpaRepository<FinanceTransaction, Long> {
    List<FinanceTransaction> findAllByOrderByDateAsc();

    Object findByAgence(User agence);
}