import SUITS from '../constants/suits';
import VALUES from '../constants/values';

let trumpSuit = null; // Global variable to hold the trump suit
let scores = []; // Global array to hold scores for each player

// Function to create a new deck of cards with images
export function createDeck() {
  let deck = [];
  const suitOrder = ['Clubs', 'Diamonds', 'Hearts', 'Spades']; // Ensure this order matches your naming convention
  Image: require(`../assets/img/cards/1.svg`)
  for (let suit of SUITS) {
    for (let value of VALUES) {
      let valueIndex = VALUES.indexOf(value); // Get the index of the current value
      let suitIndex = suitOrder.indexOf(suit); // Get the index of the current suit
      let imageIndex = valueIndex + suitIndex * 13 + 1; // Calculate the image index based on suit and value
      console.log(imageIndex) 
      let imageName = `${imageIndex}.svg`; // Construct the image name
      let card = {
        suit,
        value,
        image: require(`../assets/img/b2fv.png`), // Adjust the path as per your project structure
      };
      deck.push(card);
    }
  }
  return deck;
}

// Function to shuffle the deck
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap
  }
}

// Function to deal cards to players
export function dealCards(deck, numPlayers = 4) {
  const hands = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });
  return hands;
}

// Initialize players with their hands and scores
export function initializePlayers(hands) {
  scores = hands.map(() => 0); // Reset scores for all players
  return hands.map((hand, index) => ({
    id: index,
    name: `Player ${index + 1}`,
    hand,
  }));
}

// Function to set the trump suit for the game
export function setTrumpSuit(suit) {
  trumpSuit = suit;
}

// Function to determine the winner of a trick
export function determineTrickWinner(trick, leadSuit = trick[0].suit) {
  let winningCard = trick[0];
  let winningIndex = 0;

  for (let i = 1; i < trick.length; i++) {
    const card = trick[i];
    if ((card.suit === trumpSuit && winningCard.suit !== trumpSuit) ||
        (card.suit === winningCard.suit && VALUES.indexOf(card.value) > VALUES.indexOf(winningCard.value))) {
      winningCard = card;
      winningIndex = i;
    }
  }
  return winningIndex; // Returns the index of the winning card/player
}

// Function to update scores after each trick
export function updateScores(winnerIndex) {
  scores[winnerIndex] += 1; // Increment score for the trick winner
}

// Function to get current scores
export function getScores() {
  return scores;
}

// Example usage within a game round
export function playRound(players) {
  const trick = [];
  const leadSuit = players[0].hand[0].suit; // Example: assuming the first player leads with the first card

  // Simulate each player playing a card
  players.forEach((player, index) => {
    const card = player.hand.shift(); // Remove the first card from the player's hand
    trick.push(card); // Add the card to the trick
    console.log(`Player ${index + 1} plays ${card.value} of ${card.suit}`);
  });

  const winnerIndex = determineTrickWinner(trick, leadSuit);
  updateScores(winnerIndex);
  console.log(`Player ${winnerIndex + 1} wins the trick`);
}
