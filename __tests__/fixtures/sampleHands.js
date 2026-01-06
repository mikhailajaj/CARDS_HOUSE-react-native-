// Sample card hands for testing
export const sampleCard = {
  suit: 'Hearts',
  label: 'Ace',
  value: 14
};

export const strongHand = [
  { suit: 'Hearts', label: 'Ace', value: 14 },
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: 'Queen', value: 12 },
  { suit: 'Spades', label: 'Ace', value: 14 },
  { suit: 'Spades', label: '10', value: 10 },
  { suit: 'Diamonds', label: 'King', value: 13 },
  { suit: 'Diamonds', label: 'Jack', value: 11 },
  { suit: 'Clubs', label: 'Ace', value: 14 },
  { suit: 'Clubs', label: '9', value: 9 },
  { suit: 'Clubs', label: '8', value: 8 },
  { suit: 'Hearts', label: '7', value: 7 },
  { suit: 'Hearts', label: '6', value: 6 },
  { suit: 'Hearts', label: '5', value: 5 }
];

export const weakHand = [
  { suit: 'Clubs', label: '2', value: 2 },
  { suit: 'Clubs', label: '3', value: 3 },
  { suit: 'Clubs', label: '4', value: 4 },
  { suit: 'Diamonds', label: '2', value: 2 },
  { suit: 'Diamonds', label: '3', value: 3 },
  { suit: 'Diamonds', label: '4', value: 4 },
  { suit: 'Hearts', label: '2', value: 2 },
  { suit: 'Hearts', label: '3', value: 3 },
  { suit: 'Spades', label: '2', value: 2 },
  { suit: 'Spades', label: '3', value: 3 },
  { suit: 'Spades', label: '4', value: 4 },
  { suit: 'Spades', label: '5', value: 5 },
  { suit: 'Spades', label: '6', value: 6 }
];

export const mixedHand = [
  { suit: 'Hearts', label: 'Ace', value: 14 },
  { suit: 'Hearts', label: '2', value: 2 },
  { suit: 'Spades', label: 'King', value: 13 },
  { suit: 'Spades', label: '3', value: 3 },
  { suit: 'Diamonds', label: 'Queen', value: 12 },
  { suit: 'Diamonds', label: '4', value: 4 },
  { suit: 'Clubs', label: 'Jack', value: 11 },
  { suit: 'Clubs', label: '5', value: 5 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Spades', label: '9', value: 9 },
  { suit: 'Diamonds', label: '8', value: 8 },
  { suit: 'Clubs', label: '7', value: 7 },
  { suit: 'Hearts', label: '6', value: 6 }
];

export const voidInSuitHand = [
  // No clubs in this hand
  { suit: 'Hearts', label: 'Ace', value: 14 },
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: 'Queen', value: 12 },
  { suit: 'Hearts', label: 'Jack', value: 11 },
  { suit: 'Spades', label: 'Ace', value: 14 },
  { suit: 'Spades', label: 'King', value: 13 },
  { suit: 'Spades', label: 'Queen', value: 12 },
  { suit: 'Diamonds', label: 'Ace', value: 14 },
  { suit: 'Diamonds', label: 'King', value: 13 },
  { suit: 'Diamonds', label: 'Queen', value: 12 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Spades', label: '10', value: 10 },
  { suit: 'Diamonds', label: '10', value: 10 }
];

export const allTrumpsHand = [
  { suit: 'Hearts', label: 'Ace', value: 14 },
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: 'Queen', value: 12 },
  { suit: 'Hearts', label: 'Jack', value: 11 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Hearts', label: '9', value: 9 },
  { suit: 'Hearts', label: '8', value: 8 },
  { suit: 'Hearts', label: '7', value: 7 },
  { suit: 'Hearts', label: '6', value: 6 },
  { suit: 'Hearts', label: '5', value: 5 },
  { suit: 'Hearts', label: '4', value: 4 },
  { suit: 'Hearts', label: '3', value: 3 },
  { suit: 'Hearts', label: '2', value: 2 }
];
