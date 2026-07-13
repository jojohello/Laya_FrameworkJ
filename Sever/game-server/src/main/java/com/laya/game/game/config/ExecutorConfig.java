package com.laya.game.game.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 线程池配置
 * 配置业务处理线程池和定时任务线程池
 *
 * 线程池设计：
 * 1. businessExecutor - 业务处理线程池（处理游戏逻辑）
 * 2. scheduledExecutor - 定时任务线程池（心跳、健康检查等）
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
@Configuration
@EnableAsync
@EnableScheduling
public class ExecutorConfig {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ExecutorConfig.class);

    /**
     * 业务处理线程池
     * 用于处理游戏逻辑、消息分发等
     *
     * 线程池参数：
     * - corePoolSize: 20 (核心线程数)
     * - maximumPoolSize: 100 (最大线程数)
     * - keepAliveTime: 60s (空闲线程存活时间)
     * - workQueue: LinkedBlockingQueue(2000) (工作队列容量)
     * - rejectedExecutionHandler: CallerRunsPolicy (拒绝策略)
     *
     * @return ExecutorService
     */
    @Bean(name = "businessExecutor")
    public ExecutorService businessExecutor() {
        log.info("初始化业务处理线程池...");
        ThreadPoolExecutor executor = new ThreadPoolExecutor(20,  // 核心线程数
        100,  // 最大线程数
        60L,  // 空闲线程存活时间
        TimeUnit.SECONDS,  // 时间单位
        new LinkedBlockingQueue<>(2000),  // 工作队列
        new NamedThreadFactory("business"),  // 线程工厂
        new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：调用者运行
        );
        // 允许核心线程超时
        executor.allowCoreThreadTimeOut(false);
        log.info("[OK] 业务处理线程池初始化完成: core={}, max={}, queue={}", executor.getCorePoolSize(), executor.getMaximumPoolSize(), executor.getQueue().remainingCapacity());
        return executor;
    }

    /**
     * 定时任务线程池
     * 用于心跳检测、健康检查等定时任务
     *
     * 线程池参数：
     * - corePoolSize: 10 (核心线程数)
     *
     * @return ScheduledExecutorService
     */
    @Bean(name = "scheduledExecutor")
    public ScheduledExecutorService scheduledExecutor() {
        log.info("初始化定时任务线程池...");
        ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(10,  // 核心线程数
        new NamedThreadFactory("scheduled") // 线程工厂
        );
        // 设置任务执行完毕后关闭线程池时的策略
        executor.setRemoveOnCancelPolicy(true);
        log.info("[OK] 定时任务线程池初始化完成: core={}", executor.getCorePoolSize());
        return executor;
    }


    /**
     * 自定义线程工厂
     * 为线程设置有意义的名称，方便调试
     */
    private static class NamedThreadFactory implements ThreadFactory {
        private final ThreadGroup group;
        private final String namePrefix;
        private final AtomicInteger threadNumber = new AtomicInteger(1);

        public NamedThreadFactory(String namePrefix) {
            this.group = Thread.currentThread().getThreadGroup();
            this.namePrefix = "game-" + namePrefix + "-";
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(group, r, namePrefix + threadNumber.getAndIncrement(), 0);
            // 设置为非守护线程
            if (t.isDaemon()) {
                t.setDaemon(false);
            }
            // 设置优先级为正常
            if (t.getPriority() != Thread.NORM_PRIORITY) {
                t.setPriority(Thread.NORM_PRIORITY);
            }
            return t;
        }
    }

    /**
     * JVM 关闭时的清理逻辑
     */
    @Bean
    public ExecutorShutdownHook executorShutdownHook(@Qualifier("businessExecutor") ExecutorService businessExecutor, @Qualifier("scheduledExecutor") ScheduledExecutorService scheduledExecutor) {
        return new ExecutorShutdownHook(businessExecutor, scheduledExecutor);
    }


    /**
     * 线程池关闭钩子
     * 确保应用关闭时优雅地关闭线程池
     */
    private static class ExecutorShutdownHook {
        private final ExecutorService businessExecutor;
        private final ScheduledExecutorService scheduledExecutor;

        public ExecutorShutdownHook(ExecutorService businessExecutor, ScheduledExecutorService scheduledExecutor) {
            this.businessExecutor = businessExecutor;
            this.scheduledExecutor = scheduledExecutor;
            // 注册 JVM 关闭钩子
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                log.info("开始关闭线程池...");
                // 关闭业务线程池
                shutdownExecutor(businessExecutor, "业务处理线程池");
                // 关闭定时任务线程池
                shutdownExecutor(scheduledExecutor, "定时任务线程池");
                log.info("[OK] 所有线程池已关闭");
            }));
        }

        private void shutdownExecutor(ExecutorService executor, String name) {
            try {
                executor.shutdown();
                if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                    log.warn("{} 未能在10秒内关闭，强制关闭", name);
                    executor.shutdownNow();
                } else {
                    log.info("[OK] {} 已关闭", name);
                }
            } catch (InterruptedException e) {
                log.error("{} 关闭异常", name, e);
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
