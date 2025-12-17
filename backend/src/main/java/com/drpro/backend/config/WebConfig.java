package com.drpro.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Get the path to the folder we created in FileStorageService
        String homeDir = System.getProperty("user.home");
        String uploadPath = Paths.get(homeDir, "DrPro_Data", "uploads").toUri().toString();

        // 2. Ensure it ends with a slash so Spring can append filenames
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        // 3. Tell Spring: "If anyone asks for /uploads/**, look in this folder"
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
                
        System.out.println("📂 Serving files from: " + uploadPath);
    }
}
