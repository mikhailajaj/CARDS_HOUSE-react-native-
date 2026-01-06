// #DISABLED TODO: Clean up component - currently disabled in GameScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TrumpDisplay = ({ trumpSuit, currentBid, tricksWon }) => {
  // Unicode symbols for suits
  const suitSymbols = {
    'Spades': '♠',
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣'
  };

  // Get trump suit color
  const getTrumpColor = () => {
    return (trumpSuit === 'Hearts' || trumpSuit === 'Diamonds') ? '#e53e3e' : '#2d3748';
  };

  if (!trumpSuit) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bidTracker}>
        <Text style={styles.bidText}>
          {tricksWon || 0}/{currentBid || 0}
        </Text>
      </View>
      <Text style={[styles.trumpSymbol, { color: getTrumpColor() }]}>
        {suitSymbols[trumpSuit] || '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bidTracker: {
    marginRight: 8,
  },
  bidText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trumpSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TrumpDisplay;