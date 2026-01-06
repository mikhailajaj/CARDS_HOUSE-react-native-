import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const PreviousTrick = ({ previousTrick, trumpSuit }) => {
  if (!previousTrick || previousTrick.length === 0) {
    return null;
  }

  // Position cards in mini-mirror layout (same as main trick area but smaller)
  const getCardPosition = (playerIndex) => {
    switch (playerIndex) {
      case 0: // Top player
        return { top: 2, left: '50%', marginLeft: -10 };
      case 1: // Left player  
        return { left: 2, top: '50%', marginTop: -18 };
      case 2: // Bottom player
        return { bottom: 2, left: '50%', marginLeft: -10 };
      case 3: // Right player
        return { right: 2, top: '50%', marginTop: -18 };
      default:
        return { top: 0, left: 0 };
    }
  };

  const getSuitSymbol = (suit) => {
    const symbols = {
      'Spades': '♠',
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣'
    };
    return symbols[suit] || '';
  };

  const getSuitColor = (suit) => {
    return (suit === 'Hearts' || suit === 'Diamonds') ? '#e53e3e' : '#2d3748';
  };

  const getCardLabel = (label) => {
    const labelMap = {
      'Ace': 'A',
      'Jack': 'J',
      'Queen': 'Q',
      'King': 'K'
    };
    return labelMap[label] || label;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Last</Text>
      <View style={styles.trickArea}>
        {previousTrick.map((trickCard, index) => {
          const { player, card } = trickCard;
          const position = getCardPosition(player);
          const suitColor = getSuitColor(card.suit);
          const isTrump = card.suit === trumpSuit;
          
          return (
            <View 
              key={`prev-${player}-${card.suit}-${card.label}`}
              style={[styles.miniCard, position, isTrump && styles.trumpCard]}
            >
              <Text style={[styles.cardLabel, { color: suitColor }]}>
                {getCardLabel(card.label)}
              </Text>
              <Text style={[styles.cardSuit, { color: suitColor }]}>
                {getSuitSymbol(card.suit)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 72,
    height: 120,
    zIndex: 999,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  trickArea: {
    position: 'relative',
    width: 72,
    height: 100,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniCard: {
    position: 'absolute',
    width: 20,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  trumpCard: {
    borderColor: '#ffd700',
    borderWidth: 1,
    shadowColor: '#ffd700',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  cardSuit: {
    fontSize: 12,
    lineHeight: 12,
  },
});

export default PreviousTrick;