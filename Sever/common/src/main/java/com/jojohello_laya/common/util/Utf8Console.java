package com.jojohello_laya.common.util;

import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

/**
 * 统一服务器标准输出与错误输出的字符编码。
 *
 * Windows 的原生编码通常是 GBK。仅依赖启动脚本的 JVM 参数会导致 IDE、
 * Maven 或直接运行 main 方法时中文日志乱码，因此服务入口必须主动初始化。
 */
public final class Utf8Console {

    private Utf8Console() {
    }

    public static void configure() {
        System.setOut(new PrintStream(
                new FileOutputStream(FileDescriptor.out), true, StandardCharsets.UTF_8));
        System.setErr(new PrintStream(
                new FileOutputStream(FileDescriptor.err), true, StandardCharsets.UTF_8));
    }
}
