package com.laya.game.central.repository;

import com.laya.game.central.model.GatewayAllocation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Map;

/**
 * 网关分配数据访问层
 * 
 * 提供网关分配相关的Redis操作，支持30秒超时回收机制
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Repository
public class GatewayAllocationRepository {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String ALLOCATION_KEY_PREFIX = "gateway_allocation:";
    private static final String USER_ALLOCATION_KEY_PREFIX = "user_allocation:";
    private static final String GATEWAY_ALLOCATIONS_KEY_PREFIX = "gateway_allocations:";
    private static final String ALL_ALLOCATIONS_KEY = "all_allocations";
    private static final long DEFAULT_TIMEOUT = 1; // 1小时

    /**
     * 保存网关分配
     */
    public GatewayAllocation save(GatewayAllocation allocation) {
        // 如果ID为空，生成新ID
        if (allocation.getId() == null) {
            allocation.setId(System.currentTimeMillis());
        }

        String allocationKey = ALLOCATION_KEY_PREFIX + allocation.getId();
        String userAllocationKey = USER_ALLOCATION_KEY_PREFIX + allocation.getUserId();
        String gatewayAllocationsKey = GATEWAY_ALLOCATIONS_KEY_PREFIX + allocation.getGatewayAddress();

        // 保存分配对象
        redisTemplate.opsForValue().set(allocationKey, allocation, DEFAULT_TIMEOUT, TimeUnit.HOURS);

        // 建立用户到分配的映射
        redisTemplate.opsForValue().set(userAllocationKey, allocation.getId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);

        // 添加到网关分配集合
        redisTemplate.opsForSet().add(gatewayAllocationsKey, allocation.getId());
        redisTemplate.expire(gatewayAllocationsKey, DEFAULT_TIMEOUT, TimeUnit.HOURS);

        // 添加到所有分配集合
        redisTemplate.opsForSet().add(ALL_ALLOCATIONS_KEY, allocation.getId());

        return allocation;
    }

    /**
     * 根据ID查找分配
     */
    public Optional<GatewayAllocation> findById(Long id) {
        String allocationKey = ALLOCATION_KEY_PREFIX + id;
        GatewayAllocation allocation = (GatewayAllocation) redisTemplate.opsForValue().get(allocationKey);
        return Optional.ofNullable(allocation);
    }

    /**
     * 根据用户ID查找分配记录
     */
    public Optional<GatewayAllocation> findByUserId(String userId) {
        String userAllocationKey = USER_ALLOCATION_KEY_PREFIX + userId;
        Long allocationId = (Long) redisTemplate.opsForValue().get(userAllocationKey);
        
        if (allocationId == null) {
            return Optional.empty();
        }
        
        return findById(allocationId);
    }

    /**
     * 根据用户ID和状态查找分配记录
     */
    public Optional<GatewayAllocation> findByUserIdAndStatus(String userId, GatewayAllocation.AllocationStatus status) {
        Optional<GatewayAllocation> allocationOpt = findByUserId(userId);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            if (allocation.getStatus() == status) {
                return Optional.of(allocation);
            }
        }
        return Optional.empty();
    }

    /**
     * 根据网关地址查找所有分配
     */
    public List<GatewayAllocation> findByGatewayAddress(String gatewayAddress) {
        String gatewayAllocationsKey = GATEWAY_ALLOCATIONS_KEY_PREFIX + gatewayAddress;
        Set<Object> allocationIds = redisTemplate.opsForSet().members(gatewayAllocationsKey);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    /**
     * 根据状态查找分配
     */
    public List<GatewayAllocation> findByStatus(GatewayAllocation.AllocationStatus status) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> allocation.getStatus() == status)
                .collect(Collectors.toList());
    }

    /**
     * 查找超时的分配（30秒未确认连接）
     */
    public List<GatewayAllocation> findTimeoutAllocations(LocalDateTime cutoffTime) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED
                        && allocation.getAllocatedAt().isBefore(cutoffTime))
                .collect(Collectors.toList());
    }

    /**
     * 查找需要回收的分配
     */
    public List<GatewayAllocation> findAllocationsToRecycle(LocalDateTime cutoffTime) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> {
                    if (allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED) {
                        return allocation.getAllocatedAt().isBefore(cutoffTime);
                    } else if (allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED) {
                        return allocation.getConnectedAt() != null && allocation.getConnectedAt().isBefore(cutoffTime);
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    /**
     * 统计网关的活跃连接数
     */
    public long countActiveConnectionsByGateway(String gatewayAddress) {
        return findByGatewayAddress(gatewayAddress).stream()
                .filter(allocation -> allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED)
                .count();
    }

    /**
     * 统计指定状态的分配数量
     */
    public long countByStatus(GatewayAllocation.AllocationStatus status) {
        return findByStatus(status).size();
    }

    /**
     * 删除分配
     */
    public void delete(GatewayAllocation allocation) {
        String allocationKey = ALLOCATION_KEY_PREFIX + allocation.getId();
        String userAllocationKey = USER_ALLOCATION_KEY_PREFIX + allocation.getUserId();
        String gatewayAllocationsKey = GATEWAY_ALLOCATIONS_KEY_PREFIX + allocation.getGatewayAddress();
        
        redisTemplate.delete(allocationKey);
        redisTemplate.delete(userAllocationKey);
        redisTemplate.opsForSet().remove(gatewayAllocationsKey, allocation.getId());
        redisTemplate.opsForSet().remove(ALL_ALLOCATIONS_KEY, allocation.getId());
    }

    /**
     * 根据ID删除
     */
    public void deleteById(Long id) {
        Optional<GatewayAllocation> allocationOpt = findById(id);
        if (allocationOpt.isPresent()) {
            delete(allocationOpt.get());
        }
    }

    /**
     * 检查分配是否存在
     */
    public boolean existsById(Long id) {
        String allocationKey = ALLOCATION_KEY_PREFIX + id;
        return Boolean.TRUE.equals(redisTemplate.hasKey(allocationKey));
    }

    /**
     * 检查用户是否已有分配
     */
    public boolean existsByUserId(String userId) {
        String userAllocationKey = USER_ALLOCATION_KEY_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(userAllocationKey));
    }

    /**
     * 统计总分配数
     */
    public long count() {
        Long size = redisTemplate.opsForSet().size(ALL_ALLOCATIONS_KEY);
        return size != null ? size : 0;
    }

    /**
     * 延长分配过期时间
     */
    public void extendExpiry(String userId, GatewayAllocation.AllocationStatus status, LocalDateTime newExpiryTime) {
        Optional<GatewayAllocation> allocationOpt = findByUserIdAndStatus(userId, status);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            allocation.setExpiresAt(newExpiryTime);
            save(allocation);
        }
    }

    /**
     * 清理旧记录
     */
    public void cleanupOldRecords(List<GatewayAllocation.AllocationStatus> statuses, LocalDateTime cutoffTime) {
        Set<String> keysToDelete = new HashSet<>();
        
        // 遍历所有状态的键
        for (GatewayAllocation.AllocationStatus status : statuses) {
            String pattern = ALLOCATION_KEY_PREFIX + "*:" + status.name();
            Set<String> statusKeys = redisTemplate.keys(pattern);
            
            if (statusKeys != null) {
                for (String key : statusKeys) {
                    GatewayAllocation allocation = (GatewayAllocation) redisTemplate.opsForValue().get(key);
                    if (allocation != null && allocation.getAllocatedAt() != null && 
                        allocation.getAllocatedAt().isBefore(cutoffTime)) {
                        keysToDelete.add(key);
                    }
                }
            }
        }
        
        // 批量删除
        if (!keysToDelete.isEmpty()) {
            redisTemplate.delete(keysToDelete);
        }
    }

    /**
     * 查找过期的分配
     */
    public List<GatewayAllocation> findExpiredAllocations(LocalDateTime cutoffTime, List<GatewayAllocation.AllocationStatus> statuses) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> {
                    if (!statuses.contains(allocation.getStatus())) {
                        return false;
                    }
                    
                    // 检查是否过期
                    if (allocation.getExpiresAt() != null && allocation.getExpiresAt().isBefore(cutoffTime)) {
                        return true;
                    }
                    
                    // 检查分配时间是否超时（30秒未连接）
                    if (allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED &&
                        allocation.getAllocatedAt() != null &&
                        allocation.getAllocatedAt().plusSeconds(30).isBefore(cutoffTime)) {
                        return true;
                    }
                    
                    return false;
                })
                .collect(Collectors.toList());
    }

    /**
     * 回收过期的分配
     */
    public void recycleExpiredAllocations(LocalDateTime cutoffTime, List<GatewayAllocation.AllocationStatus> fromStatuses, GatewayAllocation.AllocationStatus toStatus) {
        List<GatewayAllocation> expiredAllocations = findExpiredAllocations(cutoffTime, fromStatuses);
        
        for (GatewayAllocation allocation : expiredAllocations) {
            allocation.setStatus(toStatus);
            allocation.setLastModifiedDate(LocalDateTime.now());
            save(allocation);
        }
    }

    /**
     * 查找即将过期的分配
     */
    public List<GatewayAllocation> findAllocationsNearExpiry(LocalDateTime startTime, LocalDateTime endTime, GatewayAllocation.AllocationStatus status) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> {
                    if (allocation.getStatus() != status) {
                        return false;
                    }
                    
                    // 检查过期时间是否在指定范围内
                    if (allocation.getExpiresAt() != null) {
                        return allocation.getExpiresAt().isAfter(startTime) && 
                               allocation.getExpiresAt().isBefore(endTime);
                    }
                    
                    return false;
                })
                .collect(Collectors.toList());
    }

    /**
     * 根据用户ID查找分配记录，按分配时间倒序排列
     */
    public List<GatewayAllocation> findByUserIdOrderByAllocatedAtDesc(String userId) {
        Set<Object> allocationIds = redisTemplate.opsForSet().members(ALL_ALLOCATIONS_KEY);
        
        if (allocationIds == null || allocationIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allocationIds.stream()
                .map(allocationId -> findById((Long) allocationId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(allocation -> allocation.getUserId().equals(userId))
                .sorted((a1, a2) -> {
                    if (a1.getAllocatedAt() == null && a2.getAllocatedAt() == null) {
                        return 0;
                    }
                    if (a1.getAllocatedAt() == null) {
                        return 1;
                    }
                    if (a2.getAllocatedAt() == null) {
                        return -1;
                    }
                    return a2.getAllocatedAt().compareTo(a1.getAllocatedAt()); // 倒序
                })
                .collect(Collectors.toList());
    }

    /**
     * 统计各状态的分配数量
     */
    public List<Object[]> countByStatus() {
        List<Object[]> result = new ArrayList<>();
        
        for (GatewayAllocation.AllocationStatus status : GatewayAllocation.AllocationStatus.values()) {
            long count = countByStatus(status);
            result.add(new Object[]{status, count});
        }
        
        return result;
    }

    /**
     * 根据用户ID更新状态
     */
    public void updateStatusByUserId(String userId, GatewayAllocation.AllocationStatus newStatus) {
        Optional<GatewayAllocation> allocationOpt = findByUserId(userId);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            allocation.setStatus(newStatus);
            allocation.setLastModifiedDate(LocalDateTime.now());
            save(allocation);
        }
    }

    /**
     * 查找网关负载均衡信息
     */
    public List<Object[]> findGatewayLoadBalancing(GatewayAllocation.AllocationStatus status) {
        List<GatewayAllocation> allocations = findByStatus(status);
        Map<String, Long> gatewayCountMap = new HashMap<>();
        
        // 统计每个网关的连接数
        for (GatewayAllocation allocation : allocations) {
            String gatewayAddress = allocation.getGatewayAddress();
            gatewayCountMap.put(gatewayAddress, gatewayCountMap.getOrDefault(gatewayAddress, 0L) + 1);
        }
        
        // 转换为Object[]格式
        List<Object[]> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : gatewayCountMap.entrySet()) {
            result.add(new Object[]{entry.getKey(), entry.getValue()});
        }
        
        return result;
    }

    /**
     * 确认连接
     */
    public void confirmConnection(String userId, GatewayAllocation.AllocationStatus fromStatus, GatewayAllocation.AllocationStatus toStatus, LocalDateTime connectedTime) {
        Optional<GatewayAllocation> allocationOpt = findByUserIdAndStatus(userId, fromStatus);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            allocation.setStatus(toStatus);
            allocation.setConnectedAt(connectedTime);
            allocation.setLastModifiedDate(LocalDateTime.now());
            save(allocation);
        }
    }
}
