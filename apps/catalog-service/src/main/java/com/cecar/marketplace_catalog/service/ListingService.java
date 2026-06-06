package com.cecar.marketplace_catalog.service;

import com.cecar.marketplace_catalog.domain.Category;
import com.cecar.marketplace_catalog.domain.Listing;
import com.cecar.marketplace_catalog.domain.ListingImage;
import com.cecar.marketplace_catalog.domain.ListingStatus;
import com.cecar.marketplace_catalog.dto.listing.CreateListingImageRequest;
import com.cecar.marketplace_catalog.dto.listing.CreateListingRequest;
import com.cecar.marketplace_catalog.dto.listing.ListingDetailResponse;
import com.cecar.marketplace_catalog.dto.listing.ListingSummaryResponse;
import com.cecar.marketplace_catalog.dto.listing.UpdateListingRequest;
import com.cecar.marketplace_catalog.exception.BadRequestException;
import com.cecar.marketplace_catalog.exception.ForbiddenOperationException;
import com.cecar.marketplace_catalog.exception.ResourceNotFoundException;
import com.cecar.marketplace_catalog.mapper.ListingMapper;
import com.cecar.marketplace_catalog.repository.CategoryRepository;
import com.cecar.marketplace_catalog.repository.ListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ListingService {

    private static final int MAX_IMAGE_COUNT = 5;

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final ListingMapper listingMapper;

    public ListingService(
            ListingRepository listingRepository,
            CategoryRepository categoryRepository,
            ListingMapper listingMapper
    ) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.listingMapper = listingMapper;
    }

    @Transactional(readOnly = true)
    public Page<ListingSummaryResponse> findActive(Pageable pageable) {
        return listingRepository.findByStatus(ListingStatus.ACTIVE, pageable)
                .map(listingMapper::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public Page<ListingSummaryResponse> findBySeller(String sellerId, Pageable pageable) {
        return listingRepository.findBySellerId(sellerId, pageable)
                .map(listingMapper::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public ListingDetailResponse findById(UUID id) {
        Listing listing = getListing(id);
        return listingMapper.toDetailResponse(listing);
    }

    @Transactional
    public ListingDetailResponse create(CreateListingRequest request, String sellerId) {
        validateImageCount(request.images());

        Listing listing = listingMapper.toEntity(request);
        listing.setSellerId(sellerId);
        listing.setCategories(resolveCategories(request.categoryIds()));
        replaceImages(listing, request.images());

        return listingMapper.toDetailResponse(listingRepository.save(listing));
    }

    @Transactional
    public ListingDetailResponse update(UUID id, UpdateListingRequest request, String sellerId) {
        validateImageCount(request.images());

        Listing listing = getListing(id);
        assertOwner(listing, sellerId);

        listingMapper.updateEntity(request, listing);

        if (request.categoryIds() != null) {
            listing.setCategories(resolveCategories(request.categoryIds()));
        }

        if (request.images() != null) {
            replaceImages(listing, request.images());
        }

        return listingMapper.toDetailResponse(listingRepository.save(listing));
    }

    @Transactional
    public void remove(UUID id, String sellerId) {
        Listing listing = getListing(id);
        assertOwner(listing, sellerId);

        listing.setStatus(ListingStatus.REMOVED);
        listing.setDeleted(true);
        listing.setDeletedAt(Instant.now());
        listingRepository.save(listing);
    }

    private Listing getListing(UUID id) {
        return listingRepository.findById(id)
                .filter(listing -> !listing.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }

    private void assertOwner(Listing listing, String sellerId) {
        if (!listing.getSellerId().equals(sellerId)) {
            throw new ForbiddenOperationException("Listing does not belong to current user");
        }
    }

    private Set<Category> resolveCategories(Set<UUID> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new BadRequestException("At least one category is required");
        }

        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new BadRequestException("One or more categories do not exist");
        }

        return new HashSet<>(categories);
    }

    private void replaceImages(Listing listing, List<CreateListingImageRequest> images) {
        listing.getImages().clear();

        if (images == null || images.isEmpty()) {
            return;
        }

        for (int index = 0; index < images.size(); index++) {
            CreateListingImageRequest req = images.get(index);
            ListingImage image = new ListingImage();
            image.setUrl(req.url());
            image.setName(req.name());
            image.setKey(req.key());
            image.setSortOrder(index);
            listing.addImage(image);
        }
    }

    private void validateImageCount(List<CreateListingImageRequest> images) {
        if (images != null && images.size() > MAX_IMAGE_COUNT) {
            throw new BadRequestException("A listing can have at most 5 images");
        }
    }
}
