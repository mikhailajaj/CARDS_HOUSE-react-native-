import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, Image, StyleSheet } from 'react-native';

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

const fallbackImage = require('../assets/img/cards/b1fv.png');

const Card = ({ card, onPress, cardWidth = 80, isSelected = false, testID = 'card-touchable' }) => {
  const cardHeight = Math.round(cardWidth * 1.5);
  const scale = useRef(new Animated.Value(1)).current;

  // Animate scale on selection change
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.08 : 1,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const suit = card?.suit;
  const label = card?.label;
  const source = suit && label ? (cardImages[suit]?.[label] ?? fallbackImage) : fallbackImage;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={`${label ?? 'Card'} of ${suit ?? 'Unknown'}`}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(isSelected) }}
      accessibilityHint="Double tap to play this card"
    >
      <Animated.View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            transform: [{ scale }],
          },
          // Apply elevation and translation based on selection state
          isSelected && styles.selectedCard,
        ]}
      >
        <Image source={source} style={styles.cardImage} />
      </Animated.View>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2d3748',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateY: 0 }], // Default position
  },
  selectedCard: {
    borderColor: '#4299e1', // Highlight color for selected card
    elevation: 8,
    transform: [{ translateY: -22 }], // Lift the card when selected
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 6,
  },
});

export default Card;
