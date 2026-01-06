/**
 * AnimatingCard Component
 * Individual card that animates from hand position to trick area using Moti
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import Card from './Card';
import { getTrickAreaCardPosition, CARD_DIMENSIONS } from '../utils/cardPositionHelpers';

const AnimatingCard = ({ 
  card, 
  fromPosition, 
  playerIndex,
  onComplete,
  cardWidth = 80,
}) => {
  // Calculate precise destination based on shared helper
  const destination = getTrickAreaCardPosition(playerIndex);
  const deltaX = destination.x - fromPosition.x;
  const deltaY = destination.y - fromPosition.y;
  const targetScale = CARD_DIMENSIONS.scaleForWidth(cardWidth);

  return (
    <MotiView
      from={{
        translateX: 0,
        translateY: 0,
        scale: 1,
        rotate: `${fromPosition.rotation || 0}deg`,
      }}
      animate={{
        translateX: deltaX,
        translateY: deltaY,
        scale: targetScale, // Exact scale to match table size
        rotate: '0deg',
      }}
      exit={{
        opacity: 0,
        scale: 0.5,
      }}
      transition={{
        type: 'timing',
        duration: 500,
      }}
      onDidAnimate={(key, finished) => {
        // Call completion callback when translation animation finishes
        if (finished && key === 'translateX') {
          try {
            const destination = getTrickAreaCardPosition(playerIndex);
            console.log('═══════════════════════════════════════════');
            console.log('🎴 CARD ANIMATION COMPLETE');
            console.log('───────────────────────────────────────────');
            console.log(`👤 Player: ${playerIndex} (${['Top', 'Left', 'Bottom/Human', 'Right'][playerIndex]})`);
            if (card) {
              console.log(`🃏 Card: ${card.label} of ${card.suit}`);
            }
            console.log('───────────────────────────────────────────');
            console.log('📍 Animation Path:');
            console.log(`   From: (${Math.round(fromPosition.x)}, ${Math.round(fromPosition.y)})`);
            console.log(`   To:   (${Math.round(destination.x)}, ${Math.round(destination.y)})`);
            console.log('───────────────────────────────────────────');
            console.log('✅ Expected Table Position:');
            console.log(`   X: ${Math.round(destination.x)}`);
            console.log(`   Y: ${Math.round(destination.y)}`);
            console.log('═══════════════════════════════════════════\n');
          } catch (e) {
            console.log('[AnimatingCard] Logging error:', e?.message || e);
          }
          if (onComplete) {
            onComplete();
          }
        }
      }}
      style={[
        styles.cardContainer,
        {
          position: 'absolute',
          left: fromPosition.x - cardWidth / 2,
          top: fromPosition.y - (cardWidth * 1.5) / 2, // Card aspect ratio 1.5
          zIndex: 1000,
        },
      ]}
    >
      <Card card={card} cardWidth={cardWidth} disabled={true} />
    </MotiView>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Container styles
  },
});

export default AnimatingCard;
