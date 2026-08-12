---
name: laya-wechat-release-verifier
description: Verify and troubleshoot this LayaAir 3.3 project's WeChat mini-game release, including the local logic code subpackage, remote resource packages, local HTTP hosting, environment endpoints, ASTC KTX output and PNG fallback, WeChat Developer Tools behavior, and Local versus production login. Use for wxgame builds, package-size cleanup, remote loading failures, texture-compression checks, or final release acceptance.
---

# Laya WeChat Release Verifier

Treat source configuration, generated output, and runtime evidence as three separate gates. Never infer a successful release from IDE settings alone.

## Read the project contract

Read the repository and client `DESIGN.md`, client `README.md`, `src/start/README.md`, and the current `PlanAndStatus.md`. Verify all claims against current files. Consult official LayaAir documentation when engine-version behavior is uncertain.

## Inspect source configuration

Check `settings/BuildSettings.json`, `settings/PlayerSettings.json`, `src/start/MyGameConfig.ts`, `src/start/StartMain.ts`, `settings/plugin-JFrameworkTextureImportRules.json`, and representative texture `.meta`/`.atlascfg` files together.

Enforce these project invariants:

- Use `assets/logic/` as the resource anchor with subpackage path `logic` and entry `src/logic/LogicLib.bundledef`.
- Keep `logic` local, non-remote, manually loaded, and outside WASM packaging.
- Keep `bigImg/character/config/effects/guides/map/scene/shaders/ui` synchronized across `alwaysIncluded`, remote `subpackages`, and `MyGameConfig.remoteResourcePackages`.
- Keep only startup resources in the main package; do not treat `alwaysIncluded` as proof that a remote package was copied locally.
- Keep PC textures `R8G8B8A8` and Android/iOS textures `ASTC_6X6` unless a confirmed device-specific exception exists.
- Keep source PNG/JPG until real-device coverage proves the supported-device floor; Developer Tools on Windows needs the default/PC representation.
- Keep platform SDK selection separate from authentication environment. Local developer credentials must never become valid production credentials.

Do not hand-edit generated release files or invent Laya `.meta` UUIDs.

## Verify generated output

Inspect the latest `release/wxgame` and `release/wxgame-remote`, not an older build:

- `release/wxgame/game.json` must declare `{ "name": "logic", "root": "logic/" }`.
- `release/wxgame/logic/game.js` must exist.
- `release/src/logic` and `release/wxgame-remote/logic` must not exist.
- Every configured remote resource directory must exist under `wxgame-remote` and stay out of the local package except explicit startup dependencies.
- Editor test bundles and `assets/testAndSample` content must be absent from runtime bundles.

For texture compression, find `*.ktx` and inspect each package's `fileconfig.json`. Laya format `19`, `@1.ktx`, and Android/iOS platform mappings are ASTC evidence. PNG beside KTX is expected when a PC/default fallback or `keepTextureSourceFile` is retained; it does not mean ASTC generation failed. Use a real Android/iOS device and network inspection to prove runtime KTX selection.

## Verify local networking

The direct-development port map is `8080` static resources, `8081` Login HTTP, `8082` public Gateway WebSocket, `8083` Central, and `8084` Game Server internal WebSocket. Check listeners and server configuration before assuming `8080` is free; legacy Docker/production profiles may reuse it.

With `resourceBaseUrl` set to `http://127.0.0.1:8080/`, start the static server inside `release/wxgame-remote`, not its parent:

```powershell
cd release/wxgame-remote
python -m http.server 8080 --bind 127.0.0.1
```

Use `127.0.0.1` only when Developer Tools and the server share the computer. Use the computer's LAN IP for device testing. Production login/resources require HTTPS and the Gateway address returned by login.

## Diagnose login by boundary

Trace `LoginView -> LoginMgr -> SDKMgr -> platform SDK -> Login Server`. A structured HTTP `400` proves transport reachability and usually indicates authentication or validation rejection; inspect the response body and server adapter before changing URLs.

For this project, Local WeChat testing uses the explicit developer login mode. Test/Production use `wx.login`; production is incomplete until Login Server performs real `code2Session` validation with externally supplied AppID/AppSecret. Never accept arbitrary codes or log credentials.

## Validate and hand off

Run:

```powershell
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
powershell -ExecutionPolicy Bypass -File tools/docs/validate-text-format.ps1
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```

Then require the user-controlled gates: rebuild in LayaAir IDE, run in WeChat Developer Tools, and test ASTC on target devices. Report deterministic checks separately from IDE, server, and device-only acceptance. Keep only remaining work in `PlanAndStatus.md`.

Before handoff, apply root `AGENTS.md` documentation closure. Promote verified public release behavior and commands to the nearest README, promote stable packaging or platform constraints to the nearest DESIGN, and keep only genuinely unfinished IDE, server, Developer Tools, or device gates in PlanAndStatus. Remove completed Plan items instead of retaining a release diary.
