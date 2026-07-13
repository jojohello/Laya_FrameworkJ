# 使用OpenJDK 11作为基础镜像
FROM openjdk:11-jre-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC"
ENV SPRING_PROFILES_ACTIVE=prod

# 安装必要的软件包
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 复制Maven配置文件
COPY pom.xml .
COPY */pom.xml ./*/

# 复制源代码
COPY . .

# 编译项目
RUN apt-get update && apt-get install -y maven \
    && mvn clean package -Dmaven.test.skip=true \
    && apt-get remove -y maven \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# 创建启动脚本
RUN echo '#!/bin/bash\n\
case "$1" in\n\
  "gateway")\n\
    java $JAVA_OPTS -jar gateway-server/target/gateway-server-1.0.0.jar\n\
    ;;\n\
  "login")\n\
    java $JAVA_OPTS -jar login-server/target/login-server-1.0.0.jar\n\
    ;;\n\
  "game")\n\
    java $JAVA_OPTS -jar game-server/target/game-server-1.0.0.jar\n\
    ;;\n\
  "database")\n\
    java $JAVA_OPTS -jar database-server/target/database-server-1.0.0.jar\n\
    ;;\n\
  *)\n\
    echo "Usage: $0 {gateway|login|game|database}"\n\
    exit 1\n\
    ;;\n\
esac' > /app/start.sh && chmod +x /app/start.sh

# 暴露端口
EXPOSE 8080 8081 8082 8083

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 设置启动命令
ENTRYPOINT ["/app/start.sh"] 