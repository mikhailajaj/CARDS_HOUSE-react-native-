import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const PlayerMessage = ({ message, visible, position = 'bottom', duration = 3000 }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    if (visible && message) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message, duration]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return styles.messageTop;
      case 'left':
        return styles.messageLeft;
      case 'right':
        return styles.messageRight;
      case 'bottom':
      default:
        return styles.messageBottom;
    }
  };

  // Don't render when not visible
  if (!visible || !message) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        getPositionStyles(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.messageText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: 200,
    minWidth: 80,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  messageText: {
    color: '#1a202c',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageTop: {
    top: 10,
    alignSelf: 'center',
  },
  messageBottom: {
    bottom: 10,
    alignSelf: 'center',
  },
  messageLeft: {
    left: 10,
    top: '50%',
    marginTop: -20,
  },
  messageRight: {
    right: 10,
    top: '50%',
    marginTop: -20,
  },
});

export default PlayerMessage;