package com.laya.game.game.init;

import com.laya.game.game.wallet.WalletRepository;
import org.springframework.stereotype.Component;

@Component
public class WalletInitDataProvider implements GameInitDataProvider {
    private final WalletRepository repository;
    public WalletInitDataProvider(WalletRepository repository) { this.repository = repository; }
    @Override public String sectionName() { return "wallet"; }
    @Override public Object build(GamePlayerContext context) { return repository.findOrCreate(context.playerId()); }
}
