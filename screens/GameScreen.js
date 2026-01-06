import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, Button, Text, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Player from '../components/Player';
import PlayerMessage from '../components/PlayerMessage';
import TrickArea from '../components/TrickArea';
import TrumpDisplay from '../components/TrumpDisplay';
import PlayerCircles from '../components/PlayerCircles';
import PreviousTrick from '../components/PreviousTrick';
import ScoreTracker from '../components/ScoreTracker';
import AnimatingCardsOverlay from '../components/AnimatingCardsOverlay';
import Bidding from '../Bidding';
import { gameReducer, initialGameState, GAME_ACTIONS, GAME_PHASES } from '../utils/state/GameReducer';
import { createDeck, shuffleDeck, dealCards } from '../utils/gameLogic';
import { chooseAiCardSmart } from '../utils/engine/PlayEngine';
import { isLegalPlay, validateGameState, logTestResults } from '../utils/gameValidation';
import { evaluateBid, chooseTrumpSuit } from '../utils/biddingStrategy';
import { useSettings } from '../utils/SettingsContext';
import { useScoreHistory } from '../utils/ScoreHistoryContext';
import { 
  getCardPositionInHand, 
  generateAnimationId,
  getScreenDimensions 
} from '../utils/cardAnimationHelpers';
// Dev trace flag for AI bidding decisions
const __AI_BID_TRACE__ = true;

const GameScreen = ({ navigation }) => {
  // Phase 1 fix: Track in-flight animations to guard effects and coordination
  const [animationsInProgress, setAnimationsInProgress] = useState(0);
  const { settings, isLoaded } = useSettings();
  const { scoreHistory, addScoreEntry, clearScoreHistory, isLoaded: isScoreHistoryLoaded } = useScoreHistory();
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const aiGuardRef = useRef(false);
  const humanTimeoutRef = useRef(null);

  // Player messages state
  const [playerMessages, setPlayerMessages] = useState({
    0: { message: '', visible: false },
    1: { message: '', visible: false },
    2: { message: '', visible: false },
    3: { message: '', visible: false },
  });

  // Animation state
  const [animatingCards, setAnimatingCards] = useState([]);
  const [screenDimensions, setScreenDimensions] = useState({ width: 400, height: 800 });
  const containerRef = useRef(null);

  // Handle screen layout for position calculations
  const handleLayout = useCallback((event) => {
    console.log('[ANIMATION] In progress:', animationsInProgress); // Phase 1 fix: debug counter

    const { width, height } = event.nativeEvent.layout;
    setScreenDimensions({ width, height });
  }, []);

  // Wait for settings and score history to load before rendering
  if (!isLoaded || !isScoreHistoryLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.modalContainer}>
          <Text style={{ color: '#f4d03f', fontSize: 18 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  const handleStartGame = () => {
    setIsModalVisible(false);
    
    // Clear score history from previous games
    clearScoreHistory();
    
    dispatch({ type: GAME_ACTIONS.START_GAME });

    // Create and deal cards
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const hands = dealCards(shuffledDeck);

    // Create players with dealt hands
    const playersWithHands = gameState.players.map((player, index) => ({
      ...player,
      hand: hands[index] || []
    }));

    dispatch({
      type: GAME_ACTIONS.CARDS_DEALT,
      payload: { players: playersWithHands }
    });

    // Show game start message
    setTimeout(() => {
      showPlayerMessage(0, 'P1: Bidding starts!', 1500);
    }, 500);
  };

  // Selected card for human pre-play
  const [selectedCard, setSelectedCard] = useState(null);
  const commitInProgressRef = useRef(false);

  const handleCardPress = (card, playerIndex) => {
    // Guard against rapid double taps while a commit is in-flight
    if (commitInProgressRef.current) return;
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (gameState.playing.settling) return; // block input during settle delay
    if (gameState.playing.currentTrick.length >= 4) return; // block while 4 cards are shown

    // Only human can preselect
    if (!gameState.players[playerIndex]?.isHuman) return;

    // Toggle selection: deselect if same card; otherwise replace selection with the new card
    if (selectedCard && selectedCard.suit === card.suit && selectedCard.label === card.label) {
      setSelectedCard(null);
      return;
    }
    setSelectedCard(card);
    // Do not auto-dispatch here; a separate effect will commit when it's the human's turn
  };

  const handleBid = (playerIndex, amount, bidType) => {
    if (__AI_BID_TRACE__) {
      const actor = gameState.players[playerIndex];
      console.log('[AI-BID]', {
        playerIndex,
        name: actor?.name,
        bidType,
        amount,
        highestBid: gameState.bidding.highestBid,
        highestBidder: gameState.bidding.highestBidder,
      });
    }
    // Show bidding message
    const message = bidType === 'pass' ? `P${playerIndex + 1}: Pass` : `P${playerIndex + 1}: ${amount} ${bidType}`;
    showPlayerMessage(playerIndex, message, 1500);

    dispatch({
      type: GAME_ACTIONS.PLACE_BID,
      payload: { player: playerIndex, amount, suit: bidType }
    });
  };

  const handleBiddingComplete = () => {
    dispatch({ type: GAME_ACTIONS.BIDDING_COMPLETE });
  };

  const handleTrumpSelect = (trumpSuit) => {
    // Show trump selection message
    const trumpSymbols = {
      'Spades': '♠',
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣'
    };
    const message = `P${gameState.contract.declarer + 1}: Trump: ${trumpSymbols[trumpSuit] || trumpSuit}`;
    showPlayerMessage(gameState.contract.declarer, message, 2000);

    dispatch({
      type: GAME_ACTIONS.SELECT_TRUMP,
      payload: { trumpSuit }
    });
  };

  const handleNewRound = () => {
    dispatch({ type: GAME_ACTIONS.START_NEW_ROUND });

    // Deal new cards
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const hands = dealCards(shuffledDeck);

    const playersWithHands = gameState.players.map((player, index) => ({
      ...player,
      hand: hands[index] || [],
      hasPassedBidding: false
    }));

    dispatch({
      type: GAME_ACTIONS.CARDS_DEALT,
      payload: { players: playersWithHands }
    });
  };

  const handlePlayAgain = () => {
    dispatch({ type: GAME_ACTIONS.RESET_GAME });
    setIsModalVisible(true);
  };

  const handleExitGame = () => {
    navigation.goBack();
  };

  const handlePlayerTimeUp = (playerIndex) => {
    // Auto-play a card for the player using AI
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (gameState.playing.currentPlayer !== playerIndex) return;
    if (gameState.playing.settling) return; // block during settle delay
    if (gameState.playing.currentTrick.length >= 4) return; // table full

    const currentPlayer = gameState.players[playerIndex];
    if (currentPlayer && currentPlayer.hand && currentPlayer.hand.length > 0) {
      const card = chooseAiCardSmart({
        hand: currentPlayer.hand,
        trick: gameState.playing.currentTrick,
        leadSuit: gameState.playing.leadSuit,
        trumpSuit: gameState.contract.trumpSuit,
        playerIndex: playerIndex,
        players: gameState.players,
      });

      if (card) {
        const validation = isLegalPlay(card, currentPlayer.hand, gameState.playing.leadSuit);
        if (validation.valid) {
          showPlayerMessage(playerIndex, `P${playerIndex + 1}: Time up! Auto-played`, 2000);
          dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex, card } });
        }
      }
    }
  };

  // Function to show player messages
  const showPlayerMessage = useCallback((playerIndex, message, duration = 3000) => {
    setPlayerMessages(prev => ({
      ...prev,
      [playerIndex]: { message, visible: true }
    }));

    // Auto hide after duration
    setTimeout(() => {
      setPlayerMessages(prev => ({
        ...prev,
        [playerIndex]: { message: '', visible: false }
      }));
    }, duration);
  }, []);

  // Function to trigger card animation
  // Use a ref to store the latest version to avoid stale closures
  const triggerCardAnimationRef = useRef();
  
  const triggerCardAnimation = useCallback((playerIndex, card, cardIndexInHand) => {
    console.log('🎯 triggerCardAnimation called');
    console.log('   Player Index:', playerIndex);
    console.log('   Card:', card?.label, 'of', card?.suit);
    console.log('   Card Index in Hand:', cardIndexInHand);
    
    // Phase 1 fix: increment animation counter before starting
    setAnimationsInProgress(prev => {
      console.log('   Setting animations in progress from', prev, 'to', prev + 1);
      return prev + 1;
    });

    const animationId = generateAnimationId();
    const player = gameState.players[playerIndex];
    const totalCards = player?.hand?.length || 0;
    
    console.log('   Player data:', player?.name, 'Hand length:', totalCards);

    // Calculate from and to positions
    const fromPosition = getCardPositionInHand(
      playerIndex, 
      cardIndexInHand, 
      totalCards, 
      screenDimensions
    );
    // Destination will be computed in AnimatingCard via shared helper; keep playerIndex

    // Determine card width based on player
    const cardWidth = playerIndex === 2 ? 110 : 80; // Human player has larger cards

    // Log animation trigger
    try {
      console.log('🎬 ANIMATION TRIGGERED');
      console.log(`   Player: ${playerIndex} (${player?.name})`);
      if (card) {
        console.log(`   Card: ${card.label} of ${card.suit}`);
      }
      console.log(`   Card Index in Hand: ${cardIndexInHand}/${totalCards}`);
      console.log(`   Starting Position: (${Math.round(fromPosition.x)}, ${Math.round(fromPosition.y)})`);
      console.log(`   Card Width: ${cardWidth}px`);
      console.log(`   Animation ID: ${animationId}`);
      console.log('─────────────────────────────────────────\n');
    } catch (e) {
      console.log('[GameScreen] Animation trigger logging error:', e?.message || e);
    }

    // Add to animating cards
    const newAnimatingCard = {
      id: animationId,
      card,
      playerIndex,
      fromPosition,
      cardWidth,
    };

    setAnimatingCards(prev => {
      const updated = [...prev, newAnimatingCard];
      console.log('   ➕ Added to animating cards. Total:', updated.length);
      return updated;
    });

    // Return animation ID for tracking
    return animationId;
  }, [gameState.players, screenDimensions]);
  
  // Store the latest version in ref to avoid stale closures
  useEffect(() => {
    triggerCardAnimationRef.current = triggerCardAnimation;
  }, [triggerCardAnimation]);

  // Handle animation completion
  const handleAnimationComplete = useCallback((animationId) => {
    // Phase 1 fix: decrement animation counter on completion
    setAnimationsInProgress(prev => prev - 1);

    // Find the animation data before removing it
    const completedAnimation = animatingCards.find(anim => anim.id === animationId);
    
    // Remove the completed animation from state
    setAnimatingCards(prev => prev.filter(anim => anim.id !== animationId));
    
    // Now dispatch an action to add the card to the trick area
    if (completedAnimation) {
      dispatch({ 
        type: GAME_ACTIONS.ADD_CARD_TO_TRICK_AREA, 
        payload: { 
          card: completedAnimation.card, 
          playerIndex: completedAnimation.playerIndex 
        } 
      });
    }
  }, [animatingCards]);

  // Show current bidder indicator and handle AI bidding
  useEffect(() => {
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.BIDDING) return;
    if (animationsInProgress > 0) return;
    if (gameState.phase === GAME_PHASES.BIDDING && gameState.bidding.currentBidder !== null) {
      const currentPlayer = gameState.players[gameState.bidding.currentBidder];
      if (currentPlayer?.isHuman) {
        showPlayerMessage(gameState.bidding.currentBidder, `P${gameState.bidding.currentBidder + 1}: Your turn`, 2000);
      } else {
        // Handle AI bidding
        const timer = setTimeout(() => {
          const aiPlayer = gameState.players[gameState.bidding.currentBidder];
          const hand = aiPlayer?.hand || [];
          const decision = evaluateBid(hand, gameState.bidding.highestBid, gameState.bidding.highestBidder, gameState.bidding.currentBidder);

          if (decision.type === 'bid') {
            const minBid = Math.max(7, gameState.bidding.highestBid + 1);
            const maxBid = 13;
            const bidAmount = Math.max(minBid, Math.min(decision.amount, maxBid));
            handleBid(gameState.bidding.currentBidder, bidAmount, 'bid');
          } else {
            handleBid(gameState.bidding.currentBidder, 0, 'pass');
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [gameState.bidding.currentBidder, gameState.phase, animationsInProgress]);

  // Handle AI trump selection
  useEffect(() => {
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.BIDDING) return;
    if (animationsInProgress > 0) return;
    if (gameState.phase === GAME_PHASES.BIDDING &&
      gameState.contract.declarer !== null &&
      !gameState.contract.trumpSuit &&
      !gameState.players[gameState.contract.declarer]?.isHuman) {

      const timer = setTimeout(() => {
        const aiPlayer = gameState.players[gameState.contract.declarer];
        const hand = aiPlayer?.hand || [];
        const suit = chooseTrumpSuit(hand);
        handleTrumpSelect(suit);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.contract.declarer, gameState.contract.trumpSuit, animationsInProgress]);

  // Show current player turn indicator during playing phase
  useEffect(() => {
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (animationsInProgress > 0) return;
    if (gameState.phase === GAME_PHASES.PLAYING && gameState.playing.currentPlayer !== null) {
      const currentPlayer = gameState.players[gameState.playing.currentPlayer];
      if (currentPlayer?.isHuman) {
        showPlayerMessage(gameState.playing.currentPlayer, `P${gameState.playing.currentPlayer + 1}: Your turn`, 2000);
      }
    }
  }, [gameState.playing.currentPlayer, gameState.phase, animationsInProgress]);

  // Auto-play timeout for human player
  useEffect(() => {
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (animationsInProgress > 0) return;
    
    const humanIndex = 2; // P3 is human by default
    
    // Only set timeout if it's human's turn during playing phase
    // DON'T clear existing timeout - let it complete!
    if (
      gameState.phase === GAME_PHASES.PLAYING &&
      gameState.playing.currentPlayer === humanIndex &&
      !gameState.playing.settling &&
      gameState.playing.currentTrick.length < 4 &&
      !commitInProgressRef.current &&
      !humanTimeoutRef.current // Only set if no timeout is already running
    ) {
      const timeoutMs = (settings?.playTimeout || 15) * 1000;
      
      humanTimeoutRef.current = setTimeout(() => {
        // Auto-play for human if they haven't played yet
        if (
          gameState.phase === GAME_PHASES.PLAYING &&
          gameState.playing.currentPlayer === humanIndex &&
          !commitInProgressRef.current
        ) {
          const humanPlayer = gameState.players[humanIndex];
          if (humanPlayer && humanPlayer.hand && humanPlayer.hand.length > 0) {
            // Use AI logic to choose a card for the human
            const card = chooseAiCardSmart({
              hand: humanPlayer.hand,
              trick: gameState.playing.currentTrick || [],
              leadSuit: gameState.playing.leadSuit,
              trumpSuit: gameState.contract.trumpSuit,
              playerIndex: humanIndex,
              players: gameState.players,
            });

            if (card) {
              const suitSymbols = { Spades: '♠', Hearts: '♥', Diamonds: '♦', Clubs: '♣' };
              showPlayerMessage(humanIndex, `⏱️ Auto-played: ${card.label}${suitSymbols[card.suit] || ''}`, 3000);
              
              // Find card index in hand for animation BEFORE dispatching
              const cardIndexInHand = humanPlayer.hand.findIndex(
                c => c.suit === card.suit && c.label === card.label
              );
              
              console.log('🔧 AUTO-PLAY DEBUG:');
              console.log('   Card:', card.label, 'of', card.suit);
              console.log('   Card Index:', cardIndexInHand);
              console.log('   Hand Length:', humanPlayer.hand.length);
              console.log('   Current Player:', gameState.playing.currentPlayer);
              console.log('   Trick Length:', gameState.playing.currentTrick.length);
              console.log('   Animations In Progress:', animationsInProgress);
              
              // Clear AI guard to allow next AI player to move
              aiGuardRef.current = false;
              
              // Mark commit in progress to prevent double plays
              commitInProgressRef.current = true;
              
              // Dispatch the play action FIRST to update game state
              dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex: humanIndex, card } });
              setSelectedCard(null);
              
              // Then trigger animation AFTER dispatch, but use the captured hand state
              // We need to pass the current hand length and index before the card was removed
              const totalCardsBeforePlay = humanPlayer.hand.length;
              console.log('   Triggering animation with hand snapshot');
              console.log('   Total cards before play:', totalCardsBeforePlay);
              
              // Use setTimeout to ensure the animation triggers after state update
              setTimeout(() => {
                // Calculate position using the hand state BEFORE the card was played
                const fromPosition = getCardPositionInHand(
                  humanIndex,
                  cardIndexInHand,
                  totalCardsBeforePlay,
                  screenDimensions
                );
                
                const animationId = generateAnimationId();
                const cardWidth = humanIndex === 2 ? 110 : 80;
                
                console.log('🎬 AUTO-PLAY ANIMATION TRIGGERED');
                console.log(`   Player: ${humanIndex} (${humanPlayer.name})`);
                console.log(`   Card: ${card.label} of ${card.suit}`);
                console.log(`   Card Index: ${cardIndexInHand}/${totalCardsBeforePlay}`);
                console.log(`   Starting Position: (${Math.round(fromPosition.x)}, ${Math.round(fromPosition.y)})`);
                console.log(`   Animation ID: ${animationId}`);
                
                // Increment animation counter
                setAnimationsInProgress(prev => prev + 1);
                
                // Add to animating cards
                setAnimatingCards(prev => [...prev, {
                  id: animationId,
                  card,
                  playerIndex: humanIndex,
                  fromPosition,
                  cardWidth,
                }]);
              }, 0);
              
              // Clear the timeout ref after playing
              humanTimeoutRef.current = null;
              
              setTimeout(() => { commitInProgressRef.current = false; }, 0);
            }
          }
        }
      }, timeoutMs);
    }

    // Cleanup on unmount only - NOT on dependency changes
    return () => {
      if (humanTimeoutRef.current) {
        clearTimeout(humanTimeoutRef.current);
        humanTimeoutRef.current = null;
      }
    };
  }, [
    gameState.phase,
    gameState.playing.currentPlayer,
    gameState.playing.settling,
    settings.playTimeout,
    gameState.playing.leadSuit,
    gameState.contract.trumpSuit,
    animationsInProgress,
  ]);

  // Advance after full trick settle delay
  useEffect(() => {
    // Phase 1 fix: Trick completion coordination with animation guard
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (!gameState.playing.settling) return;
    if (animationsInProgress > 0) return;
    if (!gameState.playing.pendingAdvance) return;
    if (
      gameState.phase === GAME_PHASES.PLAYING &&
      gameState.playing.settling &&
      gameState.playing.currentTrick.length === 4 &&
      gameState.playing.pendingAdvance
    ) {
      const { winner } = gameState.playing.pendingAdvance;
      const t = setTimeout(() => {
        dispatch({ type: GAME_ACTIONS.ADVANCE_AFTER_TRICK, payload: { winner } });
      }, 1500); // Phase 1 fix: wait to show completed trick
      return () => clearTimeout(t);
    }
  }, [gameState.phase, gameState.playing.settling, gameState.playing.currentTrick.length, gameState.playing.pendingAdvance, animationsInProgress]);

  // AI move execution
  useEffect(() => {
    console.log('🤖 AI MOVE EFFECT TRIGGERED');
    console.log('   Phase:', gameState.phase);
    console.log('   Animations In Progress:', animationsInProgress);
    console.log('   Current Player:', gameState.playing.currentPlayer);
    console.log('   Settling:', gameState.playing.settling);
    console.log('   Trick Length:', gameState.playing.currentTrick.length);
    
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.PLAYING) {
      console.log('   ❌ Blocked: Phase not PLAYING');
      return;
    }
    if (animationsInProgress > 0) {
      console.log('   ❌ Blocked: Animations in progress');
      return;
    }
    const phase = gameState.phase;
    const currentPlayer = gameState.playing.currentPlayer;
    const current = gameState.players[currentPlayer];

    console.log('   Current Player Data:', current?.name, 'isHuman:', current?.isHuman);
    console.log('   AI Guard:', aiGuardRef.current);

    if (
      phase !== GAME_PHASES.PLAYING ||
      currentPlayer === null || currentPlayer === undefined ||
      !current || current.isHuman ||
      gameState.playing.currentTrick.length >= 4 ||
      gameState.playing.settling ||
      (current.hand?.length ?? 0) === 0 ||
      aiGuardRef.current
    ) {
      console.log('   ❌ Blocked by guards:');
      if (currentPlayer === null || currentPlayer === undefined) console.log('      - Current player is null/undefined');
      if (!current) console.log('      - Current player data missing');
      if (current?.isHuman) console.log('      - Current player is human');
      if (gameState.playing.currentTrick.length >= 4) console.log('      - Trick full');
      if (gameState.playing.settling) console.log('      - Game settling');
      if ((current?.hand?.length ?? 0) === 0) console.log('      - No cards in hand');
      if (aiGuardRef.current) console.log('      - AI guard active');
      return;
    }

    console.log('   ✅ All guards passed! Setting AI timer...');

    aiGuardRef.current = true;

    const timer = setTimeout(() => {
      const leadSuit = gameState.playing.leadSuit;

      // Choose with smart, trump-aware logic
      const card = chooseAiCardSmart({
        hand: current.hand,
        trick: gameState.playing.currentTrick,
        leadSuit: gameState.playing.leadSuit,
        trumpSuit: gameState.contract.trumpSuit,
        playerIndex: currentPlayer,
        players: gameState.players,
      });

      if (card) {
        const validation = isLegalPlay(card, current.hand, gameState.playing.leadSuit);
        if (validation.valid) {
          // Show AI card played message
          const suitSymbols = {
            'Spades': '♠',
            'Hearts': '♥',
            'Diamonds': '♦',
            'Clubs': '♣'
          };
          const message = `P${currentPlayer + 1}: ${card.label}${suitSymbols[card.suit] || ''}`;
          showPlayerMessage(currentPlayer, message, 2000);

          // Find card index in hand for animation
          const cardIndexInHand = current.hand.findIndex(
            c => c.suit === card.suit && c.label === card.label
          );
          
          // Trigger animation
          triggerCardAnimation(currentPlayer, card, cardIndexInHand);

          dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex: currentPlayer, card } });
        }
      }

      aiGuardRef.current = false;
    }, 800);

    return () => {
      clearTimeout(timer);
      // CRITICAL FIX: Reset AI guard on cleanup to prevent it from getting stuck
      // This happens when the effect re-runs before the timeout completes
      aiGuardRef.current = false;
    };
  }, [gameState.phase, gameState.playing.currentPlayer, gameState.playing.currentTrick.length, gameState.playing.leadSuit, gameState.playing.settling, animationsInProgress]);

  // Run validation tests on component mount (development only)
  useEffect(() => {
    if (__DEV__) {
      logTestResults();
    }
  }, []);

  // Validate game state on phase changes (development only)
  useEffect(() => {
    // Phase 1 fix: Guard to avoid running validations mid-animation
    if (animationsInProgress > 0) return;
    if (__DEV__) {
      const validation = validateGameState(gameState);
      if (!validation.valid) {
        console.warn('Game state validation failed:', validation.errors);
      }
    }
  }, [gameState.phase, gameState.playing.trickNumber, animationsInProgress]);

  // Save score history to persistent storage when a round completes
  useEffect(() => {
    // Phase 1 fix: avoid saving while animations are running to prevent cascades
    if (animationsInProgress > 0) return;
    // Check if we have new score history entries that need to be saved
    if (gameState.scoreHistory && gameState.scoreHistory.length > 0) {
      const lastEntry = gameState.scoreHistory[gameState.scoreHistory.length - 1];
      
      // Check if this entry is already in the persistent storage
      const alreadySaved = scoreHistory.some(entry => 
        entry.round === lastEntry.round &&
        entry.team1Total === lastEntry.team1Total &&
        entry.team2Total === lastEntry.team2Total
      );
      
      if (!alreadySaved) {
        // Save the new entry to persistent storage
        addScoreEntry(lastEntry);
        console.log('[ScoreHistory] Saved round', lastEntry.round, 'to persistent storage');
      }
    }
  }, [gameState.scoreHistory, gameState.phase, animationsInProgress]);


  // Auto-play selected card when it's the human's turn and selection is legal
  useEffect(() => {
    // Phase 1 fix: Guards
    if (gameState.phase !== GAME_PHASES.PLAYING) return;
    if (animationsInProgress > 0) return;
    if (commitInProgressRef.current) return; // avoid overlapping commits
    const humanIndex = 2; // P3 is human by default
    if (
      gameState.phase === GAME_PHASES.PLAYING &&
      gameState.playing.currentPlayer === humanIndex &&
      !gameState.playing.settling &&
      gameState.playing.currentTrick.length < 4 &&
      selectedCard
    ) {
      const currentPlayer = gameState.players[humanIndex];
      const validation = isLegalPlay(selectedCard, currentPlayer.hand, gameState.playing.leadSuit);
      if (validation.valid) {
        // Clear the timeout since human played manually
        if (humanTimeoutRef.current) {
          clearTimeout(humanTimeoutRef.current);
          humanTimeoutRef.current = null;
        }
        
        const suitSymbols = { Spades: '♠', Hearts: '♥', Diamonds: '♦', Clubs: '♣' };
        showPlayerMessage(humanIndex, `P${humanIndex + 1}: ${selectedCard.label}${suitSymbols[selectedCard.suit] || ''}`, 2000);
        
        // Find card index in hand for animation BEFORE dispatching
        const cardIndexInHand = currentPlayer.hand.findIndex(
          c => c.suit === selectedCard.suit && c.label === selectedCard.label
        );
        
        // Capture hand state before playing
        const totalCardsBeforePlay = currentPlayer.hand.length;
        const cardToPlay = selectedCard;
        
        // Clear AI guard to allow next AI player to move
        aiGuardRef.current = false;
        
        commitInProgressRef.current = true;
        
        // Dispatch FIRST to update game state
        dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex: humanIndex, card: selectedCard } });
        setSelectedCard(null);
        
        // Trigger animation AFTER dispatch with captured hand state
        setTimeout(() => {
          const fromPosition = getCardPositionInHand(
            humanIndex,
            cardIndexInHand,
            totalCardsBeforePlay,
            screenDimensions
          );
          
          const animationId = generateAnimationId();
          const cardWidth = humanIndex === 2 ? 110 : 80;
          
          console.log('🎬 MANUAL PLAY ANIMATION TRIGGERED');
          console.log(`   Player: ${humanIndex}`);
          console.log(`   Card: ${cardToPlay.label} of ${cardToPlay.suit}`);
          console.log(`   Card Index: ${cardIndexInHand}/${totalCardsBeforePlay}`);
          console.log(`   Animation ID: ${animationId}`);
          
          // Increment animation counter
          setAnimationsInProgress(prev => prev + 1);
          
          // Add to animating cards
          setAnimatingCards(prev => [...prev, {
            id: animationId,
            card: cardToPlay,
            playerIndex: humanIndex,
            fromPosition,
            cardWidth,
          }]);
        }, 0);
        
        // Release commit guard on next tick to allow future selections
        setTimeout(() => { commitInProgressRef.current = false; }, 0);
      }
    }
  }, [gameState.phase, gameState.playing.currentPlayer, gameState.playing.settling, gameState.playing.currentTrick.length, selectedCard, animationsInProgress]);

  // Function to determine if a card can be legally played
  const canPlayCard = useCallback((card, playerIndex) => {
    // Only apply visual hints during playing phase and for human players
    if (gameState.phase !== GAME_PHASES.PLAYING) return true;
    if (gameState.playing.currentPlayer !== playerIndex) return true;
    if (!gameState.players[playerIndex]?.isHuman) return true;

    const currentPlayer = gameState.players[playerIndex];
    const validation = isLegalPlay(card, currentPlayer.hand, gameState.playing.leadSuit);
    return validation.valid;
  }, [gameState.phase, gameState.playing.currentPlayer, gameState.playing.leadSuit, gameState.players]);

  // Small compact visual for side players: stacked card backs and a count
  const SideStack = ({ count }) => {
    const safeCount = Math.max(0, count || 0);
    const stackToShow = Math.min(safeCount, 10); // limit for visual stack depth
    return (
      <View style={styles.sideStackContainer}>
        <View style={styles.verticalCardStack}>
          {Array.from({ length: stackToShow }).map((_, i) => (
            <View key={i} style={[styles.cardBackSmall, { top: i * 6 }]} />
          ))}
        </View>
        <Text style={styles.cardCount}>{safeCount}</Text>
      </View>
    );
  };

  // Player info box for side players: shows bid/tricks info
  const PlayerInfoBox = ({ playerIndex, gameState }) => {
    const phase = gameState.phase;

    // Highest bid placed by this player in current bidding sequence
    const playerHighestBid = gameState.bidding?.bids
      ?.filter(b => b.player === playerIndex && b.suit !== 'pass')
      ?.reduce((max, b) => Math.max(max, b.amount), 0) || 0;

    // Is this player's bid currently the highest (not overbid)
    const isCurrentlyHighestBidder = gameState.bidding?.highestBidder === playerIndex;

    // During bidding: show this player's highest bid if they are currently the top bidder; hide otherwise
    const showBidBox = phase === GAME_PHASES.BIDDING && playerHighestBid > 0 && isCurrentlyHighestBidder;

    // During playing: show total tricks won by this player's team
    const playerTeam = [0, 2].includes(playerIndex) ? 'team1' : 'team2';
    const teamTricksForPlayer = gameState.teams && gameState.teams[playerTeam] ? (gameState.teams[playerTeam].tricks || 0) : 0;
    const showTricksBox = phase === GAME_PHASES.PLAYING;

    // If not in bidding/playing, hide
    const isVisible = showBidBox || showTricksBox;
    if (!isVisible) return null;

    // Compute contract progress color for both members of the declarer's team during PLAYING
    let statusStyle = null;
    if (phase === GAME_PHASES.PLAYING) {
      const declarerTeam = gameState.contract?.declarerTeam;
      const contractAmount = gameState.contract?.amount || 0;
      if (declarerTeam) {
        const teamTricks = gameState.teams?.[declarerTeam]?.tricks || 0;
        const completedTricks = (gameState.teams?.team1?.tricks || 0) + (gameState.teams?.team2?.tricks || 0);
        const remainingTricks = Math.max(0, 13 - completedTricks);
        const made = teamTricks >= contractAmount;
        const impossible = teamTricks + remainingTricks < contractAmount; // cannot reach contract anymore
        const isDeclarerTeamMember = (declarerTeam === 'team1' && [0,2].includes(playerIndex)) || (declarerTeam === 'team2' && [1,3].includes(playerIndex));
        if (isDeclarerTeamMember) {
          if (made) statusStyle = styles.playerInfoBoxSuccess;
          else if (impossible) statusStyle = styles.playerInfoBoxDanger;
        }
      }
    }

    // Position the box near each player 'on the table' with tuned margins
    const SIDE_OVERLAP = 28;   // push further onto the table from left/right
    const TOP_OVERLAP = 56;    // slightly less overlap so P1 sits a bit higher
    const BOTTOM_OVERLAP = 28; // push further up from the bottom player area
    const SIDE_REVERT = 12;    // revert side players to earlier, lighter overlap
    let positionStyle = {};
    if (playerIndex === 0) {
      // Top player: move down onto the table a bit more
      positionStyle = { bottom: -TOP_OVERLAP, left: '50%', marginLeft: -16 };
    } else if (playerIndex === 1) {
      // Left player: revert to earlier placement
      positionStyle = { right: -SIDE_REVERT, top: '50%', marginTop: -16 };
    } else if (playerIndex === 2) {
      // Bottom player: move up onto the table a bit more
      positionStyle = { top: -BOTTOM_OVERLAP, left: '50%', marginLeft: -16 };
    } else if (playerIndex === 3) {
      // Right player: revert to earlier placement
      positionStyle = { left: -SIDE_REVERT, top: '50%', marginTop: -16 };
    }

    return (
      <View style={[positionStyle, styles.playerInfoContainer]}>
        <View style={[
          styles.playerInfoBox,
          showBidBox ? styles.playerInfoBoxBid : styles.playerInfoBoxTricks,
          statusStyle // override to green/red for declarer when applicable
        ]}>
          <Text style={[
            styles.playerInfoText,
            showBidBox ? styles.playerInfoTextBid : styles.playerInfoTextTricks
          ]}>
            {showBidBox ? playerHighestBid : teamTricksForPlayer}
          </Text>
        </View>
        <Text style={styles.playerInfoCaption}>
          {showBidBox ? 'Bid' : 'Team'}
        </Text>
      </View>
    );
  };



  return (
    <View style={styles.container} onLayout={handleLayout} ref={containerRef}>
      {/* Previous Trick Display */}
      {gameState.phase === GAME_PHASES.PLAYING && gameState.playing.previousTrick.length > 0 && (
        <PreviousTrick
          previousTrick={gameState.playing.previousTrick}
          trumpSuit={gameState.contract.trumpSuit}
        />
      )}

      {/* Score Tracker */}
      <View style={styles.scoreTrackerWrapper}>
        <ScoreTracker gameState={{ ...gameState, scoreHistory }} />
      </View>

      {/* Exit Button */}
      <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
        <FontAwesomeIcon icon={faRightFromBracket} size={20} color="#fff" />
      </TouchableOpacity>

      {/* Start Game Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Button title="Deal Cards" onPress={handleStartGame} />
          </View>
        </View>
      </Modal>

      {/* Bidding Modal - Only show for human players */}
      <Bidding
        visible={
          gameState.phase === GAME_PHASES.BIDDING &&
          gameState.players[gameState.bidding.currentBidder]?.isHuman &&
          !gameState.contract.declarer
        }
        currentBidder={gameState.bidding.currentBidder}
        highestBid={gameState.bidding.highestBid}
        highestBidder={gameState.bidding.highestBidder}
        players={gameState.players}
        playersStillBidding={gameState.bidding.playersStillBidding}
        onBid={handleBid}
        onBiddingComplete={handleBiddingComplete}
        onTrumpSelect={handleTrumpSelect}
        isHumanPlayer={gameState.players[gameState.bidding.currentBidder]?.isHuman}
        biddingComplete={gameState.contract.declarer !== null}
        contract={gameState.contract}
      />

      {/* Trump Selection Modal - Only show for human declarer */}
      <Bidding
        visible={
          gameState.phase === GAME_PHASES.BIDDING &&
          gameState.contract.declarer !== null &&
          gameState.players[gameState.contract.declarer]?.isHuman &&
          !gameState.contract.trumpSuit
        }
        currentBidder={gameState.bidding.currentBidder}
        highestBid={gameState.bidding.highestBid}
        highestBidder={gameState.bidding.highestBidder}
        players={gameState.players}
        playersStillBidding={gameState.bidding.playersStillBidding}
        onBid={handleBid}
        onBiddingComplete={handleBiddingComplete}
        onTrumpSelect={handleTrumpSelect}
        isHumanPlayer={gameState.players[gameState.contract.declarer]?.isHuman}
        biddingComplete={gameState.contract.declarer !== null}
        contract={gameState.contract}
      />

      {/* Round End Modal */}
      <Modal visible={gameState.phase === GAME_PHASES.FINISHED} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Round Complete!</Text>
            <Text style={styles.scoreText}>
              Team 1: {gameState.teams.team1.score} ({gameState.teams.team1.roundScore > 0 ? '+' : ''}{gameState.teams.team1.roundScore})
            </Text>
            <Text style={styles.scoreText}>
              Team 2: {gameState.teams.team2.score} ({gameState.teams.team2.roundScore > 0 ? '+' : ''}{gameState.teams.team2.roundScore})
            </Text>
            <Button title="Next Round" onPress={handleNewRound} />
          </View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal visible={gameState.phase === GAME_PHASES.GAME_OVER} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Over!</Text>
            <Text style={styles.winnerText}>
              {gameState.teams.team1.score >= gameState.winningScore ? 'Team 1 Wins!' : 'Team 2 Wins!'}
            </Text>
            <Text style={styles.scoreText}>
              Final Score - Team 1: {gameState.teams.team1.score}, Team 2: {gameState.teams.team2.score}
            </Text>
            <Button title="Play Again" onPress={handlePlayAgain} />
          </View>
        </View>
      </Modal>

      {/* Trump Display - DISABLED */}
      {/* {gameState.phase === GAME_PHASES.PLAYING && gameState.contract.trumpSuit && (
        <TrumpDisplay
          trumpSuit={gameState.contract.trumpSuit}
          currentBid={gameState.contract.amount}
          tricksWon={gameState.contract.declarerTeam ? gameState.teams[gameState.contract.declarerTeam]?.tricks || 0 : 0}
        />
      )} */}

      {/* Player Circles */}
      {gameState.phase !== GAME_PHASES.DEALING && isLoaded && (
        <PlayerCircles
          players={gameState.players}
          currentPlayer={gameState.playing.currentPlayer}
          onPlayerTimeUp={handlePlayerTimeUp}
          gamePhase={gameState.phase}
          maxDuration={settings?.playTimeout || 15}
        />
      )}

      {/* Trick Area */}
      <TrickArea
        trickCards={gameState.animations.trickAreaCards}
        playedCardAnimations={gameState.animations.playedCardAnimations}
        leadSuit={gameState.playing.leadSuit}
        currentTrick={gameState.playing.currentTrick}
        trickNumber={gameState.playing.trickNumber}
        totalTricks={13}
      />

      {/* Animating Cards Overlay */}
      <AnimatingCardsOverlay
        animatingCards={animatingCards}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Player 1 - Top (full hand) */}
      <View style={[styles.playerHorizontal, styles.playerTop]}>
        <Text style={styles.playerName}>{gameState.players[0]?.name}</Text>
        <Player
          playerData={gameState.players[0]}
          onCardPress={(card) => handleCardPress(card, 0)}
          canPlayCard={(card) => canPlayCard(card, 0)}
        />
        <PlayerInfoBox playerIndex={0} gameState={gameState} />
        <PlayerMessage
          message={playerMessages[0].message}
          visible={playerMessages[0].visible}
          position="top"
        />
      </View>

      {/* Player 2 - Left (compact stack, no rotation) */}
      <View style={[styles.sidePanel, styles.playerLeft]}>
        <Text style={styles.playerName}>{gameState.players[1]?.name}</Text>
        <SideStack count={gameState.players[1]?.hand?.length} />
        <PlayerInfoBox playerIndex={1} gameState={gameState} />
        <PlayerMessage
          message={playerMessages[1].message}
          visible={playerMessages[1].visible}
          position="left"
        />
      </View>

      {/* Player 3 - Bottom (full hand) */}
      <View style={[styles.playerHorizontal, styles.playerBottom]}>
        <Player
          playerData={gameState.players[2]}
          onCardPress={(card) => handleCardPress(card, 2)}
          canPlayCard={(card) => canPlayCard(card, 2)}
          customCardWidth={110}
          fanLayout={true}
          selectedCard={selectedCard}
        />
        <Text style={styles.playerName}>{gameState.players[2]?.name}</Text>
        <PlayerInfoBox playerIndex={2} gameState={gameState} />
        <PlayerMessage
          message={playerMessages[2].message}
          visible={playerMessages[2].visible}
          position="bottom"
        />
      </View>

      {/* Player 4 - Right (compact stack, no rotation) */}
      <View style={[styles.sidePanel, styles.playerRight]}>
        <Text style={styles.playerName}>{gameState.players[3]?.name}</Text>
        <SideStack count={gameState.players[3]?.hand?.length} />
        <PlayerInfoBox playerIndex={3} gameState={gameState} />
        <PlayerMessage
          message={playerMessages[3].message}
          visible={playerMessages[3].visible}
          position="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0A3D2E', // table-like base color
  },
  scoreTrackerWrapper: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 999,
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Central trick/table area styles
  trickArea: {
    position: 'absolute',
    top: '28%',
    bottom: '28%',
    left: '18%',
    right: '18%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trickPlaceholder: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  playedCardSpot: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  trickText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Horizontal players (top/bottom)
  playerHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTop: {
    top: 80,
  },
  playerBottom: {
    bottom: 20,
    justifyContent: 'flex-end',
  },

  // Side players (left/right) - no rotation
  sidePanel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLeft: {
    top: '25%',
    bottom: '25%',
    left: 8,
    width: 90,
  },
  playerRight: {
    top: '25%',
    bottom: '25%',
    right: 8,
    width: 90,
  },

  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 8,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Small stacked card backs for side players
  sideStackContainer: {
    alignItems: 'center',
  },
  verticalCardStack: {
    position: 'relative',
    width: 36,
    height: 160,
    marginBottom: 6,
  },
  cardBackSmall: {
    position: 'absolute',
    width: 26,
    height: 18,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#123',
  },
  cardCount: {
    color: '#fff',
    fontWeight: '700',
  },
  // Player info container and box styles
  playerInfoContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  // Player info box
  playerInfoBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)', // Golden background (default)
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfoBoxBid: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    borderColor: '#b7791f',
  },
  playerInfoBoxTricks: {
    backgroundColor: 'rgba(66, 153, 225, 0.95)', // blue tone
    borderColor: '#2b6cb0',
  },
  // Success (green) when declarer team has met or exceeded contract
  playerInfoBoxSuccess: {
    backgroundColor: 'rgba(72, 187, 120, 0.95)', // green tone
    borderColor: '#2f855a',
  },
  // Danger (red) when declarer team can no longer meet contract
  playerInfoBoxDanger: {
    backgroundColor: 'rgba(245, 101, 101, 0.95)', // red tone
    borderColor: '#c53030',
  },
  playerInfoCaption: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
  },
  playerInfoText: {
    color: '#2d3748',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal styles
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d3748',
  },
  scoreText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#4a5568',
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#48bb78',
  },
});

export default GameScreen;
