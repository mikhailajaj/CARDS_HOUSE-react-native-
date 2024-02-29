// RulesScreen.js

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

const RulesScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Game Objective</Text>
        <Text style={styles.paragraph}>
          The main objective in Tarneeb is to correctly estimate the number of tricks one can win in each round.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>How to Play</Text>
        <Text style={styles.paragraph}>
          - The game is played by four players divided into two teams.
        </Text>
        <Text style={styles.paragraph}>
          - Each player is dealt 13 cards.
        </Text>
        <Text style={styles.paragraph}>
          - Players bid to decide the tarneeb (trump) suit.
        </Text>
        <Text style={styles.paragraph}>
          - The team that wins the bid leads the first trick.
        </Text>
        <Text style={styles.paragraph}>
          - Players must follow suit if possible. If not, they can play a tarneeb card or any other card.
        </Text>
        <Text style={styles.paragraph}>
          - The highest card of the suit led wins the trick unless a tarneeb card is played.
        </Text>
        <Text style={styles.paragraph}>
          - The objective is to win the number of tricks bid or prevent the other team from doing so.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Scoring</Text>
        <Text style={styles.paragraph}>
          - The team that meets their bid wins points equal to their bid.
        </Text>
        <Text style={styles.paragraph}>
          - Failing to meet the bid results in points deducted equal to the bid amount.
        </Text>
        <Text style={styles.paragraph}>
          - The first team to reach a predetermined score wins the game.
        </Text>
      </View>

      {/* Add more sections as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff', // Consider using a light, neutral background color
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24, // Adjust line height for better readability
    textAlign: 'justify', // Justify text for a cleaner look
  },
});

export default RulesScreen;
