package com.my.backend.service;

import com.my.backend.dto.ImageDto;
import com.my.backend.entity.Image;
import com.my.backend.entity.Product;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final ProductRepository productRepository;

    // 특정 상품의 이미지 조회
    public List<ImageDto> getImagesByProductId(Long productId) {
        List<Image> images = imageRepository.findByProduct_ProductId(productId);
        return images.stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 이미지 저장 (S3 URL 받아서 DB에 저장)
    @Transactional
    public ImageDto saveImage(ImageDto dto) {
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다. productId=" + dto.getProductId()));

        Image image = Image.builder()
                .imagePath(dto.getImagePath())  // S3 URL
                .product(product)
                .build();

        Image saved = imageRepository.save(image);
        return ImageDto.fromEntity(saved);
    }

    // 이미지 삭제
    @Transactional
    public void deleteImage(Long imageId) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("이미지를 찾을 수 없습니다. imageId=" + imageId));

        imageRepository.delete(image);
    }
}

