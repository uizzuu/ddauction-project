package com.my.backend.service;

import com.my.backend.dto.ImageDto;
import com.my.backend.entity.Image;
import com.my.backend.enums.ImageType;
import com.my.backend.repository.ImageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;

    // refId로 이미지 조회
    public List<ImageDto> getImagesByRefId(Long refId) {
        return imageRepository.findByRefId(refId)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // refId + imageType 조회 (상품, 유저, 리뷰 등 필터링)
    public List<ImageDto> getImagesByRefIdAndType(Long refId, ImageType imageType) {
        return imageRepository.findByRefIdAndImageType(refId, imageType)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 이미지 여러 개 저장
    @Transactional
    public List<ImageDto> saveImages(List<ImageDto> dtoList) {

        List<Image> images = dtoList.stream()
                .map(dto -> Image.builder()
                        .imagePath(dto.getImagePath())   // S3 URL
                        .imageType(dto.getImageType())   // PRODUCT / USER / REVIEW
                        .productType(dto.getProductType()) // PRODUCT일 때만
                        .refId(dto.getRefId())           // 대상 ID
                        .build()
                )
                .toList();

        List<Image> saved = imageRepository.saveAll(images);

        return saved.stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 이미지 삭제
    @Transactional
    public void deleteImage(Long imageId) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("이미지를 찾을 수 없습니다. imageId=" + imageId));

        imageRepository.delete(image);
    }
}
