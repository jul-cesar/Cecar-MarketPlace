package com.cecar.marketplace_catalog.admin;

import com.cecar.marketplace_catalog.domain.Listing;
import com.cecar.marketplace_catalog.domain.ListingStatus;
import com.cecar.marketplace_catalog.dto.listing.ListingDetailResponse;
import com.cecar.marketplace_catalog.exception.BadRequestException;
import com.cecar.marketplace_catalog.exception.ResourceNotFoundException;
import com.cecar.marketplace_catalog.mapper.ListingMapper;
import com.cecar.marketplace_catalog.repository.ListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public AdminListingService(ListingRepository listingRepository, ListingMapper listingMapper) {
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
    }

    @Transactional(readOnly = true)
    public Page<ListingDetailResponse> findAll(Pageable pageable) {
        return listingRepository.findAll(pageable)
                .map(listingMapper::toDetailResponse);
    }

    @Transactional(readOnly = true)
    public Page<ListingDetailResponse> findByStatus(ListingStatus status, Pageable pageable) {
        return listingRepository.findByStatus(status, pageable)
                .map(listingMapper::toDetailResponse);
    }

    @Transactional
    public ListingDetailResponse updateStatus(UUID id, String newStatus) {
        ListingStatus targetStatus;
        try {
            targetStatus = ListingStatus.valueOf(newStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + newStatus + ". Allowed: " +
                    Arrays.toString(ListingStatus.values()));
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        listing.setStatus(targetStatus);
        return listingMapper.toDetailResponse(listingRepository.save(listing));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        return Map.of(
                "total", listingRepository.count(),
                "active", listingRepository.countByStatus(ListingStatus.ACTIVE),
                "sold", listingRepository.countByStatus(ListingStatus.SOLD),
                "paused", listingRepository.countByStatus(ListingStatus.PAUSED),
                "removed", listingRepository.countByStatus(ListingStatus.REMOVED),
                "blocked", listingRepository.countByStatus(ListingStatus.BLOCKED)
        );
    }
}
