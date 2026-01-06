import { determineTrickWinner, getNextPlayer, getFirstBidder } from '../gameLogic';
import { nextPlayerAnticlockwise } from '../engine/PlayEngine';

// Game State Machine and Reducer
export const GAME_PHASES = {
  DEALING: 'dealing',
  BIDDING: 'bidding', 
  PLAYING: 'playing',
  FINISHED: 'finished',
  GAME_OVER: 'gameOver'
};

export const GAME_ACTIONS = {
  START_GAME: 'START_GAME',
  CARDS_DEALT: 'CARDS_DEALT',
  START_BIDDING: 'START_BIDDING',
  PLACE_BID: 'PLACE_BID',
  BIDDING_COMPLETE: 'BIDDING_COMPLETE',
  SELECT_TRUMP: 'SELECT_TRUMP',
  START_PLAYING: 'START_PLAYING',
  PLAY_CARD: 'PLAY_CARD',
  ADD_CARD_TO_TRICK_AREA: 'ADD_CARD_TO_TRICK_AREA',
  TRICK_COMPLETE: 'TRICK_COMPLETE',
  ADVANCE_AFTER_TRICK: 'ADVANCE_AFTER_TRICK',
  ROUND_COMPLETE: 'ROUND_COMPLETE',
  START_NEW_ROUND: 'START_NEW_ROUND',
  GAME_OVER: 'GAME_OVER',
  RESET_GAME: 'RESET_GAME'
};

export const initialGameState = {
  // Game Phase Management
  phase: GAME_PHASES.DEALING,
  round: 1,
  dealer: 0, // Player index who deals
  
  // Players
  players: Array(4).fill(null).map((_, index) => ({
    id: index,
    name: `Player ${index + 1}`,
    hand: [],
    isHuman: index === 2, // Player 3 (index 2) is human
    isDealer: index === 0,
    hasPassedBidding: false
  })),
  
  // Bidding State
  bidding: {
    currentBidder: 0,
    highestBid: 6, // Minimum bid in Tarneeb (7 is actual minimum)
    highestBidder: null,
    bids: [], // Array of {player, amount, suit}
    passCount: 0,
    biddingRound: 1, // Track bidding rounds
    playersStillBidding: [0, 1, 2, 3] // Players who can still bid
  },
  
  // Contract (result of bidding)
  contract: {
    declarer: null,
    amount: 0,
    trumpSuit: null,
    declarerTeam: null
  },
  
  // Playing State
  playing: {
    currentPlayer: 0,
    leader: 0, // Who leads the current trick
    currentTrick: [],
    previousTrick: [], // Store the last completed trick
    trickNumber: 1,
    leadSuit: null,
    settling: false,
    pendingAdvance: null,
    trickJustCompleted: false
  },
  
  // Scoring
  teams: {
    team1: { // Players 0 & 2
      players: [0, 2],
      tricks: 0,
      score: 0,
      roundScore: 0
    },
    team2: { // Players 1 & 3  
      players: [1, 3],
      tricks: 0,
      score: 0,
      roundScore: 0
    }
  },
  
  // Game Settings
  winningScore: 31, // Game ends when a team reaches 31 points
  
  // Per-player trick counts for UI
  playerTricks: { 0: 0, 1: 0, 2: 0, 3: 0 },
  
  // Score History - tracks each round's results
  scoreHistory: [],
  
  // Animation and UI state
  animations: {
    trickAreaCards: [],
    playedCardAnimations: {
      0: { x: 0, y: 0 },
      1: { x: 0, y: 0 },
      2: { x: 0, y: 0 },
      3: { x: 0, y: 0 }
    }
  }
};

export const gameReducer = (state, action) => {
  switch (action.type) {
    case GAME_ACTIONS.START_GAME:
      return {
        ...initialGameState,
        phase: GAME_PHASES.DEALING
      };
      
    case GAME_ACTIONS.CARDS_DEALT: {
      // Calculate first bidder: player to the right of dealer (anticlockwise)
      const firstBidder = getFirstBidder(state.dealer); // right of dealer (anticlockwise)
      // Backward-compatible payload: accept {hands} or {players}
      const { hands, players: dealtPlayers } = action.payload || {};
      let nextPlayers;
      if (Array.isArray(hands)) {
        nextPlayers = state.players.map((p, i) => ({
          ...p,
          hand: hands[i] || [],
          hasPassedBidding: false
        }));
      } else if (Array.isArray(dealtPlayers)) {
        nextPlayers = dealtPlayers;
      } else {
        nextPlayers = state.players;
      }
      return {
        ...state,
        players: nextPlayers,
        phase: GAME_PHASES.BIDDING,
        bidding: {
          ...state.bidding,
          currentBidder: firstBidder,
          playersStillBidding: [0, 1, 2, 3],
          biddingRound: 1
        }
      };
    }
      
    case GAME_ACTIONS.PLACE_BID: {
      // Backward-compatible payload: tests may send {playerIndex, amount} and amount=0 meaning pass
      const { player, playerIndex, amount, suit } = action.payload;
      const bidder = typeof player === 'number' ? player : playerIndex;
      const isPassing = suit === 'pass' || amount === 0;
      const bidAmount = isPassing ? state.bidding.highestBid : amount;
      const bidSuit = isPassing ? 'pass' : suit;
      const newBids = [...state.bidding.bids, { player: bidder, amount: isPassing ? 0 : amount, suit: bidSuit }];
      const isHigherBid = !isPassing && amount > state.bidding.highestBid;
      
      // Update players still bidding - remove player if they pass
      let updatedPlayersStillBidding = [...state.bidding.playersStillBidding];
      if (isPassing) {
        updatedPlayersStillBidding = updatedPlayersStillBidding.filter(p => p !== bidder);
      }
      
      // Calculate next bidder (anticlockwise)
      let nextBidder = getNextPlayer(state.bidding.currentBidder, 'anticlockwise');
      
      // Skip players who have passed
      while (updatedPlayersStillBidding.length > 1 && !updatedPlayersStillBidding.includes(nextBidder)) {
        nextBidder = getNextPlayer(nextBidder, 'anticlockwise');
      }
      
      return {
        ...state,
        bidding: {
          ...state.bidding,
          bids: newBids,
          highestBid: isHigherBid ? amount : state.bidding.highestBid,
          highestBidder: isHigherBid ? bidder : state.bidding.highestBidder,
          currentBidder: nextBidder,
          passCount: isPassing ? state.bidding.passCount + 1 : state.bidding.passCount,
          playersStillBidding: updatedPlayersStillBidding
        },
        players: state.players.map(p => 
          p.id === bidder 
            ? { ...p, hasPassedBidding: isPassing }
            : p
        )
      };
    }
      
    case GAME_ACTIONS.BIDDING_COMPLETE:
      // Bidding is complete when only one player is left or all have passed
      let highestBidder = state.bidding.highestBidder;
      let contractAmount = state.bidding.highestBid;

      // If no one bid (all passed), dealer is forced to bid 7
      if (highestBidder === null || contractAmount < 7) {
        highestBidder = state.dealer;
        contractAmount = 7;
      }
      
      return {
        ...state,
        phase: GAME_PHASES.BIDDING, // Stay in bidding phase until trump is selected
        bidding: {
          ...state.bidding,
          currentBidder: highestBidder
        },
        contract: {
          declarer: highestBidder,
          amount: contractAmount,
          trumpSuit: null, // Will be set when trump is selected
          declarerTeam: [0, 2].includes(highestBidder) ? 'team1' : 'team2'
        }
      };
      
    case GAME_ACTIONS.SELECT_TRUMP: {
      const { trumpSuit } = action.payload;
      
      // Ensure contract has declarer and amount set based on bidding if not already
      const declarer = state.contract.declarer ?? state.bidding.highestBidder;
      const computedAmount = state.contract.amount && state.contract.amount > 0 ? state.contract.amount : state.bidding.highestBid;
      const declarerTeam = [0, 2].includes(declarer) ? 'team1' : 'team2';
      
      return {
        ...state,
        phase: GAME_PHASES.PLAYING,
        contract: {
          declarer,
          amount: computedAmount,
          trumpSuit,
          declarerTeam
        },
        playing: {
          ...state.playing,
          // Anticlockwise play order starts with the declarer (tarneeb picker)
          currentPlayer: declarer,
          leader: declarer
        }
      };
    }
      
    case GAME_ACTIONS.PLAY_CARD: {
      const { playerIndex, card } = action.payload;

      // Global guards to prevent race/double-play issues
      if (state.phase !== GAME_PHASES.PLAYING) return state;
      if (state.playing.settling) return state; // block during settle freeze
      if (state.playing.currentTrick.length >= 4) return state; // table full
      if (playerIndex !== state.playing.currentPlayer) return state; // not this player's turn

      // Reducer-level legal play validation (airtight state machine)
      const leadSuitNow = state.playing.leadSuit || card.suit; // if first card, it's legal and sets lead
      // Ensure player actually holds the card (prevents double-dispatch race)
      const hasCardInHand = state.players[playerIndex].hand.some(c => c.suit === card.suit && c.label === card.label);
      if (!hasCardInHand) {
        return state;
      }
      if (state.playing.leadSuit) {
        const hasLeadSuit = state.players[playerIndex].hand.some(c => c.suit === state.playing.leadSuit);
        if (hasLeadSuit && card.suit !== state.playing.leadSuit) {
          // Illegal play attempt; ignore action
          return state;
        }
      }

      const newTrick = [...state.playing.currentTrick, { player: playerIndex, card }];
      const isFirstCard = state.playing.currentTrick.length === 0;
      const trickComplete = newTrick.length === 4;
      
      let nextState = {
        ...state,
        // Do NOT remove the card from hand here; wait until animation completes
        // Removal happens in ADD_CARD_TO_TRICK_AREA to keep the card visible during animation
        players: state.players, 
        playing: {
          ...state.playing,
          currentTrick: newTrick,
          currentPlayer: trickComplete ? state.playing.currentPlayer : nextPlayerAnticlockwise(state.playing.currentPlayer),
          leadSuit: isFirstCard ? card.suit : state.playing.leadSuit,
          trickJustCompleted: trickComplete, // Phase 1 fix: surface completion to UI
        },
        animations: {
          ...state.animations,
          // Don't add to trickAreaCards yet - wait for animation to complete
          trickAreaCards: state.animations.trickAreaCards
        }
      };
      
      // If trick is complete, determine winner and update state
      if (trickComplete) {
        // When trick completes, freeze the table for 0.5s before clearing
        // by setting settling=true and storing pendingAdvance.

        const trickCards = newTrick.map(t => t.card);
        const winnerIndex = determineTrickWinner(trickCards, state.contract.trumpSuit, state.playing.leadSuit);
        const winner = newTrick[winnerIndex].player;
        const winnerTeam = [0, 2].includes(winner) ? 'team1' : 'team2';
        const newTrickCount = nextState.teams[winnerTeam].tricks + 1;
        const roundComplete = nextState.playing.trickNumber >= 13;
        
        // increment per-player trick count
        const updatedPlayerTricks = { ...nextState.playerTricks, [winner]: (nextState.playerTricks[winner] || 0) + 1 };
        
        nextState = {
          ...nextState,
          playerTricks: updatedPlayerTricks,
          teams: {
            ...nextState.teams,
            [winnerTeam]: {
              ...nextState.teams[winnerTeam],
              tricks: newTrickCount
            }
          },
          playing: {
            ...nextState.playing,
            // keep cards on table
            currentTrick: newTrick,
            currentPlayer: nextState.playing.currentPlayer, // freeze turn
            leader: nextState.playing.leader,
            trickNumber: nextState.playing.trickNumber,
            leadSuit: nextState.playing.leadSuit,
            settling: true,
            pendingAdvance: { winner },
            trickJustCompleted: true, // Phase 1 fix: ensure flag is set when trick completes
          }
        };
        
        // Schedule advance after 0.5s via an external timer (handled in GameScreen)
        // Keep round completion logic in ADVANCE_AFTER_TRICK path.
        // Check if round is complete (13 tricks played)
        if (roundComplete) {
          // Calculate round scores based on contract
          const declarerTeam = state.contract.declarerTeam;
          const contractAmount = state.contract.amount;
          const declarerTricks = nextState.teams[declarerTeam].tricks;
          const otherTeam = declarerTeam === 'team1' ? 'team2' : 'team1';
          const otherTricks = nextState.teams[otherTeam].tricks;
          
          let team1Score = 0;
          let team2Score = 0;
          
          // Declarer team scoring
          if (declarerTricks >= contractAmount) {
            // Made the contract - declarer team gets actual tricks; defenders get 0 (variant rule)
            if (declarerTeam === 'team1') {
              team1Score = declarerTricks;
              team2Score = 0;
            } else {
              team2Score = declarerTricks;
              team1Score = 0;
            }
          } else {
            // Failed the contract - declarer team loses contract amount; defenders get their tricks
            if (declarerTeam === 'team1') {
              team1Score = -contractAmount;
              team2Score = otherTricks;
            } else {
              team2Score = -contractAmount;
              team1Score = otherTricks;
            }
          }
          
          const newTeam1Total = nextState.teams.team1.score + team1Score;
          const newTeam2Total = nextState.teams.team2.score + team2Score;
          const gameOver = newTeam1Total >= nextState.winningScore || newTeam2Total >= nextState.winningScore;
          
          // Create history entry for this round
          const historyEntry = {
            round: state.round,
            team1Change: team1Score,
            team2Change: team2Score,
            team1Total: newTeam1Total,
            team2Total: newTeam2Total,
            contract: {
              declarer: state.contract.declarer,
              amount: contractAmount,
              trumpSuit: state.contract.trumpSuit,
              declarerTeam: declarerTeam
            },
            contractMade: declarerTricks >= contractAmount,
            declarerTricks: declarerTricks,
            defenderTricks: otherTricks
          };
          
          nextState = {
            ...nextState,
            phase: gameOver ? GAME_PHASES.GAME_OVER : GAME_PHASES.FINISHED,
            teams: {
              team1: {
                ...nextState.teams.team1,
                score: newTeam1Total,
                roundScore: team1Score
              },
              team2: {
                ...nextState.teams.team2,
                score: newTeam2Total,
                roundScore: team2Score
              }
            },
            scoreHistory: [...state.scoreHistory, historyEntry]
          };
        }
      }
      
      return nextState;
      
    }
    case GAME_ACTIONS.TRICK_COMPLETE:
      // Deprecated path; not used when using settling delay.
      // Keeping the logic for compatibility if dispatched elsewhere.

      const { winner } = action.payload;
      const winnerTeam = [0, 2].includes(winner) ? 'team1' : 'team2';
      
      return {
        ...state,
        teams: {
          ...state.teams,
          [winnerTeam]: {
            ...state.teams[winnerTeam],
            tricks: state.teams[winnerTeam].tricks + 1
          }
        },
        playing: {
          ...state.playing,
          currentTrick: [],
          currentPlayer: winner,
          leader: winner,
          trickNumber: state.playing.trickNumber + 1,
          leadSuit: null
        },
        animations: {
          ...state.animations,
          trickAreaCards: []
        }
      };
      
    case GAME_ACTIONS.ROUND_COMPLETE:
      // Support optional payload; if absent, compute scores from current state
      let t1 = 0;
      let t2 = 0;
      const declarerTeamRC = state.contract.declarerTeam;
      const contractAmountRC = state.contract.amount;
      if (action.payload && typeof action.payload.team1Score === 'number' && typeof action.payload.team2Score === 'number') {
        t1 = action.payload.team1Score;
        t2 = action.payload.team2Score;
      } else {
        // Compute scores similar to end-of-round logic in PLAY_CARD when roundComplete
        const declarerTricks = state.teams[declarerTeamRC].tricks;
        const otherTeam = declarerTeamRC === 'team1' ? 'team2' : 'team1';
        const otherTricks = state.teams[otherTeam].tricks;
        if (declarerTricks >= contractAmountRC) {
          if (declarerTeamRC === 'team1') {
            t1 = declarerTricks;
            t2 = 0;
          } else {
            t2 = declarerTricks;
            t1 = 0;
          }
        } else {
          if (declarerTeamRC === 'team1') {
            t1 = -contractAmountRC;
            t2 = otherTricks;
          } else {
            t2 = -contractAmountRC;
            t1 = otherTricks;
          }
        }
      }
      const newTeam1Score = state.teams.team1.score + t1;
      const newTeam2Score = state.teams.team2.score + t2;
      
      // Check if any team has reached the winning score (31)
      const gameOver = newTeam1Score >= state.winningScore || newTeam2Score >= state.winningScore;
      
      // Create history entry
      const contractMadeRC = state.teams[declarerTeamRC].tricks >= contractAmountRC;
      const otherTeamRC = declarerTeamRC === 'team1' ? 'team2' : 'team1';
      const historyEntryRC = {
        round: state.round,
        team1Change: t1,
        team2Change: t2,
        team1Total: newTeam1Score,
        team2Total: newTeam2Score,
        contract: {
          declarer: state.contract.declarer,
          amount: contractAmountRC,
          trumpSuit: state.contract.trumpSuit,
          declarerTeam: declarerTeamRC
        },
        contractMade: contractMadeRC,
        declarerTricks: state.teams[declarerTeamRC].tricks,
        defenderTricks: state.teams[otherTeamRC].tricks
      };
      
      return {
        ...state,
        phase: gameOver ? GAME_PHASES.GAME_OVER : GAME_PHASES.FINISHED,
        teams: {
          team1: {
            ...state.teams.team1,
            score: newTeam1Score,
            roundScore: t1
          },
          team2: {
            ...state.teams.team2,
            score: newTeam2Score,
            roundScore: t2
          }
        },
        scoreHistory: [...state.scoreHistory, historyEntryRC]
      };

      
    case GAME_ACTIONS.START_NEW_ROUND:
      const newDealer = (state.dealer + 1) % 4;
      
      return {
        ...state,
        phase: GAME_PHASES.DEALING,
        round: state.round + 1,
        dealer: newDealer,
        players: state.players.map((p, index) => ({
          ...p,
          hand: [],
          isDealer: index === newDealer,
          hasPassedBidding: false
        })),
        playerTricks: { 0: 0, 1: 0, 2: 0, 3: 0 },
        bidding: {
          currentBidder: getFirstBidder(newDealer),
          highestBid: 6,
          highestBidder: null,
          bids: [],
          passCount: 0,
          biddingRound: 1,
          playersStillBidding: [0, 1, 2, 3]
        },
        contract: {
          declarer: null,
          amount: 0,
          trumpSuit: null,
          declarerTeam: null
        },
        playing: {
          currentPlayer: 0,
          leader: 0,
          currentTrick: [],
          previousTrick: [],
          trickNumber: 1,
          leadSuit: null,
          settling: false,
          pendingAdvance: null,
          trickJustCompleted: false, // Phase 1 fix: reset flag for new round
        },
        teams: {
          team1: { ...state.teams.team1, tricks: 0, roundScore: 0 },
          team2: { ...state.teams.team2, tricks: 0, roundScore: 0 }
        },
        animations: {
          ...state.animations,
          trickAreaCards: [],
          playedCardAnimations: {
            0: { x: 0, y: 0 },
            1: { x: 0, y: 0 },
            2: { x: 0, y: 0 },
            3: { x: 0, y: 0 }
          }
        }
      };
      
    case GAME_ACTIONS.ADD_CARD_TO_TRICK_AREA:
      // Add card to trick area after animation completes
      const { card: animatedCard, playerIndex: animatedPlayerIndex } = action.payload;
      return {
        ...state,
        // Now remove the card from the player's hand after animation completes
        players: state.players.map(p => 
          p.id === animatedPlayerIndex 
            ? { ...p, hand: p.hand.filter(c => !(c.suit === animatedCard.suit && c.label === animatedCard.label)) }
            : p
        ),
        animations: {
          ...state.animations,
          trickAreaCards: [...state.animations.trickAreaCards, {
            card: animatedCard,
            playerIndex: animatedPlayerIndex,
            id: Date.now() + Math.random()
          }]
        }
      };

    case GAME_ACTIONS.ADVANCE_AFTER_TRICK: {
      const { winner } = action.payload;
      let nextState = { ...state };
      const roundComplete = nextState.playing.trickNumber >= 13;

      // Store the current trick as previous trick before clearing
      const previousTrick = [...nextState.playing.currentTrick];

      // Clear the table and advance
      nextState = {
        ...nextState,
        playing: {
          ...nextState.playing,
          currentTrick: [],
          previousTrick: previousTrick,
          currentPlayer: winner,
          leader: winner,
          trickNumber: nextState.playing.trickNumber + 1,
          leadSuit: null,
          settling: false,
          pendingAdvance: null,
          trickJustCompleted: false, // Phase 1 fix: clear flag after advancing
        },
        animations: {
          ...nextState.animations,
          trickAreaCards: []
        }
      };

      return nextState;
    }

    case GAME_ACTIONS.RESET_GAME:
      return initialGameState;
      
    default:
      return state;
  }
};