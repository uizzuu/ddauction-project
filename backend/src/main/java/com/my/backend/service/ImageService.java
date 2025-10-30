package com.my.backend.service;

import com.my.backend.dto.ImageDto;
import com.my.backend.entity.Image;
import com.my.backend.entity.Product;
import com.my.backend.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;

    public List<ImageDto> getImagesByProductId(Long productId) {
        List<Image> images = imageRepository.findByProduct_ProductId(productId);

        return images.stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Image saveImage(ImageDto dto, Product product) {
        Image image = dto.toEntity(product); // Product FK 연결
        return imageRepository.save(image);
    }
}

