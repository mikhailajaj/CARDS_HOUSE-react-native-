/**
 * Card component renders a playing card with image, dimensions, 
 * and accessibility based on provided props. Allows pressing card.
 */
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
// Static image requires
const cardImages = {
  Diamonds: {
    'Ace': require('../assets/img/cards/Diamonds/1.png'),
    '2': require('../assets/img/cards/Diamonds/2.png'),
    '3': require('../assets/img/cards/Diamonds/3.png'),
    '4': require('../assets/img/cards/Diamonds/4.png'),
    '5': require('../assets/img/cards/Diamonds/5.png'),
    '6': require('../assets/img/cards/Diamonds/6.png'),
    '7': require('../assets/img/cards/Diamonds/7.png'),
    '8': require('../assets/img/cards/Diamonds/8.png'),
    '9': require('../assets/img/cards/Diamonds/9.png'),
    '10': require('../assets/img/cards/Diamonds/10.png'),
    'Jack': require('../assets/img/cards/Diamonds/11.png'),
    'Queen': require('../assets/img/cards/Diamonds/12.png'),
    'King': require('../assets/img/cards/Diamonds/13.png')
  },
  Clubs: {
    'Ace': require('../assets/img/cards/Clubs/1.png'),
    '2': require('../assets/img/cards/Clubs/2.png'),
    '3': require('../assets/img/cards/Clubs/3.png'),
    '4': require('../assets/img/cards/Clubs/4.png'),
    '5': require('../assets/img/cards/Clubs/5.png'),
    '6': require('../assets/img/cards/Clubs/6.png'),
    '7': require('../assets/img/cards/Clubs/7.png'),
    '8': require('../assets/img/cards/Clubs/8.png'),
    '9': require('../assets/img/cards/Clubs/9.png'),
    '10': require('../assets/img/cards/Clubs/10.png'),
    'Jack': require('../assets/img/cards/Clubs/11.png'),
    'Queen': require('../assets/img/cards/Clubs/12.png'),
    'King': require('../assets/img/cards/Clubs/13.png')
  },

  Hearts: {
    '2': require('../assets/img/cards/Hearts/2.png'),
    '3': require('../assets/img/cards/Hearts/3.png'),
    '4': require('../assets/img/cards/Hearts/4.png'),
    '5': require('../assets/img/cards/Hearts/5.png'),
    '6': require('../assets/img/cards/Hearts/6.png'),
    '7': require('../assets/img/cards/Hearts/7.png'),
    '8': require('../assets/img/cards/Hearts/8.png'),
    '9': require('../assets/img/cards/Hearts/9.png'),
    '10': require('../assets/img/cards/Hearts/10.png'),
    'Jack': require('../assets/img/cards/Hearts/11.png'),
    'Queen': require('../assets/img/cards/Hearts/12.png'),
    'King': require('../assets/img/cards/Hearts/13.png'),
    'Ace': require('../assets/img/cards/Hearts/1.png')
  },
  Spades: {
    '2': require('../assets/img/cards/Spades/2.png'),
    '3': require('../assets/img/cards/Spades/3.png'),
    '4': require('../assets/img/cards/Spades/4.png'),
    '5': require('../assets/img/cards/Spades/5.png'),
    '6': require('../assets/img/cards/Spades/6.png'),
    '7': require('../assets/img/cards/Spades/7.png'),
    '8': require('../assets/img/cards/Spades/8.png'),
    '9': require('../assets/img/cards/Spades/9.png'),
    '10': require('../assets/img/cards/Spades/10.png'),
    'Jack': require('../assets/img/cards/Spades/11.png'),
    'Queen': require('../assets/img/cards/Spades/12.png'),
    'King': require('../assets/img/cards/Spades/13.png'),
    'Ace': require('../assets/img/cards/Spades/1.png')
  },
};


const CARD_SIZES = {
  small: { width: 29, height: 42 }, // Smaller dimensions
  medium: { width: 45, height: 65 }, // Original dimensions
  large: { width: 70, height: 100 }, // Larger dimensions
  extraSmall: { width: 18, height: 25 }, // Extra small dimensions
};

const Card = ({ card, onPress, size, style }) => {
  const cardImage = cardImages[card.suit][card.label] || require('../assets/img/cards/b1fv.png');
  const cardSize = CARD_SIZES[size] || CARD_SIZES.medium;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, cardSize, style]}
      accessible={true}
      accessibilityLabel={`Card ${card.label} of ${card.suit}`}
      accessibilityHint="Double tap to select the card"
    >
      <Image source={cardImage} style={styles.cardImage} />
    </TouchableOpacity>
  );
};

Card.propTypes = {
  card: PropTypes.shape({
    suit: PropTypes.oneOf(['Diamonds', 'Clubs', 'Hearts', 'Spades']).isRequired,
    label: PropTypes.oneOf(['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King']).isRequired,
  }).isRequired,
  onPress: PropTypes.func,
  size: PropTypes.oneOf(Object.keys(CARD_SIZES)),
  style: PropTypes.object,
};

Card.defaultProps = {
  onPress: () => { },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3.84,
    shadowOpacity: 0.25,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 5,
  },
});

export default Card;