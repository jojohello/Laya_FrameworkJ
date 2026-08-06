package com.jojohello_laya.login.service;

import com.fasterxml.jackson.databind.JsonNode;

/** Narrow provider boundary so authentication tests never need JVM instrumentation. */
public interface WechatCode2SessionClient {
    JsonNode exchange(String appId, String appSecret, String code) throws Exception;
}

