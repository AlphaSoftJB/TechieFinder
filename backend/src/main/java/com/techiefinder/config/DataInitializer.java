package com.techiefinder.config;

import com.techiefinder.model.technician.ServiceCategory;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.technician.ServiceCategoryRepository;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.default.email}")
    private String defaultAdminEmail;

    @Value("${admin.default.password}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        seedDefaultAdmin();

        if (serviceCategoryRepository.count() == 0) {
            List<ServiceCategory> categories = Arrays.asList(
                    ServiceCategory.builder()
                            .name("Plumbing")
                            .slug("plumbing")
                            .description("Professional plumbing services including repairs, installations, and maintenance")
                            .displayOrder(1)
                            .build(),
                    ServiceCategory.builder()
                            .name("Electrical")
                            .slug("electrical")
                            .description("Licensed electricians for wiring, repairs, and electrical installations")
                            .displayOrder(2)
                            .build(),
                    ServiceCategory.builder()
                            .name("Carpentry")
                            .slug("carpentry")
                            .description("Skilled carpenters for furniture, repairs, and woodwork")
                            .displayOrder(3)
                            .build(),
                    ServiceCategory.builder()
                            .name("Auto Mechanic")
                            .slug("auto-mechanic")
                            .description("Professional auto mechanics for vehicle repairs and maintenance")
                            .displayOrder(4)
                            .build(),
                    ServiceCategory.builder()
                            .name("HVAC")
                            .slug("hvac")
                            .description("Heating, ventilation, and air conditioning services")
                            .displayOrder(5)
                            .build(),
                    ServiceCategory.builder()
                            .name("Painting")
                            .slug("painting")
                            .description("Professional painting services for homes and offices")
                            .displayOrder(6)
                            .build(),
                    ServiceCategory.builder()
                            .name("Welding")
                            .slug("welding")
                            .description("Expert welding services for metal fabrication and repairs")
                            .displayOrder(7)
                            .build(),
                    ServiceCategory.builder()
                            .name("Cleaning")
                            .slug("cleaning")
                            .description("Professional cleaning services for homes and offices")
                            .displayOrder(8)
                            .build(),
                    ServiceCategory.builder()
                            .name("Appliance Repair")
                            .slug("appliance-repair")
                            .description("Repair services for home and kitchen appliances")
                            .displayOrder(9)
                            .build(),
                    ServiceCategory.builder()
                            .name("Generator Repair")
                            .slug("generator-repair")
                            .description("Generator installation, repair, and maintenance services")
                            .displayOrder(10)
                            .build()
            );

            serviceCategoryRepository.saveAll(categories);
            System.out.println("Service categories initialized successfully!");
        }
    }

    /**
     * Seeds exactly one ADMIN account so there's a way into the admin dashboard
     * on a fresh install -- ADMIN accounts can't be created through public
     * registration (see AuthService.register). Change these credentials via
     * ADMIN_EMAIL/ADMIN_PASSWORD before any real deployment; the defaults are
     * dev-only.
     */
    private void seedDefaultAdmin() {
        if (userRepository.existsByEmail(defaultAdminEmail)) {
            return;
        }

        User admin = User.builder()
                .email(defaultAdminEmail)
                .password(passwordEncoder.encode(defaultAdminPassword))
                .firstName("Platform")
                .lastName("Admin")
                .role(User.UserRole.ADMIN)
                .emailVerified(true)
                .phoneVerified(false)
                .build();
        admin = userRepository.save(admin);

        UserProfile profile = UserProfile.builder()
                .user(admin)
                .preferredLanguage("en")
                .notificationsEnabled(true)
                .smsNotificationsEnabled(true)
                .emailNotificationsEnabled(true)
                .build();
        admin.setProfile(profile);
        userRepository.save(admin);

        System.out.println("Seeded default admin account: " + defaultAdminEmail);
    }
}
