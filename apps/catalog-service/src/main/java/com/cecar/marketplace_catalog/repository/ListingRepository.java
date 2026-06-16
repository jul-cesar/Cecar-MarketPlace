package com.cecar.marketplace_catalog.repository;

import com.cecar.marketplace_catalog.domain.Listing;
import com.cecar.marketplace_catalog.domain.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);

    Page<Listing> findBySellerId(String sellerId, Pageable pageable);

    boolean existsByIdAndSellerId(UUID id, String sellerId);

    long countByStatus(ListingStatus status);
}
