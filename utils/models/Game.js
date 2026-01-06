// Game Data Models
export class Card {
  constructor(suit, label, value) {
    this.suit = suit;
    this.label = label;
    this.value = value;
    this.id = `${suit}-${label}`;
  }
  
  equals(other) {
    return this.suit === other.suit && this.label === other.label;
  }
  
  toString() {
    return `${this.label} of ${this.suit}`;
  }
}

export class Player {
  constructor(id, name, isHuman = false) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.isHuman = isHuman;
    this.isDealer = false;
    this.hasPassedBidding = false;
  }
  
  addCard(card) {
    this.hand.push(card);
  }
  
  removeCard(card) {
    this.hand = this.hand.filter(c => !c.equals(card));
  }
  
  hasCard(card) {
    return this.hand.some(c => c.equals(card));
  }
  
  getCardsOfSuit(suit) {
    return this.hand.filter(card => card.suit === suit);
  }
  
  getLegalCards(leadSuit) {
    if (!leadSuit) return this.hand;
    
    const cardsOfLeadSuit = this.getCardsOfSuit(leadSuit);
    return cardsOfLeadSuit.length > 0 ? cardsOfLeadSuit : this.hand;
  }
}

export class Contract {
  constructor(declarer, amount, trumpSuit) {
    this.declarer = declarer;
    this.amount = amount;
    this.trumpSuit = trumpSuit;
    this.declarerTeam = [0, 2].includes(declarer) ? 'team1' : 'team2';
  }
  
  isDeclarerTeam(playerIndex) {
    return [0, 2].includes(playerIndex) === (this.declarerTeam === 'team1');
  }
}

export class Trick {
  constructor(leader) {
    this.leader = leader;
    this.cards = []; // Array of {player, card}
    this.leadSuit = null;
    this.winner = null;
  }
  
  addCard(player, card) {
    if (this.cards.length === 0) {
      this.leadSuit = card.suit;
    }
    this.cards.push({ player, card });
  }
  
  isComplete() {
    return this.cards.length === 4;
  }
  
  determineWinner(trumpSuit) {
    if (!this.isComplete()) return null;
    
    let winningIndex = 0;
    let winningCard = this.cards[0];
    
    for (let i = 1; i < this.cards.length; i++) {
      const current = this.cards[i];
      
      // Trump beats non-trump
      if (trumpSuit) {
        if (current.card.suit === trumpSuit && winningCard.card.suit !== trumpSuit) {
          winningCard = current;
          winningIndex = i;
          continue;
        }
        
        // Both trump - higher wins
        if (current.card.suit === trumpSuit && winningCard.card.suit === trumpSuit) {
          if (current.card.value > winningCard.card.value) {
            winningCard = current;
            winningIndex = i;
          }
          continue;
        }
        
        // Current not trump, winning is trump - winning stays
        if (current.card.suit !== trumpSuit && winningCard.card.suit === trumpSuit) {
          continue;
        }
      }
      
      // For non-trump cards, only lead suit can win
      if (current.card.suit === this.leadSuit && winningCard.card.suit === this.leadSuit) {
        if (current.card.value > winningCard.card.value) {
          winningCard = current;
          winningIndex = i;
        }
      } else if (current.card.suit === this.leadSuit && 
                 winningCard.card.suit !== this.leadSuit && 
                 winningCard.card.suit !== trumpSuit) {
        winningCard = current;
        winningIndex = i;
      }
    }
    
    this.winner = winningCard.player;
    return this.winner;
  }
}

export class Team {
  constructor(name, players) {
    this.name = name;
    this.players = players; // Array of player indices
    this.tricks = 0;
    this.score = 0;
    this.roundScore = 0;
  }
  
  reset() {
    this.tricks = 0;
    this.roundScore = 0;
  }
  
  addTrick() {
    this.tricks++;
  }
  
  calculateRoundScore(contract, madeBid) {
    if (madeBid) {
      this.roundScore = this.tricks;
    } else {
      this.roundScore = -contract.amount;
    }
    this.score += this.roundScore;
    return this.roundScore;
  }
}