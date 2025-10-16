package com.my.backend.controller;

import com.my.backend.dto.CategoryDto;
import com.my.backend.entity.Category;
import com.my.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
    }
}