package com.cecar.marketplace_catalog.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cecar.marketplace_catalog.dto.category.CategoryResponse;
import com.cecar.marketplace_catalog.exception.ResourceNotFoundException;
import com.cecar.marketplace_catalog.mapper.CategoryMapper;
import com.cecar.marketplace_catalog.repository.CategoryRepository;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    public List<CategoryResponse> findAll() {
        return categoryMapper.toResponseList(categoryRepository.findAll());
    }

    public CategoryResponse findById(UUID id) {
        return categoryRepository.findById(id)
                .map(categoryMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    public CategoryResponse findBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .map(categoryMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
