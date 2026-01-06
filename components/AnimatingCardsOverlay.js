/**
 * AnimatingCardsOverlay Component
 * Full-screen overlay that renders cards animating from hand to trick area
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatePresence } from 'moti';
import AnimatingCard from './AnimatingCard';

const AnimatingCardsOverlay = ({ 
  animatingCards = [], 
  onAnimationComplete 
}) => {
  const handleAnimationComplete = (cardId) => {
    if (onAnimationComplete) {
      onAnimationComplete(cardId);
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      <AnimatePresence>
        {animatingCards.map((cardData) => (
          <AnimatingCard
            key={cardData.id}
            card={cardData.card}
            fromPosition={cardData.fromPosition}
            playerIndex={cardData.playerIndex}
            onComplete={() => handleAnimationComplete(cardData.id)}
            cardWidth={cardData.cardWidth || 80}
          />
        ))}
      </AnimatePresence>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // Below modals but above game elements
  },
});

export default AnimatingCardsOverlay;
