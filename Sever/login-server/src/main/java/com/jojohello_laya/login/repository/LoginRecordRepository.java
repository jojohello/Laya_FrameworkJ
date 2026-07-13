package com.jojohello_laya.login.repository;

import com.jojohello_laya.login.entity.LoginRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 登录记录数据访问接口
 *
 * @author laya-game
 */
@Repository
public interface LoginRecordRepository extends JpaRepository<LoginRecord, Long> {

    /**
     * 根据Token查找登录记录
     */
    Optional<LoginRecord> findByToken(String token);

    /**
     * 根据用户ID查找最新的登录记录
     */
    Optional<LoginRecord> findFirstByUserIdOrderByLoginTimeDesc(String userId);

    /**
     * 根据用户ID查找所有登录记录
     */
    List<LoginRecord> findByUserIdOrderByLoginTimeDesc(String userId);

    /**
     * 查找活跃的登录记录
     */
    List<LoginRecord> findByIsActiveTrue();

    /**
     * 查找过期的登录记录
     */
    @Query("SELECT lr FROM LoginRecord lr WHERE lr.expireTime < :now")
    List<LoginRecord> findExpiredRecords(@Param("now") LocalDateTime now);

    /**
     * 根据用户ID和Token查找登录记录
     */
    Optional<LoginRecord> findByUserIdAndToken(String userId, String token);

    /**
     * 统计用户登录次数
     */
    @Query("SELECT COUNT(lr) FROM LoginRecord lr WHERE lr.userId = :userId")
    long countByUserId(@Param("userId") String userId);

    /**
     * 删除过期的登录记录
     */
    @Query("DELETE FROM LoginRecord lr WHERE lr.expireTime < :now")
    void deleteExpiredRecords(@Param("now") LocalDateTime now);
}
