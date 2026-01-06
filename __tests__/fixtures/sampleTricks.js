// Sample trick scenarios for testing
export const simpleTrick = [
  { suit: 'Hearts', label: '5', value: 5 },
  { suit: 'Hearts', label: '7', value: 7 },
  { suit: 'Hearts', label: '9', value: 9 },
  { suit: 'Hearts', label: '3', value: 3 }
];

export const trumpWinsTrick = [
  { suit: 'Clubs', label: 'Ace', value: 14 }, // Lead with Ace of Clubs
  { suit: 'Clubs', label: 'King', value: 13 },
  { suit: 'Hearts', label: '2', value: 2 },   // Trump (Hearts)
  { suit: 'Clubs', label: 'Queen', value: 12 }
];

export const highTrumpWinsTrick = [
  { suit: 'Hearts', label: '5', value: 5 },   // Trump
  { suit: 'Hearts', label: '10', value: 10 }, // Higher trump
  { suit: 'Hearts', label: 'King', value: 13 }, // Highest trump - winner
  { suit: 'Hearts', label: '7', value: 7 }    // Trump
];

export const offSuitDoesNotWin = [
  { suit: 'Clubs', label: '5', value: 5 },    // Lead suit
  { suit: 'Spades', label: 'Ace', value: 14 }, // Off-suit (cannot win)
  { suit: 'Clubs', label: '7', value: 7 },    // Follow suit
  { suit: 'Diamonds', label: 'King', value: 13 } // Off-suit (cannot win)
];

export const mixedSuitTrick = [
  { suit: 'Diamonds', label: 'Jack', value: 11 }, // Lead
  { suit: 'Diamonds', label: '5', value: 5 },
  { suit: 'Spades', label: 'Ace', value: 14 },   // Off-suit
  { suit: 'Diamonds', label: 'King', value: 13 }  // Winner
];

export const allSameSuit = [
  { suit: 'Spades', label: '2', value: 2 },
  { suit: 'Spades', label: '10', value: 10 },
  { suit: 'Spades', label: 'Ace', value: 14 }, // Winner
  { suit: 'Spades', label: '5', value: 5 }
];
