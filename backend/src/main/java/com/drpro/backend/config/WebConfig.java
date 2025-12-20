package com.drpro.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // We removed the addResourceHandlers method because 
    // FileController.java now handles image loading reliably.
}
























// package com.drpro.backend.config;

// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// import java.nio.file.Path;
// import java.nio.file.Paths;

// @Configuration
// public class WebConfig implements WebMvcConfigurer {

//     @Override
//     public void addResourceHandlers(ResourceHandlerRegistry registry) {
//         // 1. Get the path to the folder (Works on Win & Mac)
//         String homeDir = System.getProperty("user.home");
//         Path uploadDir = Paths.get(homeDir, "DrPro_Data", "uploads");

//         // 2. Get the absolute path as a clean string
//         String uploadPath = uploadDir.toFile().getAbsolutePath();

//         // 3. Format it correctly for Spring Boot based on OS
//         if (uploadPath.startsWith("/")) {
//             // Mac/Linux (Path starts with /Users/...)
//             uploadPath = "file:" + uploadPath;
//         } else {
//             // Windows (Path starts with C:\...)
//             // Must use "file:///" and forward slashes for stability
//             uploadPath = "file:///" + uploadPath.replace("\\", "/");
//         }

//         // 4. Ensure it ends with a slash (CRITICAL STEP)
//         if (!uploadPath.endsWith("/")) {
//             uploadPath += "/";
//         }

//         // 5. Register the path
//         registry.addResourceHandler("/uploads/**")
//                 .addResourceLocations(uploadPath);

//         System.out.println("==========================================");
//         System.out.println("✅ STATIC RESOURCES CONFIG LOADED");
//         System.out.println("📂 Serving files from: " + uploadPath);
//         System.out.println("==========================================");
//     }
// }







// package com.drpro.backend.config;

// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
// import java.nio.file.Paths;

// @Configuration
// public class WebConfig implements WebMvcConfigurer {

//     @Override
//     public void addResourceHandlers(ResourceHandlerRegistry registry) {
//         // 1. Get the path to the folder we created in FileStorageService
//         String homeDir = System.getProperty("user.home");
//         String uploadPath = Paths.get(homeDir, "DrPro_Data", "uploads").toUri().toString();

//         // 2. Ensure it ends with a slash so Spring can append filenames
//         if (!uploadPath.endsWith("/")) {
//             uploadPath += "/";
//         }

//         // 3. Tell Spring: "If anyone asks for /uploads/**, look in this folder"
//         registry.addResourceHandler("/uploads/**")
//                 .addResourceLocations(uploadPath);
                
//         System.out.println("📂 Serving files from: " + uploadPath);
//     }
// }
