package com.laya.game.game.init;

import com.laya.game.game.wallet.WalletRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class WalletInitDataProvider implements GameInitDataProvider {
    private final WalletRepository repository;
    public WalletInitDataProvider(WalletRepository repository) { this.repository = repository; }
    @PostConstruct public void initialize() { repository.initializeSchema(); }
    @Override public String sectionName() { return "wallet"; }
    @Override public Object build(GamePlayerContext context) { return repository.findOrCreate(context.playerId()); }
}
