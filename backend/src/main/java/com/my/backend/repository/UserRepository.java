package com.my.backend.repository;

import com.my.backend.entity.Users;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {

    // 이메일로 사용자 조회
    Optional<Users> findByEmail(String email);

    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);

    // 닉네임 존재 확인
    boolean existsByNickName(String nickName);

    // 이메일 포함 검색
    List<Users> findByEmailContaining(String email);

    // 닉네임 포함 검색
    List<Users> findByNickNameContaining(String nickName);

    // 이메일 + 닉네임 포함 검색
    List<Users> findByEmailContainingAndNickNameContaining(String email, String nickName);

    // 이메일 + 폰 사용자 조회
    Optional<Users> findByEmailAndPhone(String email, String phone);

    // 폰 + 이름 사용자 조회
    Optional<Users> findByPhoneAndUserName(String phone, String userName);

    // 이메일 + 폰 + 이름 사용자 조회
    Optional<Users> findByEmailAndPhoneAndUserName(String email, String phone, String userName);

    Optional<Users> findByPhone(String phone);
}
