/**
 * Hand component renders a hand of playing cards.
 * Takes in array of card objects with suit and label.
 * Renders Card components in a row with overlap.
 * Allows pressing on individual cards via onCardPress callback.
 * Customizable with size, overlap, and style props.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Card from './Card';
import PropTypes from 'prop-types';

const Hand = ({ cards, onCardPress, size = 'medium', overlap = 40, style, position }) => {
  const overlapValue = useMemo(() => size === 'large' ? 60 : overlap, [size, overlap]);

  return (
    <View style={[styles.hand, style]}>
      {cards.map((card, index) => (
        <View key={`${card.suit}-${card.label}-${index}`} style={[styles.cardContainer, { marginLeft: index > 0 ? -overlapValue : 0 }]}>
          <Card card={card} onPress={() => onCardPress(card)} size={size} />
        </View>
      ))}
    </View>
  );
}; propTypes = {
  cards: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    suit: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  onCardPress: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'extraSmall']),
  overlap: PropTypes.number,
  style: PropTypes.object,
};

Hand.defaultProps = {
  onCardPress: () => { },
  overlap: 40,
};

// Updated styles
const styles = StyleSheet.create({
  hand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  cardContainer: {
    position: 'relative',
  },
});


export default Hand;