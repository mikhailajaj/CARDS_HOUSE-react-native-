import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#1a472a', '#2d5a3d', '#0f3d1e']}
      style={styles.container}
      accessibilityLabel="Home Screen"
    >
      {/* Settings Gear Icon */}
      <TouchableOpacity 
        style={styles.settingsIcon}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.7}
        accessibilityLabel="Settings Button"
        accessibilityHint="Opens settings and preferences"
      >
        <FontAwesomeIcon icon={faCog} size={28} color="#f4d03f" />
      </TouchableOpacity>

      {/* Title Section */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleMain} accessibilityRole="header">TARNEEB</Text>
        <Text style={styles.titleSubtitle}>Classic Card Game</Text>
        <View style={styles.cardSymbols}>
          <Text style={styles.cardSymbol}>♠</Text>
          <Text style={styles.cardSymbol}>♥</Text>
          <Text style={styles.cardSymbol}>♦</Text>
          <Text style={styles.cardSymbol}>♣</Text>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Game')}
          activeOpacity={0.8}
          accessibilityLabel="Play Game Button"
          accessibilityHint="Navigates to the game screen"
        >
          <LinearGradient
            colors={['#d4af37', '#f4d03f', '#c99700']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonIcon}>🎮</Text>
            <Text style={styles.buttonText}>Play Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Rules')}
          activeOpacity={0.8}
          accessibilityLabel="View Rules Button"
          accessibilityHint="Navigates to the rules screen"
        >
          <LinearGradient
            colors={['#4a90e2', '#5ca8f5', '#357abd']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonIcon}>📖</Text>
            <Text style={styles.buttonText}>View Rules</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Tap to begin your journey</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 60,
  },
  settingsIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleMain: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#f4d03f',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  titleSubtitle: {
    fontSize: 18,
    color: '#b8d4a8',
    letterSpacing: 2,
    fontWeight: '300',
    marginBottom: 20,
  },
  cardSymbols: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  cardSymbol: {
    fontSize: 40,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: width * 0.7,
    maxWidth: 300,
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonIcon: {
    fontSize: 28,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    fontSize: 14,
    color: '#8fa88a',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
