package com.jojohello_laya.login.service;

import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class UserServiceTest {
    @Test
    void uniqueIdentityConflictReturnsTheWinningAccount() {
        User winner = User.builder()
                .userId("wechat_winner")
                .thirdPartyType(User.ThirdPartyType.WECHAT)
                .thirdPartyUserId("same-openid")
                .nickname("微信玩家")
                .avatar("https://example.invalid/avatar.png")
                .enabled(true)
                .build();

        IdentityRepositoryFake repositoryFake = new IdentityRepositoryFake(winner);
        UserRepository userRepository = repositoryFake.createProxy();
        UserService userService = new UserService(userRepository,
                new TransactionTemplate(new NoOpTransactionManager()));

        User resolved = userService.findOrCreateUser(
                "same-openid",
                User.ThirdPartyType.WECHAT,
                "test-device",
                "minigame",
                "1.0.0",
                null,
                "微信玩家",
                "https://example.invalid/avatar.png");

        assertSame(winner, resolved);
        assertEquals(2, repositoryFake.findCount);
        assertEquals(1, repositoryFake.flushCount);
        assertEquals(1, repositoryFake.saveCount);
    }

    private static final class IdentityRepositoryFake implements InvocationHandler {
        private final User winner;
        private int findCount;
        private int flushCount;
        private int saveCount;

        private IdentityRepositoryFake(User winner) {
            this.winner = winner;
        }

        private UserRepository createProxy() {
            return (UserRepository) Proxy.newProxyInstance(
                    UserRepository.class.getClassLoader(),
                    new Class<?>[] { UserRepository.class },
                    this);
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "findByThirdPartyTypeAndThirdPartyUserId" ->
                        findCount++ == 0 ? Optional.empty() : Optional.of(winner);
                case "saveAndFlush" -> {
                    flushCount++;
                    throw new DataIntegrityViolationException("duplicate platform identity");
                }
                case "save" -> {
                    saveCount++;
                    yield args[0];
                }
                case "toString" -> "IdentityRepositoryFake";
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }

    private static final class NoOpTransactionManager implements PlatformTransactionManager {
        @Override
        public TransactionStatus getTransaction(TransactionDefinition definition) {
            return new SimpleTransactionStatus();
        }

        @Override
        public void commit(TransactionStatus status) {
        }

        @Override
        public void rollback(TransactionStatus status) {
        }
    }
}
