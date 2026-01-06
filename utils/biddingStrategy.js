// Bidding Strategy for Tarneeb based on docs/Bidding stratigy.md
// - Hand evaluation using HCP (A=4, K=3, Q=2, J=1)
// - Distribution bonuses: void +3, singleton +2, doubleton +1
// - Trump preference: each trump beyond 4 adds +1 when evaluating best trump suit
// - Opening bids based on score; responses raise minimally when safe

import { getCardValue } from './gameLogic';

const SUIT_ORDER = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];

const HCP_BY_LABEL = { Ace: 4, King: 3, Queen: 2, Jack: 1 };

function hcpForCard(card) {
  return HCP_BY_LABEL[card.label] || 0;
}

function countBySuit(hand) {
  const counts = { Spades: 0, Hearts: 0, Clubs: 0, Diamonds: 0 };
  for (const c of hand || []) {
    if (counts[c.suit] !== undefined) counts[c.suit] += 1;
  }
  return counts;
}

function hcpBySuit(hand) {
  const scores = { Spades: 0, Hearts: 0, Clubs: 0, Diamonds: 0 };
  for (const c of hand || []) {
    scores[c.suit] += hcpForCard(c);
  }
  return scores;
}

function distributionBonus(count) {
  if (count === 0) return 3;
  if (count === 1) return 2;
  if (count === 2) return 1;
  return 0;
}

// Expected tricks estimator (heuristic)
function hasLabel(cards, label) {
  return cards.some(c => c.label === label);
}

function estimateTricks(hand, trumpSuit) {
  if (!Array.isArray(hand) || !trumpSuit) return 0;
  const groups = hand.reduce((acc, c) => {
    acc[c.suit] = acc[c.suit] || [];
    acc[c.suit].push(c);
    return acc;
  }, {});

  const trump = groups[trumpSuit] || [];
  const tLen = trump.length;
  const tHasA = hasLabel(trump, 'Ace');
  const tHasK = hasLabel(trump, 'King');
  const tHasQ = hasLabel(trump, 'Queen');
  const tHasJ = hasLabel(trump, 'Jack');

  let tricks = 0;
  // Trump winners
  if (tHasA) tricks += 1.0;
  if (tHasK) tricks += tHasA ? 0.8 : 0.4;
  if (tHasQ) tricks += (tHasA && tHasK) ? 0.6 : 0.2;
  if (tHasJ) tricks += (tHasA && tHasK && tHasQ) ? 0.25 : 0.1;
  // Trump length bonus beyond 4
  tricks += Math.max(0, tLen - 4) * 0.6;

  // Side suit winners and ruff potential
  for (const suit of SUIT_ORDER) {
    if (suit === trumpSuit) continue;
    const cards = groups[suit] || [];
    const len = cards.length;
    const hasA = hasLabel(cards, 'Ace');
    const hasK = hasLabel(cards, 'King');
    const hasQ = hasLabel(cards, 'Queen');

    if (hasA) tricks += 0.9;
    else if (hasK) tricks += len >= 2 ? 0.6 : 0.4;
    else if (hasQ) tricks += len >= 3 ? 0.3 : 0.15;

    // Ruff potential
    if (tLen >= 6) {
      if (len === 0) tricks += 0.8;
      else if (len === 1) tricks += 0.5;
    }
  }

  // Clamp
  if (tricks < 0) tricks = 0;
  if (tricks > 13) tricks = 13;
  return tricks;
}

export function pickBestTrumpByTricks(hand) {
  let best = 'Spades';
  let bestVal = -Infinity;
  for (const s of SUIT_ORDER) {
    const v = estimateTricks(hand, s);
    if (v > bestVal) {
      bestVal = v;
      best = s;
    }
  }
  return { suit: best, tricks: bestVal };
}

export function evaluateHandStrength(hand) {
  if (!Array.isArray(hand)) return { totalScore: 0, hcp: 0, suitCounts: {}, suitHcp: {}, bestSuit: null };

  const suitCounts = countBySuit(hand);
  const suitHcp = hcpBySuit(hand);

  // HCP total
  const hcp = hand.reduce((sum, c) => sum + hcpForCard(c), 0);

  // Distribution total across all suits
  const dist = Object.values(suitCounts).reduce((sum, cnt) => sum + distributionBonus(cnt), 0);

  const totalScore = hcp + dist;

  // Best suit for trump: consider suit HCP + length bonus beyond 4
  let bestSuit = null;
  let bestSuitScore = -Infinity;
  for (const suit of Object.keys(suitCounts)) {
    const len = suitCounts[suit];
    const suitScore = suitHcp[suit] + Math.max(0, len - 4) + len * 0.1; // slight tie-breaker by length
    if (
      suitScore > bestSuitScore ||
      (suitScore === bestSuitScore && SUIT_ORDER.indexOf(suit) < SUIT_ORDER.indexOf(bestSuit))
    ) {
      bestSuit = suit;
      bestSuitScore = suitScore;
    }
  }

  return {
    totalScore,
    hcp,
    suitCounts,
    suitHcp,
    bestSuit,
  };
}

function hasFourAces(hand) {
  const aces = new Set();
  for (const c of hand || []) {
    if (c.label === 'Ace') aces.add(c.suit);
  }
  return aces.size === 4;
}

function hasHighCardEachSuit(hand) {
  const suits = { Spades: false, Hearts: false, Clubs: false, Diamonds: false };
  for (const c of hand || []) {
    if (c.label === 'Ace' || c.label === 'King') suits[c.suit] = true;
  }
  return Object.values(suits).every(Boolean);
}

// Opener mapping using expected tricks & conservative policy
function mapOpeningBid(hand) {
  const counts = countBySuit(hand);
  const { suit: bestSuit, tricks: myExpected } = pickBestTrumpByTricks(hand);

  // Conservative safety buffer
  const safetyBuffer = 1.2;
  let safeLevel = Math.floor(myExpected - safetyBuffer);

  // Strong hand gates for higher openings
  if (hasFourAces(hand)) {
    // Four aces points to tremendous control; allow at least 10 if length supports
    safeLevel = Math.max(safeLevel, 10);
  } else if (hasHighCardEachSuit(hand)) {
    safeLevel = Math.max(safeLevel, 9);
  }

  const maxLen = Math.max(...Object.values(counts));
  if (maxLen >= 8) {
    safeLevel = Math.max(safeLevel, 10);
  } else if (maxLen === 7) {
    safeLevel = Math.max(safeLevel, 9);
  } else if (maxLen === 6) {
    safeLevel = Math.max(safeLevel, 8);
  }

  // Clamp to legal bid range and avoid reckless 12–13 without true slam feel
  safeLevel = Math.min(safeLevel, 11);
  if (safeLevel < 7) return 0; // pass
  return safeLevel;
}

export function chooseTrumpSuit(hand) {
  // Use expected tricks best suit to align with bidding evaluation
  const { suit } = pickBestTrumpByTricks(hand);
  return suit || 'Spades';
}

export function evaluateBid(hand, highestBid, highestBidder, currentBidder) {
  const partnerIndex = (currentBidder + 2) % 4;
  const partnerIsHighest = highestBidder === partnerIndex;
  const isOpening = (highestBid || 0) < 7;

  // My best trump and expected tricks
  const { suit: myBestSuit, tricks: myExpected } = pickBestTrumpByTricks(hand);

  if (isOpening) {
    const openAmount = mapOpeningBid(hand);
    if (openAmount < 7) return { type: 'pass' };
    return { type: 'bid', amount: openAmount, plannedTrump: myBestSuit };
  }

  // Responder logic
  const safetyBuffer = 1.2;
  const safeLevelMine = Math.floor(myExpected - safetyBuffer);

  // If partner is highest, consider supporting or taking over
  if (partnerIsHighest) {
    // Partner support credit based on their bid amount
    const partnerBid = Math.max(highestBid, 7);
    let supportCredit = 0;
    if (partnerBid === 7) supportCredit = 1.8;
    else if (partnerBid === 8) supportCredit = 2.2;
    else if (partnerBid === 9) supportCredit = 2.7;
    else if (partnerBid === 10) supportCredit = 3.2;
    else if (partnerBid >= 11) supportCredit = 3.5;

    const coordinationPenalty = 0.5; // not sure we share trump unless we take over
    const teamExpected = myExpected + supportCredit - coordinationPenalty;

    // Gentle raise by +1 only when we have a small but real margin
    if (teamExpected >= highestBid + 1 + 0.5) {
      return { type: 'bid', amount: highestBid + 1, plannedTrump: null };
    }

    // Take over (jump) when our trump clearly carries the hand
    if (safeLevelMine >= highestBid + 2 && safeLevelMine >= 9) {
      const jump = Math.min(11, safeLevelMine);
      if (jump > highestBid + 1) {
        return { type: 'bid', amount: jump, plannedTrump: myBestSuit };
      }
    }

    return { type: 'pass' };
  }

  // Opponents are highest -> challenge only if we intend to declare and can safely beat by +1
  if (safeLevelMine >= highestBid + 1 && safeLevelMine >= 8) {
    return { type: 'bid', amount: highestBid + 1, plannedTrump: myBestSuit };
  }

  return { type: 'pass' };
}
