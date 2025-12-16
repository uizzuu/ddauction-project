package com.my.backend.repository;

import com.my.backend.entity.Image;
import com.my.backend.enums.ImageType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {

    // refId로 전체 이미지 조회
    List<Image> findByRefId(Long refId);

    // refId + imageType으로 조회 (선택)
    List<Image> findByRefIdAndImageType(Long refId, ImageType imageType);

    Optional<Image> findTopByRefIdAndImageTypeOrderByCreatedAtAsc(Long refId, ImageType imageType);

}
