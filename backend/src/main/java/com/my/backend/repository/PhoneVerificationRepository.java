package com.my.backend.repository;

import com.my.backend.entity.PhoneVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhoneVerificationRepository extends JpaRepository<PhoneVerification, Long> {

    Optional<PhoneVerification> findTopByUserPhoneOrderByCreatedAtDesc(String userPhone);

    Optional<PhoneVerification> findByUserPhoneAndVerifiedTrue(String userPhone);

    List<PhoneVerification> findByUserPhoneAndVerifiedFalse(String userPhone);


}