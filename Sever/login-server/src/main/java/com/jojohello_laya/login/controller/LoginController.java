package com.jojohello_laya.login.controller;

import com.jojohello_laya.login.model.LoginRequest;
import com.jojohello_laya.login.model.LoginResponse;
import com.jojohello_laya.login.service.LoginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * 登录控制器
 * 
 * @author laya-game
 */
@RestController
@RequestMapping("/api")
public class LoginController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoginController.class);
    private final LoginService loginService;

    /**
     * 用户登录
     * 
     * @param request 登录请求
     * @param httpRequest HTTP请求对象
     * @return 登录响应
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        log.info("收到登录请求: {}", request);
        // 获取客户端IP
        String clientIp = getClientIp(httpRequest);
        request.setClientIp(clientIp);
        // 处理登录
        LoginResponse response = loginService.login(request);
        if (response.isSuccess()) {
            log.info("登录成功: userId={}", response.getUserId());
            return ResponseEntity.ok(response);
        } else {
            log.warn("登录失败: errorCode={}, errorMessage={}", response.getErrorCode(), response.getErrorMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Login Server is running!");
    }

    /**
     * 获取支持的登录方式
     */
    @GetMapping("/login/methods")
    public ResponseEntity<Object> getLoginMethods() {
        return ResponseEntity.ok(new Object() {
            public final String[] methods = {"guest", "wechat", "qq", "alipay"};
            public final String message = "支持的登录方式";
        });
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    @java.lang.SuppressWarnings("all")
    public LoginController(final LoginService loginService) {
        this.loginService = loginService;
    }
}
