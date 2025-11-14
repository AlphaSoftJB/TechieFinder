package com.techiefinder.dto.user;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String profileImageUrl;
}
