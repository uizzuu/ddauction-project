package com.my.backend.service;

import com.my.backend.dto.ProductQnaDto;
import com.my.backend.entity.ProductQna;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType;
import com.my.backend.repository.ProductQnaRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductQnaService {

    private final ProductQnaRepository productQnaRepository;
    private final UserRepository userRepository;

    // 전체 문의 조회
    public List<ProductQnaDto> getAllProductQnas() {
        return productQnaRepository.findAll().stream()
                .map(ProductQnaDto::fromEntity)
                .toList();
    }

    // 페이징 조회
    public Page<ProductQnaDto> getProductQnaPage(Pageable pageable) {
        return productQnaRepository.findAll(pageable)
                .map(ProductQnaDto::fromEntity);
    }

    // 단건 조회
    public ProductQnaDto getOneProductQna(Long id) {
        ProductQna productQna = productQnaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("문의를 찾을 수 없습니다. id=" + id));
        return ProductQnaDto.fromEntity(productQna);
    }

    // 사용자별 문의 조회
    public List<ProductQnaDto> getProductQnasByUserId(Long userId) {
        return productQnaRepository.findByUserUserId(userId).stream()
                .map(ProductQnaDto::fromEntity)
                .toList();
    }

    // 상품 타입별 문의 조회
    public List<ProductQnaDto> getProductQnasByType(ProductType productType) {
        return productQnaRepository.findByProductType(productType).stream()
                .map(ProductQnaDto::fromEntity)
                .toList();
    }

    // refId로 문의 조회 (특정 상품에 대한 모든 문의)
    public List<ProductQnaDto> getProductQnasByRefId(Long refId) {
        return productQnaRepository.findByRefId(refId).stream()
                .map(ProductQnaDto::fromEntity)
                .toList();
    }

    // refId + ProductType으로 문의 조회
    public List<ProductQnaDto> getProductQnasByRefIdAndType(Long refId, ProductType productType) {
        return productQnaRepository.findByRefIdAndProductType(refId, productType).stream()
                .map(ProductQnaDto::fromEntity)
                .toList();
    }

    // 문의 등록
    @Transactional
    public ProductQnaDto insertProductQna(ProductQnaDto productQnaDto) {
        if (productQnaDto.getProductType() == null) {
            throw new IllegalArgumentException("상품 타입은 필수입니다.");
        }

        if (productQnaDto.getRefId() == null) {
            throw new IllegalArgumentException("상품 참조 ID는 필수입니다.");
        }

        Users user = userRepository.findById(productQnaDto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + productQnaDto.getUserId()));

        ProductQna productQna = productQnaDto.toEntity(user);
        ProductQna saved = productQnaRepository.save(productQna);
        return ProductQnaDto.fromEntity(saved);
    }

    // 문의 수정
    @Transactional
    public ProductQnaDto updateProductQna(Long id, ProductQnaDto productQnaDto) {
        ProductQna productQna = productQnaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("문의를 찾을 수 없습니다. id=" + id));

        productQna.setTitle(productQnaDto.getTitle());
        productQna.setContent(productQnaDto.getContent());

        if (productQnaDto.getProductType() != null) {
            productQna.setProductType(productQnaDto.getProductType());
        }

        if (productQnaDto.getRefId() != null) {
            productQna.setRefId(productQnaDto.getRefId());
        }

        ProductQna updated = productQnaRepository.save(productQna);
        return ProductQnaDto.fromEntity(updated);
    }

    // 문의 삭제
    @Transactional
    public void deleteProductQna(Long id) {
        if (!productQnaRepository.existsById(id)) {
            throw new EntityNotFoundException("문의를 찾을 수 없습니다. id=" + id);
        }
        productQnaRepository.deleteById(id);
    }
}