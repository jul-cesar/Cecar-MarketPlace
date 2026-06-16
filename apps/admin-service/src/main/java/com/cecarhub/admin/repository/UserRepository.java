package com.cecarhub.admin.repository;

import com.cecarhub.admin.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {

    Page<User> findByBanned(Boolean banned, Pageable pageable);

    long countByBanned(Boolean banned);

    List<User> findTop10ByOrderByCreatedAtDesc();
}
