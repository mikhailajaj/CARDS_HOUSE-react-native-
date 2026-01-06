// Player.js
import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for prop validation
import { View, StyleSheet } from 'react-native';
import Hand from './Hand'; // Import Hand component

const Player = ({ playerData, onCardPress, canPlayCard, isPlayerTurn, playerPosition = 'bottom', customCardWidth, fanLayout = false, selectedCard }) => {
  const handleCardPress = (card) => {
    // Pass through the card only; the screen-level callback already knows the player index
    onCardPress(card);
  };
  
  return (
    <View style={styles.container}>
      <Hand 
        cards={playerData?.hand ?? []} 
        onCardPress={handleCardPress}
        canPlayCard={canPlayCard}
        customCardWidth={customCardWidth}
        fanLayout={fanLayout}
        selectedCard={selectedCard}
      />
    </View>
  );
};
// Define PropTypes for Player component
Player.propTypes = {
  playerData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    hand: PropTypes.arrayOf(PropTypes.shape({
      suit: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })).isRequired,
  }).isRequired,
  onCardPress: PropTypes.func.isRequired,
  canPlayCard: PropTypes.func,
  isPlayerTurn: PropTypes.bool,
  customCardWidth: PropTypes.number,
  fanLayout: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Player;