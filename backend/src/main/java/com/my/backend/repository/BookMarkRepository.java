package com.my.backend.repository;

import com.my.backend.entity.BookMark;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookMarkRepository extends JpaRepository<BookMark, Long> {
    Optional<BookMark> findByUserAndProduct(User user, Product product);
    List<BookMark> findAllByUser(User user);
    Long countByProduct(Product product);
}
