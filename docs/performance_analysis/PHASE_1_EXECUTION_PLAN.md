# Phase 1 Execution Plan — Option A + Focused B (20 hours)

Scope: Implement four critical fixes to stabilize timing/animation races and reduce redundant renders.
- A1: Animation-aware state management (5h)
- A2: Trick completion synchronization (6h)
- A3: Animation queue system (5h)
- A4: Consolidate useEffects (4h)

Success criteria (Phase 1):
- No card disappearing or trick desyncs across 100+ simulated tricks.
- Consistent animation sequencing (no overlapping races, no double-plays).
- Reduced redundant renders on key components (GameScreen, TrickArea, Hand).

Key code locations:
- State machine: `utils/state/GameReducer.js`
- Main orchestrator: `screens/GameScreen.js`
- Animation layer: `components/TrickArea.js`, `components/AnimatingCardsOverlay.js`
- Hand rendering: `components/Hand.js`
- Helpers: `utils/cardAnimationHelpers.js`, `utils/gameLogic.js`, `utils/engine/PlayEngine.js`

---

## 1) Detailed Task Breakdown (A1–A4)

### A1. Animation-aware state management (5h)
Goal: Make state transitions aware of animation lifecycle so we never remove/move cards in state before their animations complete.

Subtasks:
1. Extend reducer state with animation coordination fields.
   - File: `utils/state/GameReducer.js`
   - Add to root state:
     - `animations: {
         animatingCards: Array<{ id: string, playerIndex: number, card: Card, from: Pos, to: Pos }>,
         perPlayerActive: boolean[4],
         trickAnimationBarrier: { trickNumber: number, expected: number, completed: number }
       }`
     - `playing.pendingTrickResolution: boolean` (true after 4th play dispatched; reducer waits for barrier)
2. Define new actions (no-op to UI, reducer-driven):
   - `QUEUE_CARD_ANIMATION` (payload: playerIndex, card, positions)
   - `MARK_CARD_ANIMATION_DONE` (payload: animId, playerIndex)
   - `REQUEST_TRICK_RESOLVE` (payload: trickNumber)
   - `RESOLVE_TRICK_IF_READY` (guarded resolve triggered after barrier reached)
3. Update `PLAY_CARD` handling to become "animation-aware":
   - On play:
     - Do NOT immediately remove the card from player’s hand in state that drives Hand rendering if the overlay will animate it.
     - Instead, mark it as "inFlight" or move it to `animations.animatingCards` and set a hand-side render guard (the card remains visible until overlay mounts it, then Hand hides it via `inFlightIds`).
   - After dispatching `QUEUE_CARD_ANIMATION`, update `playing.currentTrick` and other legalities as today, but set `playing.lastPlayedAnimId` for tracking.
4. Guard trick resolution: when `currentTrick.length === 4`, dispatch `REQUEST_TRICK_RESOLVE` and set `playing.pendingTrickResolution = true`. Actual scoring/winner advancement must occur only upon `RESOLVE_TRICK_IF_READY` when barrier completed.

Exact changes (high level pseudocode):
```javascript
// utils/state/GameReducer.js
case 'PLAY_CARD': {
  // ...existing legality checks
  const animId = `${state.playing.trickNumber}-${action.playerIndex}-${Date.now()}`;
  const next = produce(state, draft => {
    draft.animations.animatingCards.push({ id: animId, playerIndex: action.playerIndex, card: action.card, from: action.fromPos, to: action.toPos });
    draft.animations.perPlayerActive[action.playerIndex] = true;
    // Record play in trick state but keep hand render guarded by inFlight
    draft.playing.currentTrick.push({ playerIndex: action.playerIndex, card: action.card, animId });
    draft.players[action.playerIndex].hand = removeOne(draft.players[action.playerIndex].hand, action.card);
    // Optional: keep a shadow list `players[action.playerIndex].inFlightIds.add(animId)` for Hand filter
    if (draft.playing.currentTrick.length === 4) {
      draft.playing.pendingTrickResolution = true;
      draft.animations.trickAnimationBarrier = { trickNumber: draft.playing.trickNumber, expected: 4, completed: 0 };
    }
    draft.playing.currentPlayer = getNextPlayer(action.playerIndex);
  });
  return next;
}

case 'MARK_CARD_ANIMATION_DONE': {
  const next = produce(state, draft => {
    draft.animations.animatingCards = draft.animations.animatingCards.filter(a => a.id !== action.animId);
    draft.animations.perPlayerActive[action.playerIndex] = false;
    if (draft.playing.pendingTrickResolution && draft.animations.trickAnimationBarrier.trickNumber === draft.playing.trickNumber) {
      draft.animations.trickAnimationBarrier.completed += 1;
    }
  });
  return next;
}

case 'RESOLVE_TRICK_IF_READY': {
  if (!state.playing.pendingTrickResolution) return state;
  const { expected, completed } = state.animations.trickAnimationBarrier || { expected: 0, completed: 0 };
  if (completed < expected) return state; // wait
  // proceed with winner calculation and state updates
  return resolveTrick(state);
}
```

Files to modify:
- `utils/state/GameReducer.js` (add actions and guarded trick resolution)
- `components/Hand.js` (hide cards that are `inFlight` to avoid double-vision)
- `screens/GameScreen.js` (dispatch new actions and wire overlay callbacks)
- `components/AnimatingCardsOverlay.js` (ensure `onAnimationComplete(id)` feeds reducer)

Acceptance criteria:
- Playing any card triggers overlay animation; card in the player’s hand is hidden at the start of animation and does not flicker.
- State does not advance leader/trickNumber until all four animations in the trick report completion.
- No card disappears without a corresponding animation event.

---

### A2. Trick completion synchronization (6h)
Goal: Eliminate race where scoring/next-leader occurs before animations complete.

Subtasks:
1. Introduce barrier counting for trick animations (re-uses A1 state).
   - On the 4th `PLAY_CARD`, set `pendingTrickResolution = true` and barrier `{ expected: 4, completed: 0 }`.
2. Drive resolution exclusively from animation completion path.
   - `AnimatingCardsOverlay` calls `onAnimationComplete(animId)` → dispatch `MARK_CARD_ANIMATION_DONE` → `RESOLVE_TRICK_IF_READY`.
3. Ensure `TrickArea` render derives solely from `playing.currentTrick` and `animations.animatingCards` for positions; nothing resets until resolve completes.
4. Resolve path must: determine winner, increment per-player and per-team trick counts, set `leader` to trick winner, increment `trickNumber`, clear `currentTrick`, and only then allow next play.
5. Add guard to prevent new card plays while `pendingTrickResolution` is true.

Exact changes/pseudocode:
```javascript
// In GameReducer.resolveTrick (new helper)
function resolveTrick(state) {
  return produce(state, draft => {
    const winner = determineTrickWinner(draft.playing.currentTrick, draft.contract.trumpSuit, draft.playing.leadSuit);
    draft.playing.leader = winner.playerIndex;
    draft.playing.currentPlayer = winner.playerIndex;
    draft.playing.currentTrick = [];
    draft.playing.leadSuit = null;
    draft.playing.trickNumber += 1;
    draft.playing.pendingTrickResolution = false;
    draft.animations.trickAnimationBarrier = null;
    draft.teams = incrementTricks(draft.teams, winner.playerIndex);
  });
}

// Guarding plays while resolving
case 'PLAY_CARD': {
  if (state.playing.pendingTrickResolution) return state; // reject plays
  // ... normal handling
}
```

Files to modify:
- `utils/state/GameReducer.js` (barrier, resolve helper, guards)
- `components/AnimatingCardsOverlay.js` (ensure completion feeds reducer)
- `screens/GameScreen.js` (ensure no ad-hoc timers calling resolve)

Acceptance criteria:
- Trick winner and next leader are computed only after the 4th animation completes.
- No additional card can be played while `pendingTrickResolution` is true.
- Across 100 simulated tricks, never observe out-of-order resolve vs. animations (test added).

---

### A3. Animation queue system (5h)
Goal: Ensure per-player serialized animations and an ordered global queue to prevent overlap and dropped frames.

Subtasks:
1. Create a minimal per-player queue abstraction.
   - File: `utils/cardAnimationHelpers.js` (already exists) — extend with a `createAnimationQueue()` returning `{ enqueue(task), onDrain(cb) }`.
   - Queue guarantees: one active animation per player; tasks are promises that resolve when overlay emits complete.
2. Add queues to `GameScreen.js`.
   - Maintain `const queuesRef = useRef([q0,q1,q2,q3]);` created on mount.
   - The play handler enqueues the animation task per player instead of firing immediately.
3. Connect queue to overlay.
   - When a task enqueues, dispatch `QUEUE_CARD_ANIMATION` (A1), and return a promise that resolves on `onAnimationComplete(animId)`.
4. Back-pressure for AI and input.
   - Human input handler `onCardPress` checks queue emptiness for that player before allowing a play.
   - AI move selection waits for its queue to drain before dispatching `PLAY_CARD`.

Pseudocode:
```javascript
// utils/cardAnimationHelpers.js
export function createAnimationQueue() {
  const q = [];
  let active = false; let drainCb = null;
  async function runNext() {
    if (active || q.length === 0) return;
    active = true;
    const { task } = q.shift();
    try { await task(); } finally {
      active = false;
      if (q.length === 0 && drainCb) drainCb();
      runNext();
    }
  }
  return {
    enqueue(task) { return new Promise((resolve, reject) => {
      q.push({ task: async () => { try { await task(); resolve(); } catch (e) { reject(e); } } });
      runNext();
    }); },
    onDrain(cb) { drainCb = cb; }
  };
}
```

Files to modify:
- `utils/cardAnimationHelpers.js` (add queue abstraction if not present)
- `screens/GameScreen.js` (instantiate and use queues; gate human/AI plays)
- `components/AnimatingCardsOverlay.js` (no change, but used by queues)

Acceptance criteria:
- A single player's multiple quick taps enqueue sequentially; only one card animates at a time per player.
- AI plays never overlap animations for the same player.
- Zero dropped animations observed in logs across burst input tests.

---

### A4. Consolidate useEffects (4h)
Goal: Remove scattered timers/effects that cause redundant renders and races; centralize into a minimal number of guarded effects/callbacks.

Subtasks:
1. Audit `screens/GameScreen.js` and list effects handling:
   - AI turns, trick completion timers, trump selection delays, UI toasts.
2. Replace multiple overlapping effects with one orchestrator effect where possible:
   - `useEffect` on `[phase, playing.currentPlayer, playing.pendingTrickResolution]` to decide: if AI and not pending, schedule move via queue; if pending, do nothing.
   - Move fixed delays to `await wait(ms)` inside async orchestrator functions to keep sequencing explicit.
3. Memoize selectors and callbacks to reduce renders:
   - `useMemo` for derived props to `TrickArea`, `Hand` and `GameHUD`.
   - `useCallback` for `onCardPress` with stable deps.
4. Remove redundant `useEffect`s that only duplicate state transitions or rely on timers.

Pseudocode (central orchestrator):
```javascript
// screens/GameScreen.js
useEffect(() => {
  let cancelled = false;
  async function run() {
    if (state.phase !== 'PLAYING') return;
    if (state.playing.pendingTrickResolution) return;
    const p = state.playing.currentPlayer;
    const player = state.players[p];
    if (!player.isHuman) {
      await queuesRef.current[p].enqueue(async () => {
        if (cancelled) return;
        const card = PlayEngine.pickMove(state); // or existing helper
        dispatch({ type: 'PLAY_CARD', playerIndex: p, card, fromPos: ..., toPos: ... });
        await waitForAnimCompletion(card); // resolved via overlay callback
      });
    }
  }
  run();
  return () => { cancelled = true; };
}, [state.phase, state.playing.currentPlayer, state.playing.pendingTrickResolution]);
```

Files to modify:
- `screens/GameScreen.js` (reduce and consolidate effects, memoize selectors)

Acceptance criteria:
- No duplicate AI move invocations per turn.
- Removal of manually managed setTimeout chains for trick completion.
- Profiler shows reduced commit counts for `GameScreen` and `TrickArea` versus baseline.

---

## 2) Dependencies & Sequencing

- A1 and A3 are foundational and can start in parallel with limited coupling.
- A2 depends on A1 (barrier state/actions) and benefits from A3 (queues ensure ordering), so start after A1 scaffolding exists.
- A4 can start after an audit pass, but consolidation should consider A3’s queue and A2’s barrier to avoid rework.

Critical path:
1) A1 (state + actions) → 2) A2 (barriered resolve) → 3) A4 finalization (orchestrator uses A1/A2)  
Parallel: A3 can run alongside A1 and integrate by mid-sprint.

Optimal execution order and timeline (20h):
- Day 1 (Hours 0–5): A1 implementation + PR
- Day 1 (Hours 3–8): A3 queue implementation + wire-up to overlay
- Day 2 (Hours 0–6): A2 synchronization + tests
- Day 2 (Hours 4–8): A4 consolidation + memoization

---

## 3) Agent Assignments & Collaboration Points

- Expert Coder Agent
  - A1: Implement reducer changes, actions, and wire to overlay
  - A2: Implement resolve barrier and guards; remove ad-hoc timers
  - A3: Implement per-player queues and input gating
  - A4: Consolidate effects and memoize selectors
- QA/Testing Agent
  - Baseline test capture (before changes) and post-change regression/tests
  - Add simulation tests for 100+ tricks with deterministic seed
  - Verify race fixes and no duplicate AI plays
- Performance Agent
  - Add render counters and basic timing probes around animations
  - Establish baseline and compare post-change metrics

Collaboration points:
- Design review (Architecture + Expert Coder) for A1 actions/state layout before coding (1 quick review)
- Test plan review (QA + Performance) before A2 work starts
- Mid-sprint sync to verify queues interop with overlay

---

## 4) Testing Strategy

Baseline (capture before changes):
- Integration: `__tests__/integration/FullGameFlow.test.js` run to pass.
- Add temporary render counters:
  - Instrument `GameScreen`, `TrickArea`, `Hand` with counters (dev-only) to record renders per trick.
- Measure: average renders per trick, max concurrent animations observed, any warnings.

New/updated tests:
- Unit: `utils/state/GameReducer.test.js`
  - PLAY_CARD sets `pendingTrickResolution` on 4th card.
  - MARK_CARD_ANIMATION_DONE increments barrier.
  - RESOLVE_TRICK_IF_READY only resolves when barrier met.
- Integration: `__tests__/integration/TrickSync.test.js`
  - Simulate 4 plays with mocked overlay completion; assert resolve order and new leader.
- Integration: `__tests__/integration/AnimationQueue.test.js`
  - Burst 3 plays for same player; assert serial animations and no overlap.
- E2E-lite: deterministic AI round simulation (`sampleTricks` + seeded RNG) to 100 tricks with mock completion.

Performance benchmarks:
- Renders per trick (target reductions):
  - GameScreen: -25% vs baseline
  - TrickArea: -20% vs baseline
  - Hand (human): -20% vs baseline
- Animation timing consistency:
  - Std dev of animation complete-to-resolve delay < 20ms
- No dropped animation events across 100+ trick run

Regression tests:
- Legal play validation unchanged (game rules still enforced)
- Scoring totals identical to baseline given same sequence of cards
- Human input remains responsive; no blocked taps when queue empty

---

## 5) Risk Management

Task-specific risks and mitigations:
- A1
  - Risk: Hiding/removing cards at wrong time → ghost or duplicate cards
  - Mitigation: Single source of truth: renderer filters by `inFlightIds`; overlay emits completion; add unit tests
  - Early warning: Flicker/double card in Hand after play
  - Rollback: Feature flag `animationAware=false` to revert to current behavior
- A2
  - Risk: Deadlock if completion not fired → game stalls
  - Mitigation: Timeout fail-safe logs + dev-mode watchdog that auto-resolves after 2s with warning (not in production)
  - Early warning: `pendingTrickResolution` stuck > 2s
  - Rollback: Temporary timer-based resolve behind feature flag
- A3
  - Risk: Queue starvation or memory growth
  - Mitigation: Bounded queue per player; refuse enqueue if phase !== PLAYING
  - Early warning: Queue length > 2 for any player
  - Rollback: Bypass queues if `enableQueues=false`
- A4
  - Risk: Over-consolidation removes necessary effect
  - Mitigation: Incremental consolidation + QA regression, compare with baseline
  - Early warning: Duplicate/zero AI moves per turn
  - Rollback: Keep backup `GameScreen_backup.js` (already present) and git revert

Global safeguards:
- Feature flags (env or constants) for `animationAware`, `useQueues`, `watchdogEnabled`.
- Extensive logging in dev builds only.

---

## 6) Progress Tracking

Daily checkpoints:
- Day 1 mid-day: A1 state/actions stubbed, PR open, Architecture review done
- Day 1 EOD: A1 merged, A3 queues integrated in GameScreen, basic manual test passes
- Day 2 mid-day: A2 synchronization complete with integration tests passing
- Day 2 EOD: A4 consolidation completed, benchmarks collected, summary posted

Status reporting format (posted in TEAM_COORDINATION daily sync):
- Yesterday: [bulleted accomplishments]
- Today: [planned tasks]
- Blockers: [issues, needs]
- Metrics: [render counts, animation timing, test results]

Escalation process for blockers:
- <2h blocker: async ping in channel to Architecture + Performance
- >2h or architectural uncertainty: 30-min huddle; Planning agent decides go/no-go on scope trim

Definition of Done (Phase 1):
- All A1–A4 acceptance criteria met
- All new/updated tests passing in CI
- Baseline vs post-change metrics show improvements or parity
- Code reviewed by Architecture and QA sign-off
- Document updates: this plan marked “Done”, change log updated

---

## Implementation Notes and Code Pointers

- `components/AnimatingCardsOverlay.js` already surfaces `onAnimationComplete(cardId)` — ensure this ID is the same as `animId` dispatched from reducer on `PLAY_CARD`.
- `components/TrickArea.js` consumes `trickCards` and `playedCardAnimations`. For Phase 1, prefer `AnimatingCardsOverlay` as the single animation surface; keep `TrickArea` visual-only (trick number, table) to reduce double rendering paths.
- `components/Hand.js` — filter out cards whose IDs are in `inFlight` to prevent duplicates while animating.
- `screens/GameScreen.js` — centralize turn orchestration and connect queues; make sure to memoize props to `TrickArea`, `Hand`, `GameHUD` to reduce churn.

---

## Checklist
- [ ] A1 reducer fields and actions added; wired to overlay
- [ ] A2 barrier and guarded trick resolution implemented
- [ ] A3 per-player queues integrated; human/AI gated
- [ ] A4 effects consolidated; memoization in place
- [ ] Baseline vs post metrics captured and documented
- [ ] Tests added: unit + integration + perf counters
- [ ] Feature flags and dev watchdogs wired (dev only)

