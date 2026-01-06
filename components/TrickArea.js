import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import Card from './Card';
import { CARD_DIMENSIONS, getTrickAreaCardPosition } from '../utils/cardPositionHelpers';

const TrickArea = ({ trickCards, playedCardAnimations, leadSuit, currentTrick, trickNumber, totalTricks = 13 }) => {
  // Track logged cards to avoid duplicate logs
  const loggedCardsRef = useRef(new Set());

  // Log only NEW cards added to the trick area (not on re-renders)
  useEffect(() => {
    trickCards.forEach((trickCard) => {
      const cardKey = `${trickCard.playerIndex}-${trickCard.card?.suit}-${trickCard.card?.label}`;
      
      // Only log if this card hasn't been logged yet
      if (!loggedCardsRef.current.has(cardKey)) {
        loggedCardsRef.current.add(cardKey);
        
        const position = getCardPosition(trickCard.playerIndex);
        
        try {
          console.log('📌 CARD PLACED ON TABLE');
          console.log(`   Player: ${trickCard.playerIndex} (${['Top', 'Left', 'Bottom/Human', 'Right'][trickCard.playerIndex]})`);
          if (trickCard.card) {
            console.log(`   Card: ${trickCard.card.label} of ${trickCard.card.suit}`);
          }
          console.log(`   Absolute Position: (${Math.round(position.left)}, ${Math.round(position.top)})`);
          console.log(`   ✅ Matches animation destination!`);
          console.log('─────────────────────────────────────────\n');
        } catch (e) {
          console.log('[TrickArea] Logging error:', e?.message || e);
        }
      }
    });

    // Clear logged cards when trick area is cleared
    if (trickCards.length === 0) {
      loggedCardsRef.current.clear();
    }
  }, [trickCards]);

  // Position all cards using SAME coordinates as animation destination
  // This ensures cards end up exactly where the animation takes them
  const getCardPosition = (playerIndex) => {
    // Get the exact position from the shared helper (same as animation destination)
    const destination = getTrickAreaCardPosition(playerIndex);
    const cardWidth = CARD_DIMENSIONS.TABLE.width;
    const cardHeight = CARD_DIMENSIONS.TABLE.height;
    
    // Convert to absolute positioning
    // Position is top-left corner, so we need to offset by half card dimensions to center it
    return {
      position: 'absolute',
      left: destination.x - (cardWidth / 2),
      top: destination.y - (cardHeight / 2),
    };
  };

  // Get suit symbol for lead suit indicator
  const getSuitSymbol = (suit) => {
    const symbols = {
      'Spades': '♠',
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣'
    };
    return symbols[suit] || '';
  };

  // Get suit color
  const getSuitColor = (suit) => {
    return (suit === 'Hearts' || suit === 'Diamonds') ? '#e53e3e' : '#2d3748';
  };

  return (
    <View style={styles.container}>
      {/* Center Table Area */}
      <View style={styles.centerTable}>
        {/* Table felt pattern overlay */}
        <View style={styles.tablePattern} />


        {/* Trick Number Indicator */}
        {typeof trickNumber === 'number' && trickNumber >= 1 && trickNumber <= totalTricks && (
          <View style={styles.trickIndicator}>
            <Text style={styles.trickText}>
              Trick {trickNumber} / {totalTricks}
            </Text>
          </View>
        )}
      </View>

      {/* Played Cards */}
      {trickCards.map((trickCard, index) => {
        const position = getCardPosition(trickCard.playerIndex);
        const animation = playedCardAnimations[trickCard.playerIndex];

        return (
          <Animated.View
            key={trickCard.id}
            style={[
              styles.playedCard,
              position,
              {
                transform: [
                  { translateX: animation.x },
                  { translateY: animation.y }
                ]
              }
            ]}
          >
            <Card
              card={trickCard.card}
              disabled={true}
              cardWidth={CARD_DIMENSIONS.TABLE.width}
            />
            {/* Player indicator */}
            <View style={styles.cardPlayerIndicator}>
              <Text style={styles.cardPlayerText}>P{trickCard.playerIndex + 1}</Text>
            </View>
          </Animated.View>
        );
      })}

      {/* Trick Winner Highlight removed per request */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none', // Allow touches to pass through to underlying components
  },
  centerTable: {
    width: 210, // 3/4 of 280 = 210
    height: 360, // Double the height: 180 * 2 = 360
    borderRadius: 20,
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trickIndicator: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trickText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  playedCard: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  cardPlayerIndicator: {
    position: 'absolute',
    top: -15,
    left: '50%',
    transform: [{ translateX: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardPlayerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  winnerHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(72, 187, 120, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    top: '30%',
  },
  winnerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tablePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 100, 0, 0.1)',
    opacity: 0.6,
  },
});

export default TrickArea;