package com.example.realestate.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

  @GetMapping("/")
  public String index() {
    return "forward:/index.html";
  }

  @GetMapping("/{path:^(?!api|v3|swagger-ui|webjars)[^\\.]*}")
  public String forward() {
    return "forward:/index.html";
  }

  @GetMapping("/{path:^(?!api|v3|swagger-ui|webjars)[^\\.]*}/**")
  public String forwardDeep() {
    return "forward:/index.html";
  }
}
