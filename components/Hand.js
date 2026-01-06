
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Card from './Card';

const Hand = ({ cards, onCardPress, canPlayCard, customCardWidth, fanLayout = false, selectedCard }) => {
  const { width } = useWindowDimensions();
  // Determine a reasonable card width based on screen width or use custom width
  const cardWidth = customCardWidth || Math.min(90, Math.max(60, Math.floor(width / 8)));
  const overlap = Math.max(12, Math.floor(cardWidth * 0.2)); // show ~20% of each next card (80% overlap)
  
  if (fanLayout) {
    // Proper fan layout with corner overlap principle
    const N = cards.length;
    const visibleWidth = cardWidth * 0.3; // Each card shows 30% of its width
    const totalFanWidth = (N - 1) * visibleWidth + cardWidth; // Total width calculation
    
    // Fan parameters for realistic arc
    const θ_total = Math.min(50, N * 5); // Tighter fan angle
    const R = cardWidth * 2.2; // Radius for natural arc
    const θ_center = 0; // Center the fan
    
    // Container dimensions
    const fanWidth = Math.max(totalFanWidth, cardWidth * 2);
    const fanHeight = cardWidth * 1.8; // Higher container
    
    // Circle center positioned for proper arc
    const cx = fanWidth / 2;
    const cy = fanHeight + R * 0.6; // Moved higher (was 0.8)

    return (
      <View style={[styles.fanHand, { width: fanWidth, height: fanHeight }]}>
        {cards.map((card, index) => {
          const isSel = selectedCard && selectedCard.suit === card.suit && selectedCard.label === card.label;
          // Calculate angle for this card (centered distribution)
          const θ_i = θ_center + (index - (N - 1) / 2) * (θ_total / Math.max(N - 1, 1));
          const θ_rad = (θ_i * Math.PI) / 180;
          
          // Position on the circle
          const x_i = cx + R * Math.sin(θ_rad);
          const y_i = cy - R * Math.cos(θ_rad);
          
          // Card rotation: tangent to circle
          const cardRotation = θ_i;
          
          // Z-index for proper corner overlap:
          // - First card (index 0): shows fully, lowest z-index
          // - Middle cards: show only left corner, higher z-index as we go right
          // - Last card: shows fully, highest z-index
          let zIndex;
          if (index === 0) {
            zIndex = 1; // First card behind others
          } else if (index === N - 1) {
            zIndex = N + 1; // Last card on top
          } else {
            zIndex = index + 1; // Middle cards layered left to right
          }
          
          return (
            <View
              key={`${card.suit}-${card.label}-${index}`}
              style={{
                position: 'absolute',
                left: x_i - cardWidth / 2,
                top: y_i - (cardWidth * 1.5) / 2,
                zIndex: zIndex,
                transform: [{ rotate: `${cardRotation}deg` }],
              }}
            >
              <View style={{ opacity: canPlayCard ? (canPlayCard(card) ? 1 : 0.6) : 1 }}>
                <Card card={card} onPress={() => onCardPress(card)} cardWidth={cardWidth} isSelected={isSel} />
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // Regular linear layout
  const handWidth = overlap * (cards.length - 1) + cardWidth;
  return (
    <View style={[styles.hand, { height: Math.round(cardWidth * 1.55), width: handWidth }]}>
      {cards.map((card, index) => { const isSel = selectedCard && selectedCard.suit === card.suit && selectedCard.label === card.label; return (
        <View
          key={`${card.suit}-${card.label}-${index}`}
          style={{ position: 'absolute', left: index * overlap, zIndex: index, top: isSel ? -12 : 0 }}
        >
          <View style={{ opacity: canPlayCard ? (canPlayCard(card) ? 1 : 0.6) : 1 }}>
            <Card card={card} onPress={() => onCardPress(card)} cardWidth={cardWidth} isSelected={isSel} />
          </View>
        </View>
      );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  hand: {
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fanHand: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default Hand;
