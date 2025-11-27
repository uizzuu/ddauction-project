package com.my.backend.service;

import com.my.backend.dto.auth.CustomOAuth2User;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.oauth2.OAuth2UserInfo;
import com.my.backend.oauth2.OAuth2UserInfoFactory;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    private static final String CHAR_POOL = "가나다라마바사아자차카타파하ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // 닉네임 랜덤 생성 (3~12자, 패턴 맞춤)
    private String generateValidNickName(String base) {
        String nick = base.replaceAll("[^가-힣a-zA-Z0-9]", ""); // 허용 문자만 남기기
        if (nick.length() < 3) {
            nick += randomString(3 - nick.length()); // 최소 길이 채우기
        } else if (nick.length() > 12) {
            nick = nick.substring(0, 12); // 최대 길이 제한
        }

        // 중복 처리
        while (userRepository.existsByNickName(nick)) {
            String suffix = randomString(3); // 랜덤 3글자 추가
            nick = nick.length() + suffix.length() > 12 ? nick.substring(0, 12 - suffix.length()) + suffix : nick + suffix;
        }
        return nick;
    }

    private String randomString(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(CHAR_POOL.charAt(random.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        System.out.println("🟢 CustomOAuth2UserService.loadUser() 호출됨!");  // ✅ 추가
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        System.out.println("OAuth2 registrationId: " + registrationId);
        System.out.println("OAuth2 attributes: " + oAuth2User.getAttributes());  // ✅ 추가

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId, oAuth2User.getAttributes());

        String email = userInfo.getEmail();
        String baseNickName = userInfo.getName() != null ? userInfo.getName() : "OAuthUser";
        String password = UUID.randomUUID().toString(); // 임의 비밀번호
        String phone = "010" + (int)(Math.random() * 1_0000_0000);
        LocalDateTime now = LocalDateTime.now();

        // ✅ 랜덤 및 패턴 맞춘 닉네임
        String nickName = generateValidNickName(baseNickName);
        String userName = nickName; // username에도 동일 적용

        Users user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(Users.builder()
                        .email(email)
                        .password(password)
                        .nickName(nickName)
                        .userName(userName)
                        .phone(phone)
                        .role(Role.USER)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()
                ));

        System.out.println("✅ CustomOAuth2User 생성 완료: userId=" + user.getUserId());  // ✅ 추가

        return new CustomOAuth2User(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name(),
                user.getNickName(),
                oAuth2User.getAttributes(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

    }

}
