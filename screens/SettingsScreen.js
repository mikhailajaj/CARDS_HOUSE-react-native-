import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Slider from '@react-native-community/slider';
import { useSettings } from '../utils/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const { settings, isLoaded, updatePlayTimeout } = useSettings();
  const [playTimeout, setPlayTimeout] = useState(15);
  
  // Timeout options in seconds
  const timeoutOptions = [5, 10, 15, 20, 30];
  
  // Load settings when available
  useEffect(() => {
    if (isLoaded && settings.playTimeout) {
      setPlayTimeout(settings.playTimeout);
    }
  }, [isLoaded, settings.playTimeout]);
  
  // Get the closest timeout option from slider value
  const getTimeoutFromSlider = (value) => {
    const index = Math.round(value);
    return timeoutOptions[index];
  };
  
  // Get slider value from timeout
  const getSliderValue = (timeout) => {
    return timeoutOptions.indexOf(timeout);
  };
  
  // Handle timeout change and save to storage
  const handleTimeoutChange = async (newTimeout) => {
    setPlayTimeout(newTimeout);
    await updatePlayTimeout(newTimeout);
  };
  
  if (!isLoaded) {
    return (
      <LinearGradient
        colors={['#1a472a', '#2d5a3d', '#0f3d1e']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4d03f" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </LinearGradient>
    );
  }
  return (
    <LinearGradient
      colors={['#1a472a', '#2d5a3d', '#0f3d1e']}
      style={styles.container}
    >
      {/* Back Button - Top Left */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="Go Back"
        accessibilityHint="Returns to home screen"
      >
        <FontAwesomeIcon icon={faArrowLeft} size={24} color="#f4d03f" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings & Preferences</Text>
          <Text style={styles.headerSubtitle}>Customize your game experience</Text>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Gameplay</Text>
          <View style={styles.settingItemWithSlider}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Player Turn Timeout</Text>
              <Text style={styles.settingValueLarge}>{playTimeout}s</Text>
            </View>
            <Text style={styles.settingNote}>
              Auto-play will trigger if you don't play within this time
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>5s</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={timeoutOptions.length - 1}
                step={1}
                value={getSliderValue(playTimeout)}
                onValueChange={(value) => setPlayTimeout(getTimeoutFromSlider(value))}
                onSlidingComplete={(value) => handleTimeoutChange(getTimeoutFromSlider(value))}
                minimumTrackTintColor="#f4d03f"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#f4d03f"
              />
              <Text style={styles.sliderLabel}>30s</Text>
            </View>
            <View style={styles.timeoutMarkers}>
              {timeoutOptions.map((option) => (
                <Text 
                  key={option} 
                  style={[
                    styles.markerText,
                    playTimeout === option && styles.markerTextActive
                  ]}
                >
                  {option}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Display</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Table Theme</Text>
            <Text style={styles.settingValue}>Classic Green</Text>
            <Text style={styles.settingNote}>Gradient background</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Card Size</Text>
            <Text style={styles.settingValue}>Default (80px)</Text>
            <Text style={styles.settingNote}>Base card width</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Game</Text>
            <Text style={styles.settingValue}>Tarneeb</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Framework</Text>
            <Text style={styles.settingValue}>React Native (Expo)</Text>
          </View>
        </View>

        {/* Note at bottom */}
        <Text style={styles.footerNote}>
          ✅ Settings are automatically saved
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f4d03f',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f4d03f',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4d03f',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b8d4a8',
    letterSpacing: 1,
    fontWeight: '300',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4d03f',
    marginBottom: 16,
    letterSpacing: 1,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingItemWithSlider: {
    paddingVertical: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 15,
    color: '#b8d4a8',
    fontWeight: '600',
  },
  settingValueLarge: {
    fontSize: 24,
    color: '#f4d03f',
    fontWeight: 'bold',
  },
  settingNote: {
    fontSize: 12,
    color: '#8fa88a',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#b8d4a8',
    fontWeight: '600',
    minWidth: 25,
    textAlign: 'center',
  },
  timeoutMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: 4,
  },
  markerText: {
    fontSize: 11,
    color: '#8fa88a',
    fontWeight: '500',
  },
  markerTextActive: {
    color: '#f4d03f',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerNote: {
    fontSize: 14,
    color: '#b8d4a8',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});
