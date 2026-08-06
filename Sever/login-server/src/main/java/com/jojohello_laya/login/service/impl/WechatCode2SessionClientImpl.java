package com.jojohello_laya.login.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.service.WechatCode2SessionClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class WechatCode2SessionClientImpl implements WechatCode2SessionClient {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${login.third-party.wechat.code2-session-url:https://api.weixin.qq.com/sns/jscode2session}")
    private String code2SessionUrl;

    public WechatCode2SessionClientImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode exchange(String appId, String appSecret, String code) throws Exception {
        URI uri = UriComponentsBuilder.fromUriString(code2SessionUrl)
                .queryParam("appid", appId)
                .queryParam("secret", appSecret)
                .queryParam("js_code", code)
                .queryParam("grant_type", "authorization_code")
                .build()
                .encode()
                .toUri();
        String body = restTemplate.getForObject(uri, String.class);
        if (!StringUtils.hasText(body)) throw new RestClientException("empty WeChat response");
        return objectMapper.readTree(body);
    }
}

