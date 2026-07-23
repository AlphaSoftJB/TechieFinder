package com.techiefinder.dto.auth;

import com.techiefinder.model.user.User;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocialLoginRequest {
    @NotBlank
    private String idToken;

    // Only used the very first time this identity signs up (i.e. when it
    // creates a new account); ignored on every later login. Apple never
    // includes a name in its ID token, so the client must pass one through
    // here from the one-time native authorization response if it wants one
    // recorded at all.
    private String firstName;
    private String lastName;

    private User.UserRole role = User.UserRole.USER;
}
