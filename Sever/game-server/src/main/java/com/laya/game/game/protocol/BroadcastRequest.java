package com.laya.game.game.protocol;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 广播请求
 * Game Server → Gateway 的广播请求格式
 *
 * 消息格式：
 * {
 *   "targetUsers": ["user1", "user2", "user3"],
 *   "message": {
 *     "type": "GAME_STATE_UPDATE",
 *     "message": "游戏状态更新",
 *     "data": { ... }
 *   },
 *   "broadcastType": "TO_USERS"
 * }
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public class BroadcastRequest implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 目标用户列表
     * 消息将发送给这些用户
     */
    private List<String> targetUsers;
    /**
     * 要发送的消息
     */
    private GameMessage message;
    /**
     * 广播类型（可选）
     * 如果为空，默认为 TO_USERS
     *
     * @see BroadcastType
     */
    private BroadcastType broadcastType;
    /**
     * 房间ID（可选）
     * 当 broadcastType 为 TO_ROOM 时使用
     */
    private String roomId;

    /**
     * 创建发送给单个用户的请求
     *
     * @param userId 用户ID
     * @param message 消息
     * @return 广播请求
     */
    public static BroadcastRequest toUser(String userId, GameMessage message) {
        return BroadcastRequest.builder().targetUsers(Collections.singletonList(userId)).message(message).broadcastType(BroadcastType.TO_USERS).build();
    }

    /**
     * 创建发送给多个用户的请求
     *
     * @param userIds 用户ID列表
     * @param message 消息
     * @return 广播请求
     */
    public static BroadcastRequest toUsers(List<String> userIds, GameMessage message) {
        return BroadcastRequest.builder().targetUsers(userIds).message(message).broadcastType(BroadcastType.TO_USERS).build();
    }

    /**
     * 创建发送给房间所有玩家的请求
     *
     * @param roomId 房间ID
     * @param userIds 房间玩家ID列表
     * @param message 消息
     * @return 广播请求
     */
    public static BroadcastRequest toRoom(String roomId, List<String> userIds, GameMessage message) {
        return BroadcastRequest.builder().roomId(roomId).targetUsers(userIds).message(message).broadcastType(BroadcastType.TO_ROOM).build();
    }

    /**
     * 创建全服广播请求（慎用）
     *
     * @param userIds 所有在线用户ID列表
     * @param message 消息
     * @return 广播请求
     */
    public static BroadcastRequest toAll(List<String> userIds, GameMessage message) {
        return BroadcastRequest.builder().targetUsers(userIds).message(message).broadcastType(BroadcastType.TO_ALL).build();
    }

    @Override
    public String toString() {
        return "BroadcastRequest{" + "targetUsers=" + (targetUsers != null ? targetUsers.size() + " users" : "null") + ", message=" + message + ", broadcastType=" + broadcastType + ", roomId=\'" + roomId + '\'' + '}';
    }

    @java.lang.SuppressWarnings("all")
    private static BroadcastType $default$broadcastType() {
        return BroadcastType.TO_USERS;
    }


    @java.lang.SuppressWarnings("all")
    public static class BroadcastRequestBuilder {
        @java.lang.SuppressWarnings("all")
        private List<String> targetUsers;
        @java.lang.SuppressWarnings("all")
        private GameMessage message;
        @java.lang.SuppressWarnings("all")
        private boolean broadcastType$set;
        @java.lang.SuppressWarnings("all")
        private BroadcastType broadcastType$value;
        @java.lang.SuppressWarnings("all")
        private String roomId;

        @java.lang.SuppressWarnings("all")
        BroadcastRequestBuilder() {
        }

        /**
         * 目标用户列表
         * 消息将发送给这些用户
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public BroadcastRequest.BroadcastRequestBuilder targetUsers(final List<String> targetUsers) {
            this.targetUsers = targetUsers;
            return this;
        }

        /**
         * 要发送的消息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public BroadcastRequest.BroadcastRequestBuilder message(final GameMessage message) {
            this.message = message;
            return this;
        }

        /**
         * 广播类型（可选）
         * 如果为空，默认为 TO_USERS
         *
         * @see BroadcastType
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public BroadcastRequest.BroadcastRequestBuilder broadcastType(final BroadcastType broadcastType) {
            this.broadcastType$value = broadcastType;
            broadcastType$set = true;
            return this;
        }

        /**
         * 房间ID（可选）
         * 当 broadcastType 为 TO_ROOM 时使用
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public BroadcastRequest.BroadcastRequestBuilder roomId(final String roomId) {
            this.roomId = roomId;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public BroadcastRequest build() {
            BroadcastType broadcastType$value = this.broadcastType$value;
            if (!this.broadcastType$set) broadcastType$value = BroadcastRequest.$default$broadcastType();
            return new BroadcastRequest(this.targetUsers, this.message, broadcastType$value, this.roomId);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "BroadcastRequest.BroadcastRequestBuilder(targetUsers=" + this.targetUsers + ", message=" + this.message + ", broadcastType$value=" + this.broadcastType$value + ", roomId=" + this.roomId + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static BroadcastRequest.BroadcastRequestBuilder builder() {
        return new BroadcastRequest.BroadcastRequestBuilder();
    }

    /**
     * 目标用户列表
     * 消息将发送给这些用户
     */
    @java.lang.SuppressWarnings("all")
    public List<String> getTargetUsers() {
        return this.targetUsers;
    }

    /**
     * 要发送的消息
     */
    @java.lang.SuppressWarnings("all")
    public GameMessage getMessage() {
        return this.message;
    }

    /**
     * 广播类型（可选）
     * 如果为空，默认为 TO_USERS
     *
     * @see BroadcastType
     */
    @java.lang.SuppressWarnings("all")
    public BroadcastType getBroadcastType() {
        return this.broadcastType;
    }

    /**
     * 房间ID（可选）
     * 当 broadcastType 为 TO_ROOM 时使用
     */
    @java.lang.SuppressWarnings("all")
    public String getRoomId() {
        return this.roomId;
    }

    /**
     * 目标用户列表
     * 消息将发送给这些用户
     */
    @java.lang.SuppressWarnings("all")
    public void setTargetUsers(final List<String> targetUsers) {
        this.targetUsers = targetUsers;
    }

    /**
     * 要发送的消息
     */
    @java.lang.SuppressWarnings("all")
    public void setMessage(final GameMessage message) {
        this.message = message;
    }

    /**
     * 广播类型（可选）
     * 如果为空，默认为 TO_USERS
     *
     * @see BroadcastType
     */
    @java.lang.SuppressWarnings("all")
    public void setBroadcastType(final BroadcastType broadcastType) {
        this.broadcastType = broadcastType;
    }

    /**
     * 房间ID（可选）
     * 当 broadcastType 为 TO_ROOM 时使用
     */
    @java.lang.SuppressWarnings("all")
    public void setRoomId(final String roomId) {
        this.roomId = roomId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof BroadcastRequest)) return false;
        final BroadcastRequest other = (BroadcastRequest) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$targetUsers = this.getTargetUsers();
        final java.lang.Object other$targetUsers = other.getTargetUsers();
        if (this$targetUsers == null ? other$targetUsers != null : !this$targetUsers.equals(other$targetUsers)) return false;
        final java.lang.Object this$message = this.getMessage();
        final java.lang.Object other$message = other.getMessage();
        if (this$message == null ? other$message != null : !this$message.equals(other$message)) return false;
        final java.lang.Object this$broadcastType = this.getBroadcastType();
        final java.lang.Object other$broadcastType = other.getBroadcastType();
        if (this$broadcastType == null ? other$broadcastType != null : !this$broadcastType.equals(other$broadcastType)) return false;
        final java.lang.Object this$roomId = this.getRoomId();
        final java.lang.Object other$roomId = other.getRoomId();
        if (this$roomId == null ? other$roomId != null : !this$roomId.equals(other$roomId)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof BroadcastRequest;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $targetUsers = this.getTargetUsers();
        result = result * PRIME + ($targetUsers == null ? 43 : $targetUsers.hashCode());
        final java.lang.Object $message = this.getMessage();
        result = result * PRIME + ($message == null ? 43 : $message.hashCode());
        final java.lang.Object $broadcastType = this.getBroadcastType();
        result = result * PRIME + ($broadcastType == null ? 43 : $broadcastType.hashCode());
        final java.lang.Object $roomId = this.getRoomId();
        result = result * PRIME + ($roomId == null ? 43 : $roomId.hashCode());
        return result;
    }

    @java.lang.SuppressWarnings("all")
    public BroadcastRequest() {
        this.broadcastType = BroadcastRequest.$default$broadcastType();
    }

    @java.lang.SuppressWarnings("all")
    public BroadcastRequest(final List<String> targetUsers, final GameMessage message, final BroadcastType broadcastType, final String roomId) {
        this.targetUsers = targetUsers;
        this.message = message;
        this.broadcastType = broadcastType;
        this.roomId = roomId;
    }
}
