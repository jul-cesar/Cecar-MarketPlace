package com.cecar.marketplace_catalog.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.cecar.marketplace_catalog.domain.Category;
import com.cecar.marketplace_catalog.dto.category.CategoryResponse;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);
}
