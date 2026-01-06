import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
// import PropTypes from 'prop-types'; // Uncomment if you use prop-types

const Deck = ({ onDealCards }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onDealCards} 
      accessibilityLabel="Deal Cards" 
      accessibilityRole="button" // Explicitly set the role for better accessibility
    >
      <View style={styles.deck}>
        <Text style={styles.text}>Deal Cards</Text>
      </View>
    </TouchableOpacity>
  );
};

// Uncomment and use if you want to enforce prop types
// Deck.propTypes = {
//   onDealCards: PropTypes.func.isRequired,
// };

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deck: {
    backgroundColor: '#0275d8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Deck;
