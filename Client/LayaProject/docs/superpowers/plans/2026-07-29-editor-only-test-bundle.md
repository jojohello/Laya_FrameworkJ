# Editor-Only Test Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use yq_superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the bullet lifecycle test in a self-contained editor-only package that LayaAir can load in the IDE but excludes from a formal runtime build.

**Architecture:** `assets/testAndSample/testBulletLifecycle/` owns its scene, scripts and a Laya script-bundle definition. The bundle definition enables editor loading and disables runtime loading. Resource absence from the formal build is enforced by the normal scene/resource inclusion rules, then verified from an actual WeChat build output.

**Tech Stack:** LayaAir 3.3, TypeScript, Laya `.bundledef`, PowerShell checks.

## Global Constraints

- Do not hand-write Laya `.meta` UUIDs; the IDE creates or preserves them.
- Test code stays below `assets/testAndSample/`; production code must not import it.
- `excludeFilesRule` is not an assets/script exclusion mechanism and must not be used as one.
- Only a real WeChat release output can prove that runtime resources and scripts are absent.

---

### Task 1: Isolate the bullet lifecycle test package

**Files:**
- Move: `assets/testAndSample/editorResources/HeadlessTestScene.ls` to `assets/testAndSample/testBulletLifecycle/HeadlessTestScene.ls`
- Move: `assets/testAndSample/scripts/*` to `assets/testAndSample/testBulletLifecycle/scripts/*`
- Modify: test-package README and project documentation references

- [ ] Preserve the existing IDE-generated scene metadata while moving the scene.
- [ ] Update only relative TypeScript imports required by the new package root.
- [ ] Run `npx.cmd tsc -p tsconfig.json --noEmit --pretty false`.

### Task 2: Add the editor-only script set

**Files:**
- Create through LayaAir IDE: `assets/testAndSample/testBulletLifecycle/TestBulletLifecycle.bundledef`
- Modify: `settings/BuildSettings.json`

- [ ] In the IDE create a script bundle definition at the test package root.
- [ ] Configure `enabled=true`, `allowLoadInEditor=true`, `allowLoadInRuntime=false`, `autoLoad=false`, and `includeAllFiles=true`.
- [ ] Remove the ineffective `excludeFilesRule` entry from BuildSettings.
- [ ] Run the test scene in the IDE and record its PASS/SUMMARY output.

### Task 3: Verify formal exclusion

**Files:**
- Inspect: user-created `release/wxgame/` output

- [ ] Build WeChat from LayaAir IDE after Task 2 passes.
- [ ] Run `rg -n -i "HeadlessTest|testBulletLifecycle|BulletReleaseRegressionCase" release\\wxgame`.
- [ ] Confirm no `testAndSample` directory or test scene appears in the output.
