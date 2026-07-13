package com.jojohello_laya.login.repository;

import com.jojohello_laya.login.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户数据访问接口
 *
 * @author laya-game
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 根据用户ID查找用户
     */
    Optional<User> findByUserId(String userId);

    /**
     * 根据第三方类型和第三方用户ID查找用户
     */
    Optional<User> findByThirdPartyTypeAndThirdPartyUserId(
            User.ThirdPartyType thirdPartyType,
            String thirdPartyUserId);

    /**
     * 检查用户ID是否存在
     */
    boolean existsByUserId(String userId);

    /**
     * 检查第三方用户是否存在
     */
    boolean existsByThirdPartyTypeAndThirdPartyUserId(
            User.ThirdPartyType thirdPartyType,
            String thirdPartyUserId);

    /**
     * 根据昵称查找用户
     */
    Optional<User> findByNickname(String nickname);

    /**
     * 统计指定第三方类型的用户数量
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.thirdPartyType = :type")
    long countByThirdPartyType(@Param("type") User.ThirdPartyType type);
}
