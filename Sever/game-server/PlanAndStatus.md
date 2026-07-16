# Game Server Plan And Status

## Multi-role selection

- [ ] Add lightweight role-summary fields and protocols for accounts owning more than one role. The list must not include wallet, inventory, Guide or complete gameplay state.
- [ ] Bind an explicitly selected `playerId` to the authenticated session and verify that the role belongs to its `userId`.
- [ ] Prevent `GAME_INIT_REQUEST` and all character mutations until multi-role selection is complete.
- [ ] Decide whether concurrent sessions under one account may select different roles, then place active selection at account or session scope accordingly.

Acceptance: zero-role accounts still create and select a default role, one-role accounts still auto-select, and multi-role accounts can select only their own role before receiving full initialization data.

## Legacy table cleanup

- [ ] After the role-ID migration has been exercised against a retained development backup, remove the no-longer-authoritative account-keyed tables: `player_state`, `player_wallet`, `player_bag_item`, `user_function_open`, and `player_guide_progress`.

Acceptance: all migrated row counts have been reconciled against `player_role` and the new player-keyed business tables before deletion.
