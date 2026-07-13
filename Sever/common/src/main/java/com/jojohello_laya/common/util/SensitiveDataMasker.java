package com.jojohello_laya.common.util;

/**
 * 敏感数据脱敏工具类
 *
 * 用于日志输出时脱敏敏感信息，防止密码、Token等泄露
 *
 * @author laya-game
 */
public class SensitiveDataMasker {

    /**
     * 脱敏Token：只保留前8位和后4位
     *
     * @param token JWT Token或其他敏感Token
     * @return 脱敏后的Token字符串
     */
    public static String maskToken(String token) {
        if (token == null || token.isEmpty()) {
            return "***";
        }

        if (token.length() <= 12) {
            return "***";
        }

        return token.substring(0, 8) + "..." + token.substring(token.length() - 4);
    }

    /**
     * 脱敏密码：完全隐藏
     *
     * @param password 密码
     * @return "******"
     */
    public static String maskPassword(String password) {
        return password == null || password.isEmpty() ? "" : "******";
    }

    /**
     * 脱敏手机号：保留前3位和后4位
     *
     * @param phone 手机号
     * @return 脱敏后的手机号
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return "***";
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /**
     * 脱敏邮箱：保留@前1位和@后全部
     *
     * @param email 邮箱地址
     * @return 脱敏后的邮箱
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }

        int atIndex = email.indexOf("@");
        if (atIndex == 0) {
            return "***" + email.substring(atIndex);
        }

        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    /**
     * 脱敏身份证号：保留前6位和后4位
     *
     * @param idCard 身份证号
     * @return 脱敏后的身份证号
     */
    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 10) {
            return "***";
        }

        if (idCard.length() == 15) {
            return idCard.substring(0, 6) + "*****" + idCard.substring(11);
        } else if (idCard.length() == 18) {
            return idCard.substring(0, 6) + "********" + idCard.substring(14);
        }

        return "***";
    }

    /**
     * 通用脱敏：保留前后各n位
     *
     * @param data 需要脱敏的数据
     * @param prefixLen 保留前缀长度
     * @param suffixLen 保留后缀长度
     * @return 脱敏后的数据
     */
    public static String mask(String data, int prefixLen, int suffixLen) {
        if (data == null || data.isEmpty()) {
            return "***";
        }

        int totalLen = prefixLen + suffixLen;
        if (data.length() <= totalLen) {
            return "***";
        }

        String prefix = data.substring(0, prefixLen);
        String suffix = data.substring(data.length() - suffixLen);
        int maskLen = data.length() - totalLen;
        String mask = "*".repeat(Math.min(maskLen, 8)); // 最多显示8个星号

        return prefix + mask + suffix;
    }
}
