package com.techiefinder.security.social;

import com.techiefinder.model.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * The identity extracted from a verified Google/Apple ID token -- everything
 * SocialAuthService needs to find-or-create the matching local User.
 */
@Getter
@AllArgsConstructor
public class SocialIdentity {
    private final User.AuthProvider provider;
    private final String subject;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final boolean emailVerified;
}
