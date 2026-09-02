---
name: bootstrap-laya-game
description: Guide first-time Framework-J users from development-environment verification through a confirmed game baseline or a bounded exploratory prototype. Use when someone just downloaded the framework, does not know how to start, wants to create a new game, or gives only a genre-level request such as making a tower-defense game; do not use for an already-scoped implementation task in an established game project.
---

# Bootstrap Laya Game

Turn an unfamiliar Framework-J checkout and an immature game idea into one safe, evidence-backed next step. A genre is a valid starting point, not an implementation specification.

## 1. Discover The Starting State

Read the repository instructions, root README and DESIGN, then inspect the actual code and configuration. Determine whether the user wants to:

- run or learn the framework;
- start a new game;
- continue an existing game with a valid product baseline.

If an existing game has product or stage records, use `assess-game-project-stage` before proposing a transition. Keep claimed, observed and human-confirmed states separate.

## 2. Pass The Development Environment Gate

Before changing gameplay, prove that the downloaded baseline works on this machine:

1. Run `tools/bootstrap/check-development-environment.ps1`.
2. Resolve missing JDK 21+, Maven, Node.js, database, Redis or occupied-port blockers. Do not install software, register services, change credentials or kill processes without the user's authorization.
3. Run the repository document validator, client TypeScript check and server tests when their dependencies are available.
4. Start Central, Login, Gateway and Game Server in documented dependency order. Confirm their real health endpoints and inspect fatal startup errors.
5. Ask the user to open `Client/LayaProject` in LayaAir IDE 3.3, run the startup scene, sign in with a development account and confirm that the main scene opens.

The Gate passes only with both server health evidence and a human-observed client login result. Static checks, an old screenshot or “the process started” are insufficient. Record blockers factually and stay on this Gate until it passes or the user explicitly pauses onboarding.

## 3. Choose The Product Path

For a new game, do not ask for a full design document in one interrogation. Ask a few high-information questions at a time and offer concrete alternatives when the user is unsure.

Use one of these paths:

- **Exploration:** Default for a genre-level or rapidly changing idea. Confirm a small prototype brief, then build the cheapest reversible experience that tests one or two hypotheses.
- **Initiation:** Use when the user wants to form a product direction and plan continued development. Confirm the minimum product baseline before issuing formal implementation work.

Read [references/initiation-baseline.md](references/initiation-baseline.md) when preparing either brief.

## 4. Minimum Decision Gate

Before any prototype or formal feature work, make these explicit:

- one primary player and their relevant need or situation;
- target platform, session shape and single-player/network assumption;
- one-sentence player promise;
- core loop expressed as player verbs and visible results;
- one or two falsifiable experience or feasibility hypotheses;
- the smallest playable scope and explicit exclusions;
- how a person will observe success, failure or confusion;
- the decision after evidence: continue, adjust, discard or reassess;
- assumptions, constraints and the user who can confirm the direction.

Propose missing values, but label them as proposals. The user owns product confirmation. Do not infer approval from enthusiasm, document volume, a score, “locked” labels or the existence of advanced code.

## 5. Exploration Constraints

Exploration is a supported development style, not a failed initiation process:

- optimize for learning and first-hand play, not reusable production architecture;
- prefer client-local state, placeholder assets and existing framework capabilities when they can answer the hypothesis;
- avoid accounts, economy, long-term persistence, live operations, broad protocol work and large formal-art batches unless the hypothesis specifically requires them;
- agree on a short stopping boundary and preserve the ability to throw the prototype away;
- after play, compare observations with the hypothesis and ask the user to choose continue, adjust or discard.

If exploration must cross Client, Protocol or Sever boundaries, use `laya-client-server-feature`; “prototype” does not relax authority, identity, exact-integer or security rules.

## 6. Persist Only Confirmed Knowledge

Keep unconfirmed candidates in the conversation unless the user asks for a provisional artifact. After confirmation:

- write current product entry and navigation to the nearest product `README.md`;
- write the stable product baseline and exclusions to the nearest product `DESIGN.md`;
- write only unfinished prototype or initiation work to `PlanAndStatus.md`;
- do not create empty document scaffolding or preserve a progress diary.

When the framework checkout is still generic and no game has been confirmed, do not populate it with an invented product. If a formal project-stage transition is requested, use `assess-game-project-stage` and never self-authorize `confirmedStage`.

## Completion

Onboarding is complete when:

- the development environment Gate has evidence;
- the user has selected exploration or initiation;
- the corresponding minimum brief is confirmed;
- exactly one next experiment or next-stage action has clear scope and acceptance;
- any implementation uses the repository's existing scoped Skills and verification rules.
