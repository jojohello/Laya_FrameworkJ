package com.jojohello_laya.login.repository;

import com.jojohello_laya.login.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
     * 根据第三方类型和第三方用户ID查找用户
     */
    Optional<User> findByThirdPartyTypeAndThirdPartyUserId(
            User.ThirdPartyType thirdPartyType,
            String thirdPartyUserId);

}
