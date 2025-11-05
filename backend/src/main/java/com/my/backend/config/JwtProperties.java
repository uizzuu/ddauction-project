
package com.my.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
<<<<<<< HEAD
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
=======

@Getter
@Setter
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenExpiration;   // maps from access-token-expiration
    private long refreshTokenExpiration;  // maps from refresh-token-expiration
}
