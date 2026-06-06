package com.cecar.marketplace_catalog.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.cecar.marketplace_catalog.domain.ListingImage;
import com.cecar.marketplace_catalog.dto.listingImage.ListingImageResponse;

@Mapper(componentModel = "spring")
public interface ListingImageMapper {

    ListingImageResponse toResponse(ListingImage image);

    List<ListingImageResponse> toResponseList(List<ListingImage> images);
}
