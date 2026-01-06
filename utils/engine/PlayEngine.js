// PlayEngine: central helpers for turn order and legal plays
// Right-position rules: clockwise order (0 -> 1 -> 2 -> 3 -> 0)

import { determineTrickWinner, getCardValue as baseGetCardValue } from '../gameLogic';

export function nextPlayerClockwise(playerIndex) {
  return (playerIndex + 3) % 4;
}

export function nextPlayerAnticlockwise(playerIndex) {
  // (playerIndex + 1) % 4 - clockwise progression: P0→P1→P2→P3→P0
  return (playerIndex + 1) % 4;
}

export function legalCardsFor(hand, leadSuit) {
  if (!Array.isArray(hand)) return [];
  if (!leadSuit) return hand;
  const suitCards = hand.filter(c => c.suit === leadSuit);
  return suitCards.length > 0 ? suitCards : hand;
}

export function getCardValue(card) {
  return baseGetCardValue(card);
}

function lowestCard(cards) {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))[0];
}

function highestCard(cards) {
  return [...cards].sort((a, b) => getCardValue(b) - getCardValue(a))[0];
}

function simulateWinningIfPlayed(trick, candidateCard, trumpSuit, leadSuit) {
  const trickCards = [...trick.map(t => t.card), candidateCard];
  const winnerIndexInTrick = determineTrickWinner(trickCards, trumpSuit, leadSuit);
  // If my card is the last appended and is winning, then by current information it "wins now"
  return winnerIndexInTrick === trickCards.length - 1;
}

export function chooseAiCardSmart({ hand, trick, leadSuit, trumpSuit, playerIndex, players }) {
  // Safety checks
  if (!Array.isArray(hand) || hand.length === 0) return null;
  if (!Array.isArray(trick)) trick = [];
  
  const position = trick.length; // 0..3
  const partnerIndex = (playerIndex + 2) % 4;

  // First enforce legality by lead suit
  const legal = legalCardsFor(hand, leadSuit);
  if (legal.length === 0) return null;

  // Helper to pick lowest that would currently win (using simulation) or fallback lowest
  const pickWinningMinimal = () => {
    const winning = legal.filter(card => simulateWinningIfPlayed(trick, card, trumpSuit, leadSuit));
    if (winning.length > 0) {
      return winning.sort((a, b) => getCardValue(a) - getCardValue(b))[0];
    }
    // No winning legal move now -> discard lowest legal (prefer non-trump if void)
    const nonTrump = legal.filter(c => c.suit !== trumpSuit);
    if (nonTrump.length > 0) return lowestCard(nonTrump);
    return lowestCard(legal);
  };

  // If we are third or fourth, check if partner is currently winning
  const isPartnerWinningNow = () => {
    if (position < 2) return false;
    const trickCards = trick.map(t => t.card);
    const winnerIdx = determineTrickWinner(trickCards, trumpSuit, leadSuit);
    const winnerPlayer = trick[winnerIdx]?.player;
    return winnerPlayer === partnerIndex;
  };

  if (position === 0) {
    // Lead strategy: avoid wasting trump unless we have many, try to lead a strong side suit
    const suitGroups = hand.reduce((acc, c) => {
      acc[c.suit] = acc[c.suit] || [];
      acc[c.suit].push(c);
      return acc;
    }, {});

    const trumpGroup = suitGroups[trumpSuit] || [];
    // If holding many trumps, consider leading a small/mid trump to draw
    if (trumpSuit && trumpGroup.length >= 5) {
      // lead the lowest trump (save high ones)
      const t = lowestCard(trumpGroup);
      return t;
    }

    // Otherwise pick strongest non-trump suit: prefer one with Ace/King or longer length
    const nonTrumpSuits = Object.keys(suitGroups).filter(s => s !== trumpSuit);
    const scored = nonTrumpSuits.map(s => {
      const cards = suitGroups[s];
      const hasAce = cards.some(c => c.label === 'Ace');
      const hasKing = cards.some(c => c.label === 'King');
      const strength = (hasAce ? 3 : 0) + (hasKing ? 2 : 0) + cards.length * 0.2;
      return { suit: s, cards, strength };
    }).sort((a, b) => b.strength - a.strength);

    if (scored.length > 0) {
      // Lead highest from best suit
      const best = scored[0];
      return highestCard(best.cards);
    }

    // Fallback: lead your highest card
    return highestCard(hand);
  }

  if (position === 1) {
    // Second to act: follow suit if possible, try to win cheaply; else consider trumping minimally
    const leadCard = trick[0].card;
    const canFollow = legal.some(c => c.suit === leadSuit);

    if (canFollow) {
      // Try to win with minimal higher card vs the lead card (approximation)
      const higher = legal.filter(c => c.suit === leadSuit && getCardValue(c) > getCardValue(leadCard));
      if (higher.length > 0) {
        return lowestCard(higher);
      }
      return lowestCard(legal.filter(c => c.suit === leadSuit));
    }

    // Cannot follow: consider trumping with lowest trump
    const trumps = hand.filter(c => c.suit === trumpSuit);
    if (trumps.length > 0) return lowestCard(trumps);

    // Otherwise discard lowest
    return lowestCard(legal);
  }

  if (position === 2) {
    // Third to act: if partner winning, don't waste; otherwise try to win cheaply
    if (isPartnerWinningNow()) {
      // Conserve: play lowest following suit if possible; else discard lowest non-trump
      const follow = legal.filter(c => c.suit === leadSuit);
      if (follow.length > 0) return lowestCard(follow);
      const nonTrump = legal.filter(c => c.suit !== trumpSuit);
      if (nonTrump.length > 0) return lowestCard(nonTrump);
      return lowestCard(legal);
    }
    // Partner not winning: try to win with minimal
    return pickWinningMinimal();
  }

  if (position === 3) {
    // Fourth to act: perfect info on current three cards
    if (isPartnerWinningNow()) {
      // Do not waste a high card: lowest legal (prefer follow suit low)
      const follow = legal.filter(c => c.suit === leadSuit);
      if (follow.length > 0) return lowestCard(follow);
      const nonTrump = legal.filter(c => c.suit !== trumpSuit);
      if (nonTrump.length > 0) return lowestCard(nonTrump);
      return lowestCard(legal);
    }
    // Try to win with the cheapest winning card
    return pickWinningMinimal();
  }

  // Fallback safety
  return lowestCard(legal);
}
