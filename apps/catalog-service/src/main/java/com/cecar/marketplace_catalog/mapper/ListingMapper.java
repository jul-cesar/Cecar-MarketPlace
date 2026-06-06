package com.cecar.marketplace_catalog.mapper;

import java.util.Comparator;
import java.util.List;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.cecar.marketplace_catalog.domain.Listing;
import com.cecar.marketplace_catalog.domain.ListingImage;
import com.cecar.marketplace_catalog.dto.listing.CreateListingRequest;
import com.cecar.marketplace_catalog.dto.listing.ListingDetailResponse;
import com.cecar.marketplace_catalog.dto.listing.ListingSummaryResponse;
import com.cecar.marketplace_catalog.dto.listing.UpdateListingRequest;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class, ListingImageMapper.class})
public interface ListingMapper {

    @Mapping(target = "coverImageUrl", expression = "java(resolveCoverImageUrl(listing))")
    ListingSummaryResponse toSummaryResponse(Listing listing);

    ListingDetailResponse toDetailResponse(Listing listing);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "sellerId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "images", ignore = true)
    Listing toEntity(CreateListingRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "sellerId", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "images", ignore = true)
    void updateEntity(UpdateListingRequest request, @MappingTarget Listing listing);

    List<ListingSummaryResponse> toSummaryResponseList(List<Listing> listings);

    default String resolveCoverImageUrl(Listing listing) {
        if (listing.getImages() == null || listing.getImages().isEmpty()) {
            return null;
        }

        return listing.getImages().stream()
                .min(Comparator.comparing(ListingImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(ListingImage::getUrl)
                .orElse(null);
    }
}
