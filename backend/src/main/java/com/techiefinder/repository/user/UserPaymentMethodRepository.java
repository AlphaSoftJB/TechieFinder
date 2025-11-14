package com.techiefinder.repository.user;

import com.techiefinder.model.user.UserPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPaymentMethodRepository extends JpaRepository<UserPaymentMethod, Long> {
    List<UserPaymentMethod> findByUserId(Long userId);
    Optional<UserPaymentMethod> findByUserIdAndIsDefaultTrue(Long userId);
}
