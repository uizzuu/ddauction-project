package com.my.backend.repository.user;


import com.my.backend.entity.User;

import java.util.Optional;


public interface UserRepositoryCustom {

    boolean existsByUserName(String userName);

    boolean existsByNickName(String nickName);

    boolean existsByEmail(String email);

    Optional<User> findByUserName(String userName);

    Optional<User> findByEmail(String email);

    User findUserById(Long userId);

}
