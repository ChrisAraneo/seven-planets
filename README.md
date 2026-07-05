# Seven Planets

Seven Planets is a single-page browser strategy game for 1 human player against 6 AI opponents. Draft cards, build your economy, research technology, raise armies and conquer every other planet to win.

Game built with Claude Code Fable 5, perfected by human.

**To play:** open `index.html` in a browser. No build step, no dependencies.

---

## Objective

**Win by conquering every other player.** Total conquest is the only victory — the last empire standing rules the galaxy. You **lose** the moment your last planet falls.

---

## Turn Structure

Each turn has two phases.

### 1. Draft Phase

A fresh pool of cards is revealed and players take turns picking from it.

**Draft priority follows technology:** tech-3 players draft before tech-2 players, who draft before tech-1 players. Ties are broken by a random rotation each turn.

Your **main planet picks 2 cards**, +1 per 🌀 Singularity level you own (they stack across planets). Each additional planet you hold grants an extra draft turn worth 1 card.

**Pool composition by turn:**

| Turns | Building cards | Resource cards | Action cards | Total |
|-------|---------------|----------------|--------------|-------|
| 1–5   | none           | 14             | none         | 14    |
| 6–9   | 5 unique types | 11             | none         | 16    |
| 10+   | 5 unique types | 5              | 6            | 16    |

Cards phase in over the course of the game:

- **Turn 6** — building cards appear (each type at most once per pool)
- **Turn 10** — ⚔️ Attack, 🪖 Recruit and 🔁 Trade action cards appear; the 🔬 Research Lab becomes available
- **Turn 20** — 🛸 Move joins the action deck
- **Turn 30** — 2 ⭐ influence cards join every pool
- The 🌀 Singularity is dealt only once someone owns a Research Lab whose level exceeds its planet's Singularity level
- Each 🌀 Singularity level in play adds 1 extra random card to every pool

Picking a **building card** constructs (or upgrades) it instantly on the drafting planet — the cost is paid from your hand at that moment. You cannot pick a card you cannot afford or use.

### 2. Action Phase

Spend the action cards you have collected — each action consumes one matching card:

- 🪖 **Recruit** — add troops on a 🎖️ Barracks planet, at **1 ⛏️ Ore per troop** (no energy)
- ⚔️ **Attack** — launch a rocket strike from a planet with a 🚀 **Rocket Silo**
- 🛸 **Move** — redeploy troops between your planets (requires a 🛰️ **Spaceport** and 2+ planets)
- 🔁 **Trade** — exchange resources with a rival (requires a 🤝 **Embassy**; earns **+1 ⭐ Influence**)
- ⭐ **Influence** — play a held influence card (already paid for at draft time; playing is free)

---

## Resources

| Resource | Icon | Relative value |
|----------|------|----------------|
| Ore      | ⛏️  | ×1.0 |
| Crystal  | 💎  | ×1.3 |
| Energy   | ⚡  | ×1.3 |
| Spice    | ✨  | ×2.2 — never dealt as a card; produced only by the 🏜️ Spice Harvester |
| Relic    | 🔮  | ×3.0 — wildcard, substitutes any missing resource when paying a cost |

You start with **0 resources** and **3 troops** on your home planet — everything else must be drafted, built, or conquered.

---

## Technology

Every building has up to **3 levels**. Picking its card again upgrades it one level. **Level N costs N× the base cost** — a level-2 building is twice as expensive as its level-1 version, level 3 is three times as expensive.

A building's level can never exceed your **technology level**:

| Tech level | Requirement | Buildings available |
|-----------|-------------|---------------------|
| 1 | Starting level | Level 1 only |
| 2 | Own a 🌀 **Singularity** | Levels 1–2 |
| 3 | Own **two** Singularities, on two planets (conquer someone!) | Levels 1–3 |

The 🌀 Singularity itself requires a 🔬 Research Lab on the same planet, and its level can never exceed that Lab's level — a **level-2 Singularity needs a level-2 Research Lab**. The full chain is: Lab L1 → Singularity L1 (tech 2) → Lab L2 → Singularity L2 → second planet → second Singularity (tech 3).

Higher technology also grants **draft priority** (see Draft Phase).

---

## Buildings

Costs below are for **level 1** — level N costs N× as much (e.g. Ore Mine L2 costs 2💎 2⚡).

| Building | Base cost (L1) | Max | Effect |
|---------|---------------|-----|--------|
| ⚒️ Ore Mine | 1💎 1⚡ | L2 | +1 ⛏️ per turn (**L2: +3 ⛏️ per turn**) |
| 💠 Crystal Extractor | 1⛏️ 1⚡ | L2 | +1 💎 per turn per level |
| 🔆 Solar Array | 1⛏️ 1💎 | L2 | +1 ⚡ per turn per level |
| 🏜️ Spice Harvester | 2⛏️ 1💎 1⚡ | L2 | +1 ✨ per turn per level |
| 🎖️ Barracks | 2⛏️ 1💎 2⚡ | L3 | **Required to recruit.** Yields 1/2/4 troops (L1/L2/L3) per recruit action, at 1⛏️ per troop |
| 🛡️ Shield Generator | 3💎 1⚡ | L3 | +4/+8/+12 defense (L1/L2/L3). Never destroyed by attacks |
| 🚀 Rocket Silo | 3⛏️ 1⚡ | L3 | **Required to attack.** Doubles rocket capacity each level (3→6→12→∞) and adds +2 strike per level |
| 🛰️ Spaceport | 1⛏️ 1💎 1⚡ | L2 | **Enables the 🛸 Move card.** L2: +1 free 🛸 Move card every 3 turns |
| 🤝 Embassy | 1⛏️ 1💎 1⚡ | L2 | **Enables trading.** L2: +1 ⭐ Influence every turn |
| 🔬 Research Lab | 3💎 2⚡ 3✨ | L3 | Prerequisite for the Singularity — the Singularity's level cannot exceed the Lab's level on the same planet |
| 🌀 Singularity | 4⛏️ 4💎 4⚡ 4✨ | L3 | **Raises your technology** (one = tech 2, two = tech 3) and grants +1 draft pick and +1 pool card per level |

Buildings are erected during the **draft** (by picking their card) and are **never destroyed** — a conquered planet's buildings serve the new owner.

---

## Combat

**Attacking requires a 🚀 Rocket Silo** — rockets launch only from your planets that have one, using **that planet's own garrison**. Armies belong to planets, not players.

- **Rocket capacity** = 3, doubled per Silo level (L1 → 6, L2 → 12, L3 → unlimited)
- **Strike power** = 2×troops aboard + 2 per Silo level + dice (0–3)
- **Defense power** = 2×troops + Shield defense (+4/+8/+12) + dice (0–3)

If the attacker wins:

- Winning the battle grants **no loot** by itself
- If the garrison is wiped out, the attacker **conquers the planet** — the surviving strike force becomes its garrison, and the conqueror salvages part of the loser's hand
- A freshly conquered planet is protected by a **3-turn truce** 🕊️ (cannot be attacked)
- A second planet gives room for a second Singularity — the road to **Tech 3**

If the attacker loses, most of the strike force is destroyed and the survivors fly home.

---

## Trading

Trading **requires a 🤝 Embassy**. Only **resources** may be exchanged — action and influence cards cannot. The initiator spends a 🔁 Trade card and earns **+1 ⭐ Influence** per accepted deal.

AI rivals broadcast which resource they are seeking and accept offers freely only if the offer provides it — for anything else they demand a heavily favourable deal. Rivals are also less willing to trade with whoever is currently leading.

---

## Influence

**⭐ Influence** is a separate per-player track — not a hand card. You earn it two ways:

- **+1** for every trade you initiate that gets accepted
- **+1 per turn** from a level-2 🤝 Embassy

From **turn 30**, every draft pool contains **2 influence cards**. Picking one pays its ⭐ cost and puts the card **in your hand** — you then play it **for free on any of your action turns**, whenever you choose (⭐ Influence button):

| Card | Cost | Effect |
|------|------|--------|
| 🕵️ Sabotage | 3⭐ | The rival with the **largest army** skips their next 2 turns |
| 🔥 Uprising | 3⭐ | The rival with the **most planets** skips their next 2 turns |
| 📰 Smear Campaign | 2⭐ | The rival with the **least influence** skips their next 2 turns |
| 🧪 Espionage | 3⭐ | The rival with the **highest technology** skips their next 2 turns |
| 🎭 Extortion | 2⭐ | Take **one action card of your choice** from a **chosen rival** (influence cards cannot be taken) |
| 🕊️ Peace Treaty | 4⭐ | All your planets are under truce for 3 turns |

Skip cards always hit a **rival** — never the player who plays the card — and the target is determined at **play time**, not draft time. A skipped player misses their draft and action phases, but their buildings still produce income. Influence cards cannot be traded or stolen.

---

## AI Personalities

Each game randomly selects 6 opponents from a roster of 17 characters:

| Personality | Tag | Play style |
|-------------|-----|-----------|
| Aggressor | WARLORD | Early military, then expansion |
| Builder | ARCHITECT | Economy first → technology |
| Hoarder | MERCHANT | Defensive + heavy trading |
| Balanced | TACTICIAN | Adapts to the situation |
| Militarist | CONQUEROR | All-in on Barracks + Silo levels |
| Fortifier | SENTINEL | Shields everywhere, then economy |
| Economist | MAGNATE | Maximise income before fighting |
| Expansionist | IMPERIALIST | Conquer for extra draft picks |
| Rusher | SEEKER | Race to the Singularity |
| Trader | BROKER | Embassy + trade-heavy economy |
| Opportunist | SCHEMER | Attacks leaders; trades with losers |
| Blitzer | BLITZ | All-out rush early, then pivots |
| Pacifist | PACIFIST | Never attacks; trades for everything |
| Random | CHAOTIC | Picks cards at random |

---

## Simulation

The repository includes `simulate.js`, a headless tournament runner built on the same `game.js` logic:

```bash
node simulate.js          # 5000 games, all 14 strategies
node simulate.js 2000     # custom game count
```

It reports win rates, timeout rates, and average game length for every strategy.

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Game page |
| `game.js` | All game logic + headless sim exports |
| `style.css` | UI styles |
| `simulate.js` | Strategy tournament runner |
| `idea.md` | Original design notes |

---

## Development Notes

- Pure vanilla JavaScript — no frameworks, no build step.
- `game.js` runs headless under Node.js for automated strategy testing (`?auto` in the URL makes the AI play the human seat in the browser).
- All AI logic lives in `game.js`; personalities are parameterised via `PRIORITIES` and per-personality branches in `aiDraftPick`, `aiPickAttack`, `aiPickInfluencePlay`, and `aiEvaluateTrade`.
