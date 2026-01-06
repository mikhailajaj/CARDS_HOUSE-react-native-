import VALUES from '../constants/values';

// Function to sort cards in hand (by suit, then by value)
export function sortHand(cards) {
  const suitOrder = { 'Spades': 0, 'Hearts': 1, 'Clubs': 2, 'Diamonds': 3 };
  
  return cards.sort((a, b) => {
    // First sort by suit
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    // Then sort by value (ascending)
    return getCardValue(a) - getCardValue(b);
  });
}

// Function to create a new deck of cards
export function createDeck() {
  const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  const deck = [];

  SUITS.forEach(suit => {
    VALUES.forEach(v => {
      const card = {
        suit,
        label: v.label,
        value: v.value, // numeric value needed by UI PropTypes and logic
      };
      deck.push(card);
    });
  });

  return deck;
}

// Function to shuffle the deck (in-place)
export function shuffleDeck(deck) {
  let m = deck.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = deck[m];
    deck[m] = deck[i];
    deck[i] = t;
  }

  return deck; // Optional, as the deck is modified in place
}

// Function to deal cards to players
export function dealCards(deck, numPlayers = 4) {
  const hands = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });
  
  // Sort each hand
  return hands.map(hand => sortHand(hand));
}

export function initializePlayers(hands) {
  return hands.map((hand, index) => ({
    id: index,
    name: `Player ${index + 1}`,
    hand: hand,
    score: 0,
    hasPassed: false,
  }));
}

// Function to get card numeric value (2 = 2, Ace = 14)
export function getCardValue(card) {
  if (!card) return 0;
  if (typeof card?.value === 'number') return card.value;
  const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'Jack': 11, 'Queen': 12, 'King': 13, 'Ace': 14
  };
  return cardValues[card.label] || 0;
}

// Function to determine the winner of a trick with proper Tarneeb rules
export function determineTrickWinner(trickCards, trumpSuit, leadSuit) {
  if (!trickCards || trickCards.length === 0) return null;
  
  let winningIndex = 0;
  let winningCard = trickCards[0];
  
  for (let i = 1; i < trickCards.length; i++) {
    const currentCard = trickCards[i];
    
    // Trump beats non-trump
    if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      winningCard = currentCard;
      winningIndex = i;
      continue;
    }
    
    // Both trump cards - higher value wins
    if (currentCard.suit === trumpSuit && winningCard.suit === trumpSuit) {
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winningIndex = i;
      }
      continue;
    }
    
    // Current card is not trump, winning card is trump - winning card stays
    if (currentCard.suit !== trumpSuit && winningCard.suit === trumpSuit) {
      continue;
    }
    
    // Neither card is trump - only lead suit can win
    if (currentCard.suit === leadSuit && winningCard.suit === leadSuit) {
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winningIndex = i;
      }
    } else if (currentCard.suit === leadSuit && winningCard.suit !== leadSuit) {
      winningCard = currentCard;
      winningIndex = i;
    }
  }
  
  return winningIndex;
}

// Function to get next player in anticlockwise order
export function getNextPlayer(currentPlayer, direction = 'clockwise') {
  if (direction === 'anticlockwise') {
    return (currentPlayer + 3) % 4; // -1 mod 4
  } else {
    return (currentPlayer + 1) % 4; // +1 mod 4
  }
}

// Function to get player to the right of dealer (first bidder)
export function getFirstBidder(dealer) {
  // Right of dealer starts the bidding. From there, turns proceed clockwise.
  // Right-of-dealer is (dealer - 1) mod 4, which is anticlockwise step.
  return getNextPlayer(dealer, 'anticlockwise');
}

// Function to update scores after each trick
export function updateScores(scores, winnerIndex) {
  const updatedScores = [...scores];
  updatedScores[winnerIndex] += 1; // Increment score for the trick winner
  return updatedScores;
}

// Function to play a round
export function playRound(players, currentTrick, trumpSuit, setScores) {
  const trick = [...currentTrick];
  const leadSuit = trick.length ? trick[0].suit : null;

  // Simulate each player playing a card
  players.forEach((player, index) => {
    if (player.hand.length) {
      const card = player.hand.shift(); // Remove the first card from the player's hand
      trick.push(card); // Add the card to the trick
      console.log(`Player ${index + 1} plays ${card.label} of ${card.suit}`);
    }
  });

  const winnerIndex = determineTrickWinner(trick, trumpSuit);
  setScores(updateScores(players.map(player => player.score), winnerIndex));
  console.log(`Player ${winnerIndex + 1} wins the trick`);
}
