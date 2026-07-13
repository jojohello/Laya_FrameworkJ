@echo off
echo ========================================
echo 测试登录服务器HTTP请求
echo ========================================

echo.
echo 1. 测试健康检查...
curl -X GET http://localhost:8081/api/health

echo.
echo 2. 测试获取登录方式...
curl -X GET http://localhost:8081/api/login/methods

echo.
echo 3. 测试游客登录...
curl -X POST http://localhost:8081/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"GUEST\",\"authCode\":\"test_guest_code\",\"platform\":\"android\",\"deviceInfo\":\"iPhone 12\",\"version\":\"1.0.0\"}"

echo.
echo 4. 测试微信登录...
curl -X POST http://localhost:8081/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"WECHAT\",\"authCode\":\"test_wechat_code\",\"platform\":\"miniprogram\",\"deviceInfo\":\"WeChat\",\"version\":\"1.0.0\"}"

echo.
echo 5. 测试无效请求...
curl -X POST http://localhost:8081/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"WECHAT\",\"authCode\":\"invalid_code\",\"platform\":\"android\"}"

echo.
echo ========================================
echo 测试完成
echo ========================================
pause
