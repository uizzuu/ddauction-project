//package com.my.backend.util;
//
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.stereotype.Component;
//
//@Slf4j
//@Component
//public class AuthUtil {
//    /**
//     * 현재 인증 컨텍스트에서 userId(Long)를 추출.
//     * - 현재 구현은 auth.getName()이 userId 문자열이라는 가정.
//     * - 만약 username이 들어오는 환경이라면, 별도 유틸/클레임 추출 로직으로 교체 필요.
//     */
//    public Long extractUserId(Authentication auth) {
//        if (auth == null || auth.getName() == null) return null;
//        try {
//            return Long.parseLong(auth.getName());
//        } catch (NumberFormatException e) {
//            log.error("Invalid userId in token: {}", auth.getName());
//            return null;
//        }
//    }
//
//    public Long extractUserId(UserDetails userDetails) {
//        if (userDetails == null || userDetails.getUsername() == null) {
//            throw new IllegalArgumentException("인증 정보가 없습니다.");
//        }
//        try {
//            return Long.parseLong(userDetails.getUsername());
//        } catch (NumberFormatException e) {
//            // 권장: CustomUserPrincipal 사용해 id를 직접 보관/반환
//            throw new IllegalArgumentException("인증 사용자 식별자가 올바르지 않습니다(숫자 아님).");
//        }
//    }
//
//}
package com.my.backend.util;

import com.my.backend.dto.auth.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthUtil {

    /**
     * SecurityContext에서 인증된 사용자의 userId(Long) 추출
     */
    public Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("인증 정보가 없습니다.");
        }

        return userDetails.getUserId();
    }
}

