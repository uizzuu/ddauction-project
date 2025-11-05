package com.my.backend.repository;

import com.my.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 사용자 조회
    Optional<User> findByEmail(String email);

    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);

    // 닉네임 존재 확인
    boolean existsByNickName(String nickName);

    // 이메일 포함 검색
    List<User> findByEmailContaining(String email);

    // 닉네임 포함 검색
    List<User> findByNickNameContaining(String nickName);

    // 이메일 + 닉네임 포함 검색
    List<User> findByEmailContainingAndNickNameContaining(String email, String nickName);

    // 이메일 + 전화번호로 사용자 조회
    Optional<User> findByEmailAndPhone(String email, String phone);
    Optional<User> findByPhoneAndUserName(String phone, String userName);

    Optional<User> findByEmailAndPhoneAndUserName(String email, String phone, String userName);
}
