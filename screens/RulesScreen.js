// RulesScreen.js

import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Hand from '../components/Hand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Example card sets for visualization
const exampleHand = [
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: 'Queen', value: 12 },
  { suit: 'Hearts', label: 'Jack', value: 11 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Hearts', label: '9', value: 9 },
];

const trumpExample = [
  { suit: 'Spades', label: 'Ace', value: 14 },
  { suit: 'Spades', label: 'King', value: 13 },
  { suit: 'Spades', label: 'Queen', value: 12 },
];

const trickExample1 = [
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Hearts', label: 'Ace', value: 14 }, // Winner - highest of lead suit
  { suit: 'Hearts', label: 'Jack', value: 11 },
];

const trickExample2 = [
  { suit: 'Hearts', label: 'King', value: 13 },
  { suit: 'Hearts', label: '10', value: 10 },
  { suit: 'Spades', label: '5', value: 5 }, // Winner - trump card beats all
  { suit: 'Diamonds', label: 'Ace', value: 14 },
];

const AnimatedCardLoop = ({ cards, title, subtitle, highlightIndex = -1 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.exampleContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {title && <Text style={styles.exampleTitle}>{title}</Text>}
      {subtitle && <Text style={styles.exampleSubtitle}>{subtitle}</Text>}
      <View style={styles.cardLoopContainer}>
        <Hand 
          cards={cards} 
          onCardPress={() => {}} 
          customCardWidth={60}
          fanLayout={false}
        />
      </View>
      {highlightIndex >= 0 && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerText}>✓ Winner</Text>
        </View>
      )}
    </Animated.View>
  );
};

const TrickVisualization = ({ cards, trumpSuit, leadSuit, winnerIndex, description }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.trickContainer}>
      <Text style={styles.trickDescription}>{description}</Text>
      <View style={styles.trickCardsWrapper}>
        {cards.map((card, index) => (
          <Animated.View
            key={`${card.suit}-${card.label}-${index}`}
            style={[
              styles.trickCard,
              index === winnerIndex && {
                transform: [{ scale: pulseAnim }],
                borderColor: '#FFD700',
                borderWidth: 3,
                borderRadius: 8,
              },
            ]}
          >
            <Hand 
              cards={[card]} 
              onCardPress={() => {}} 
              customCardWidth={55}
              fanLayout={false}
            />
            {index === winnerIndex && (
              <View style={styles.crownBadge}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
            )}
          </Animated.View>
        ))}
      </View>
      <View style={styles.trickInfo}>
        <Text style={styles.infoText}>Lead: {leadSuit}</Text>
        {trumpSuit && <Text style={styles.infoText}>Trump: {trumpSuit} ♠</Text>}
      </View>
    </View>
  );
};

const RulesScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <LinearGradient
        colors={['#1a202c', '#2d3748', '#1a202c']}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.mainTitle}>🃏 Tarneeb Rules 🃏</Text>
        <Text style={styles.subtitle}>Master the Game of Strategy</Text>
      </LinearGradient>

      {/* Game Objective Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.title}>Game Objective</Text>
        </View>
        <Text style={styles.paragraph}>
          The main objective in Tarneeb is to correctly estimate the number of tricks one can win in each round. Bid wisely and work with your partner to achieve your contract!
        </Text>
      </View>

      {/* Players and Teams Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>👥</Text>
          <Text style={styles.title}>Players & Teams</Text>
        </View>
        <Text style={styles.paragraph}>
          • 4 players divided into 2 teams{'\n'}
          • Team 1: Players 1 & 3 (North-South){'\n'}
          • Team 2: Players 2 & 4 (East-West){'\n'}
          • Each player receives 13 cards
        </Text>
      </View>

      {/* Card Hand Example */}
      <AnimatedCardLoop 
        cards={exampleHand}
        title="Example Hand"
        subtitle="Cards are grouped by suit and sorted by rank"
      />

      {/* Bidding Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>💬</Text>
          <Text style={styles.title}>Bidding Phase</Text>
        </View>
        <Text style={styles.paragraph}>
          • Bidding starts with the player to the right of the dealer{'\n'}
          • Players bid the number of tricks they think their team can win (7-13){'\n'}
          • Each bid must be higher than the previous{'\n'}
          • Pass if you don't want to bid higher{'\n'}
          • The highest bidder chooses the trump suit (Tarneeb)
        </Text>
      </View>

      {/* Trump Cards Visualization */}
      <AnimatedCardLoop 
        cards={trumpExample}
        title="Trump Cards (Tarneeb)"
        subtitle="♠ Spades are trump - they beat all other suits!"
      />

      {/* Playing Phase Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎮</Text>
          <Text style={styles.title}>Playing Phase</Text>
        </View>
        <Text style={styles.paragraph}>
          • The highest bidder's team leads the first trick{'\n'}
          • Players must follow the lead suit if possible{'\n'}
          • If you can't follow suit, you may play a trump card or any other card{'\n'}
          • The highest card of the lead suit wins, unless a trump is played{'\n'}
          • Trump cards always beat non-trump cards{'\n'}
          • The trick winner leads the next trick
        </Text>
      </View>

      {/* Trick Example 1: Normal Win */}
      <TrickVisualization
        cards={trickExample1}
        leadSuit="Hearts"
        trumpSuit={null}
        winnerIndex={2}
        description="Example 1: Ace of Hearts wins (highest card of lead suit)"
      />

      {/* Trick Example 2: Trump Win */}
      <TrickVisualization
        cards={trickExample2}
        leadSuit="Hearts"
        trumpSuit="Spades"
        winnerIndex={2}
        description="Example 2: 5 of Spades wins (trump beats everything!)"
      />

      {/* Scoring Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📊</Text>
          <Text style={styles.title}>Scoring</Text>
        </View>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Making the Contract:{'\n'}</Text>
          If your team wins at least as many tricks as bid, you score points equal to your bid amount.{'\n\n'}
          <Text style={styles.bold}>Breaking the Contract:{'\n'}</Text>
          If your team fails to meet the bid, you lose points equal to your bid amount.{'\n\n'}
          <Text style={styles.bold}>Winning the Game:{'\n'}</Text>
          The first team to reach 41 points (or the target score) wins the game!
        </Text>
      </View>

      {/* Strategy Tips */}
      <View style={[styles.section, styles.strategySection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>💡</Text>
          <Text style={styles.title}>Pro Tips</Text>
        </View>
        <Text style={styles.paragraph}>
          • Count your high cards and trump cards when bidding{'\n'}
          • Remember what cards have been played{'\n'}
          • Communicate with your partner through your plays{'\n'}
          • Trump cards are powerful - use them wisely{'\n'}
          • Leading with your highest cards can force out opponent's trumps
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Good luck and enjoy the game! 🎉</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e0',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4a5568',
  },
  bold: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  exampleContainer: {
    backgroundColor: '#edf2f7',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e0',
  },
  exampleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 6,
  },
  exampleSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardLoopContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  winnerBadge: {
    marginTop: 10,
    backgroundColor: '#48bb78',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  winnerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trickContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trickDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 15,
    textAlign: 'center',
  },
  trickCardsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  trickCard: {
    margin: 5,
    padding: 5,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  crownBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  crownEmoji: {
    fontSize: 16,
  },
  trickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#edf2f7',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  strategySection: {
    backgroundColor: '#fef5e7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
});

export default RulesScreen;
