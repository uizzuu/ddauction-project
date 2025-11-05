//package com.my.backend.repository.user;
//
//
//import com.my.backend.entity.User;
//import com.querydsl.jpa.impl.JPAQueryFactory;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Repository;
//
//import java.util.Optional;
//
//import static com.my.backend.entity.QUser.user;
//
//@Repository
//@RequiredArgsConstructor
//public class UserRepositoryImpl implements UserRepositoryCustom {
//
//    private final JPAQueryFactory jpaQueryFactory;
//
//    @Override
//    public boolean existsByUserName(String userName) {
//        Integer fetchOne = jpaQueryFactory
//                .selectOne()
//                .from(user)
//                .where(user.userName.eq(userName))
//                .fetchFirst(); // limit 1
//        return fetchOne != null;
//    }
//
//    @Override
//    public boolean existsByNickName(String nickName) {
//        Integer fetchOne = jpaQueryFactory
//                .selectOne()
//                .from(user)
//                .where(user.nickName.eq(nickName))
//                .fetchFirst();
//        return fetchOne != null;
//    }
//
//    @Override
//    public boolean existsByEmail(String email) {
//        Integer fetchOne = jpaQueryFactory
//                .selectOne()
//                .from(user)
//                .where(user.email.eq(email))
//                .fetchFirst();
//        return fetchOne != null;
//    }
//
//    @Override
//    public Optional<User> findByUserName(String userName) {
//        User foundUser = jpaQueryFactory
//                .selectFrom(user)
//                .where(user.userName.eq(userName))
//                .fetchOne();
//
//        return Optional.ofNullable(foundUser);
//    }
//
//    @Override
//    public Optional<User> findByEmail(String email) {
//        return jpaQueryFactory
//                .select(user)
//                .from(user)
//                .where(user.email.eq((email)))
//                .fetchOne();
//    }
//
//    @Override
//    public User findUserById(Long userId) {
//        return jpaQueryFactory
//                .select(user)
//                .from(user)
//                .where(user.userId.eq(userId))
//                .fetchOne();
//    }
//}
//
package com.my.backend.repository.user;


import com.my.backend.entity.User;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import static com.my.backend.entity.QUser.user;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public boolean existsByUserName(String userName) {
        Integer fetchOne = jpaQueryFactory
                .selectOne()
                .from(user)
                .where(user.userName.eq(userName))
                .fetchFirst(); // limit 1
        return fetchOne != null;
    }

    @Override
    public boolean existsByNickName(String nickName) {
        Integer fetchOne = jpaQueryFactory
                .selectOne()
                .from(user)
                .where(user.nickName.eq(nickName))
                .fetchFirst();
        return fetchOne != null;
    }

    @Override
    public boolean existsByEmail(String email) {
        Integer fetchOne = jpaQueryFactory
                .selectOne()
                .from(user)
                .where(user.email.eq(email))
                .fetchFirst();
        return fetchOne != null;
    }

    @Override
    public Optional<User> findByUserName(String userName) {
        User foundUser = jpaQueryFactory
                .selectFrom(user)
                .where(user.userName.eq(userName))
                .fetchOne();

        return Optional.ofNullable(foundUser);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        User foundUser = jpaQueryFactory
                .select(user)
                .from(user)
                .where(user.email.eq((email)))
                .fetchOne();

        return Optional.ofNullable(foundUser);
    }

    @Override
    public User findUserById(Long userId) {
        return jpaQueryFactory
                .select(user)
                .from(user)
                .where(user.userId.eq(userId))
                .fetchOne();
    }
}