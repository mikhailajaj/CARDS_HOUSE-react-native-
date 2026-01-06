# Mermaid Diagrams: Tarneeb Game Flow and AI Design

This document contains a set of Mermaid diagrams that illustrate:
- High-level game flow hierarchy
- State machine details (phases and transitions)
- Bidding sequence and rules
- Playing/trick sequence
- AI decision flow for playing a card
- Module/component architecture


## 1) High-level Game Flow (Hierarchy)
```mermaid
flowchart TD
  A[Start Game] --> B[Deal Cards]
  B --> C[Bidding]
  C -->|Highest bidder determined| D[Select Trump]
  D --> E[Playing 13 Tricks]
  E --> F[Score Round]
  F -->|Any team >= 31| G[Game Over]
  F -->|Otherwise| H[Next Round]
  H --> B
```


## 2) State Machine (Phases and Transitions)
```mermaid
stateDiagram-v2
  [*] --> DEALING
  DEALING --> BIDDING: CARDS_DEALT
  BIDDING --> BIDDING: PLACE_BID
  BIDDING --> BIDDING: BIDDING_COMPLETE (await trump selection)
  BIDDING --> PLAYING: SELECT_TRUMP
  PLAYING --> PLAYING: PLAY_CARD
  PLAYING --> FINISHED: Round complete (13 tricks)
  FINISHED --> DEALING: START_NEW_ROUND
  FINISHED --> GAME_OVER: Team score >= 31
  GAME_OVER --> [*]
```


## 3) Bidding Sequence (Right-of-Dealer, Anticlockwise)
```mermaid
sequenceDiagram
  autonumber
  participant R as Reducer
  participant M as Bidding Modal
  participant P4 as Player 4 (right of dealer)
  participant P1 as Player 1 (dealer-1 anticlockwise)
  participant P2 as Player 2
  participant P3 as Player 3

  Note over R: dealer set and first bidder=right of dealer
  R->>M: phase=BIDDING, currentBidder=P4
  alt AI Bidder
    M->>R: PLACE_BID (bid/pass)
  else Human Bidder
    M->>R: PLACE_BID (bid/pass)
  end
  loop Anticlockwise Until One Remains
    R-->>M: Update highestBid/highestBidder, nextBidder
    M-->>R: PLACE_BID (bid/pass)
  end
  Note over R: BIDDING_COMPLETE -> set contract.declarer & amount
  alt Declarer is Human
    M->>R: SELECT_TRUMP (user picks suit)
  else Declarer is AI
    M->>R: SELECT_TRUMP (AI picks suit)
  end
```


## 4) Playing / Trick Sequence
```mermaid
sequenceDiagram
  autonumber
  participant R as Reducer
  participant T as Trick Area
  participant P as Current Player

  Note over R: After SELECT_TRUMP -> leader=currentPlayer=declarer
  loop For each trick (1..13)
    Note right of P: Must follow suit if possible
    P->>R: PLAY_CARD(card)
    R-->>T: Add card to currentTrick + animation
    alt Trick not complete
      R->>R: currentPlayer = nextPlayerAnticlockwise
    else Trick complete (4 cards)
      R->>R: Determine winner (tarneeb rules)
      R->>R: Winner team.tricks++
      R->>R: leader=currentPlayer=winner, trickNumber++
      R-->>T: Clear trick animations
    end
  end
  R->>R: Compute round scores vs contract
  alt Any team >= 31
    R->>R: phase = GAME_OVER
  else
    R->>R: phase = FINISHED (show round result)
  end
```


## 5) AI Decision Flow for Playing a Card
```mermaid
flowchart TD
  A[Choose AI Card] --> B{Position in Trick}
  B -->|0 (Lead)| L0
  B -->|1 (Second)| L1
  B -->|2 (Third)| L2
  B -->|3 (Fourth)| L3

  L0[Lead] --> C{Many trumps (>=5)?}
  C -->|Yes| C1[Lead lowest trump]
  C -->|No| C2[Pick strongest non-trump suit (AK+length)]
  C2 --> C3[Lead highest of that suit]

  L1[Second] --> D{Can follow suit?}
  D -->|Yes| D1[Win with minimal higher vs lead if possible]
  D -->|No| D2{Have trump?}
  D2 -->|Yes| D3[Play lowest trump]
  D2 -->|No| D4[Discard lowest]

  L2[Third] --> E{Is partner winning now?}
  E -->|Yes| E1[Conserve: lowest following suit else lowest non-trump]
  E -->|No| E2[Try minimal winning card]

  L3[Fourth] --> F{Is partner winning now?}
  F -->|Yes| F1[Conserve: lowest legal, prefer low of lead suit]
  F -->|No| F2[Win with cheapest winning card]
```


## 6) Module/Component Architecture
```mermaid
classDiagram
  class GameScreen {
    +useReducer(gameReducer)
    +AI move effect (uses PlayEngine)
    +Bidding modal integration
  }
  class GameReducer {
    +phase: DEALING|BIDDING|PLAYING|FINISHED|GAME_OVER
    +dealer, round
    +bidding{ currentBidder, highestBid, highestBidder, playersStillBidding }
    +contract{ declarer, amount, trumpSuit, declarerTeam }
    +playing{ currentPlayer, leader, currentTrick, trickNumber, leadSuit }
    +teams{ team1, team2 }
    +PLACE_BID / SELECT_TRUMP / PLAY_CARD / etc.
  }
  class PlayEngine {
    +nextPlayerClockwise()
    +legalCardsFor(hand, leadSuit)
    +chooseAiCardSmart(ctx)
  }
  class BiddingStrategy {
    +evaluateHandStrength(hand)
    +evaluateBid(hand, highestBid, highestBidder, currentBidder)
    +chooseTrumpSuit(hand)
  }
  class BiddingModal {
    +AI auto-bid & trump select
    +Human bid & trump select
  }
  class GameValidation {
    +isLegalPlay(card, hand, leadSuit)
    +validateGameState(state)
  }

  GameScreen --> GameReducer : dispatch actions
  GameScreen --> PlayEngine : AI card selection
  GameScreen --> BiddingModal : show/hide & callbacks
  GameReducer --> PlayEngine : nextPlayerAnticlockwise
  BiddingModal --> BiddingStrategy : AI bidding & trump
  GameScreen --> GameValidation : pre-validate plays
  GameReducer --> GameValidation : reducer-level validation
```

Notes
- Bidding and playing both proceed anticlockwise. First bidder is to the right of the dealer (dealer bids last). Declarer selects tarneeb and leads first.
- Reducer enforces legal play even if UI/AI attempts off-suit when following suit is possible.
- AI “don’t waste high cards” rules are baked into position-aware choices and partner-winning checks.
