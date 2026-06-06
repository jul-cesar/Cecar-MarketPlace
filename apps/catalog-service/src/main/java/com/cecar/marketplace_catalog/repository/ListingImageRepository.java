package com.cecar.marketplace_catalog.repository;

import com.cecar.marketplace_catalog.domain.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingImageRepository extends JpaRepository<ListingImage, UUID> {

    List<ListingImage> findByListingIdOrderBySortOrderAsc(UUID listingId);

}
