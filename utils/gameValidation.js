// Game validation utilities
import { getCardValue } from './gameLogic';

// Validate that a card play is legal
export function isLegalPlay(card, playerHand, leadSuit) {
  // Player must have the card
  if (!playerHand.some(c => c.suit === card.suit && c.label === card.label)) {
    return { valid: false, reason: 'Player does not have this card' };
  }
  
  // If there's a lead suit, player must follow if possible
  if (leadSuit) {
    const suitCards = playerHand.filter(c => c.suit === leadSuit);
    if (suitCards.length > 0 && card.suit !== leadSuit) {
      return { valid: false, reason: 'Must follow suit when possible' };
    }
  }
  
  return { valid: true };
}

// Validate bidding
export function isValidBid(amount, currentHighestBid, playerHasPassed) {
  if (playerHasPassed) {
    return { valid: false, reason: 'Player has already passed' };
  }
  
  if (amount === 0) {
    return { valid: true }; // Pass is always valid
  }
  
  if (amount < 7 || amount > 13) {
    return { valid: false, reason: 'Bid must be between 7 and 13' };
  }
  
  if (amount <= currentHighestBid) {
    return { valid: false, reason: 'Bid must be higher than current highest bid' };
  }
  
  return { valid: true };
}

// Validate game state consistency
export function validateGameState(gameState) {
  const errors = [];
  
  // Check player count
  if (gameState.players.length !== 4) {
    errors.push('Game must have exactly 4 players');
  }
  
  // Check hand sizes during playing phase
  if (gameState.phase === 'playing') {
    const totalCards = gameState.players.reduce((sum, player) => sum + player.hand.length, 0);
    const expectedCards = 52 - (gameState.playing.trickNumber - 1) * 4 - gameState.playing.currentTrick.length;
    
    if (totalCards !== expectedCards) {
      const handSizes = gameState.players.map(p => p.hand.length);
      const debug = {
        trickNumber: gameState.playing.trickNumber,
        currentTrickLen: gameState.playing.currentTrick.length,
        leadSuit: gameState.playing.leadSuit,
        handSizes,
        contract: gameState.contract,
      };
      console.warn('Card count mismatch debug:', debug);
      errors.push(`Card count mismatch: expected ${expectedCards}, got ${totalCards}`);
    }
  }
  
  // Check team trick counts
  const totalTricks = gameState.teams.team1.tricks + gameState.teams.team2.tricks;
  let expectedTricks;
  if (gameState.phase === 'playing') {
    // During settling after a full trick, trickNumber hasn't advanced yet but team tricks already include the just-finished trick.
    const isSettlingFullTrick = gameState.playing?.settling && (gameState.playing?.currentTrick?.length === 4);
    expectedTricks = isSettlingFullTrick ? gameState.playing.trickNumber : (gameState.playing.trickNumber - 1);
  } else if (gameState.phase === 'finished' || gameState.phase === 'gameOver') {
    expectedTricks = 13; // round completed
  } else {
    expectedTricks = 0; // not in playing yet
  }
  
  if (totalTricks !== expectedTricks) {
    errors.push(`Trick count mismatch: expected ${expectedTricks}, got ${totalTricks}`);
  }
  
  // Check contract validity
  if (gameState.contract.declarer !== null) {
    if (gameState.contract.amount < 7 || gameState.contract.amount > 13) {
      errors.push('Contract amount must be between 7 and 13');
    }
    
    if (!gameState.contract.trumpSuit && gameState.phase === 'playing') {
      errors.push('Trump suit must be set during playing phase');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Test scenarios
export function runGameTests() {
  const testResults = [];
  
  // Test 1: Legal card play validation
  const testHand = [
    { suit: 'Hearts', label: 'Ace' },
    { suit: 'Spades', label: 'King' },
    { suit: 'Hearts', label: '7' }
  ];
  
  // Should be legal - following suit
  let result = isLegalPlay({ suit: 'Hearts', label: 'Ace' }, testHand, 'Hearts');
  testResults.push({
    test: 'Legal play - following suit',
    passed: result.valid,
    details: result
  });
  
  // Should be illegal - not following suit when possible
  result = isLegalPlay({ suit: 'Spades', label: 'King' }, testHand, 'Hearts');
  testResults.push({
    test: 'Illegal play - not following suit',
    passed: !result.valid,
    details: result
  });
  
  // Should be legal - no lead suit
  result = isLegalPlay({ suit: 'Spades', label: 'King' }, testHand, null);
  testResults.push({
    test: 'Legal play - no lead suit',
    passed: result.valid,
    details: result
  });
  
  // Test 2: Bidding validation
  result = isValidBid(8, 7, false);
  testResults.push({
    test: 'Valid bid - higher than current',
    passed: result.valid,
    details: result
  });
  
  result = isValidBid(7, 7, false);
  testResults.push({
    test: 'Invalid bid - not higher than current',
    passed: !result.valid,
    details: result
  });
  
  result = isValidBid(8, 7, true);
  testResults.push({
    test: 'Invalid bid - player has passed',
    passed: !result.valid,
    details: result
  });
  
  return testResults;
}

// Log test results
export function logTestResults() {
  const results = runGameTests();
  console.log('=== Game Validation Tests ===');
  
  results.forEach((result, index) => {
    console.log(`Test ${index + 1}: ${result.test}`);
    console.log(`Result: ${result.passed ? 'PASS' : 'FAIL'}`);
    if (!result.passed) {
      console.log(`Details:`, result.details);
    }
    console.log('---');
  });
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`Summary: ${passedTests}/${results.length} tests passed`);
  
  return results;
}