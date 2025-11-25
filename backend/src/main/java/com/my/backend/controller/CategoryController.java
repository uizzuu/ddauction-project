package com.my.backend.controller;

import com.my.backend.dto.CategoryDto;
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
        System.out.println("🟢 getAllCategories 호출됨");

        List<Category> categories = categoryRepository.findAll();
        System.out.println("🟢 categories.size=" + categories.size());

        List<CategoryDto> dtos = categories.stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());

        System.out.println("🟢 dtos.size=" + dtos.size());
        return dtos;
    }
    @GetMapping("/{id}")
    public CategoryDto getCategoryById(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다."));
        return CategoryDto.fromEntity(category);
    }

}