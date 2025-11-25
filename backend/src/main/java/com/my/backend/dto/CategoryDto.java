package com.my.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryDto {
    private Long categoryId;
    private String name;

    public static CategoryDto fromEntity(Category category){
        return CategoryDto.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .build();
    }
    public Category toEntity() {
        return Category.builder()
                .categoryId(this.categoryId)
                .name(this.name)
                .build();
    }
}
