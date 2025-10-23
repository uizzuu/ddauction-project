package com.my.backend.repository;

import com.my.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 사용자 조회
    Optional<User> findByEmail(String email);

    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);

    // 닉네임 존재 확인
    boolean existsByNickName(String nickName);
    // 로그인 아이디(username)로 사용자 조회 (로그인 시 사용)
    Optional<User> findByUserName(String userName);

    // 로그인 아이디(username) 존재 여부 확인 (회원가입 시 중복 체크)
    boolean existsByUserName(String userName);

    // 이메일 포함 검색
    List<User> findByEmailContaining(String email);

    // 닉네임 포함 검색
    List<User> findByNickNameContaining(String nickName);

    // 이메일 + 닉네임 포함 검색
    List<User> findByEmailContainingAndNickNameContaining(String email, String nickName);
}
