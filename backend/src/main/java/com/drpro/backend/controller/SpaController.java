package com.drpro.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Regex explanation: Match any path that does NOT contain a dot (.)
    // This allows /api, /images.jpg, /main.css to work normally.
    // But /patients, /calendar (which have no dots) will go to index.html
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect() {
        return "forward:/index.html";
    }
}