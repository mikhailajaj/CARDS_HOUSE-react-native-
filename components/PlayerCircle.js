import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

const PlayerCircle = forwardRef(({
  player,
  playerIndex,
  isCurrentPlayer,
  onTimeUp,
  gamePhase,
  maxDuration = 5, // Maximum time in seconds for player to play
  onTimerStart, // Callback when timer starts
  onTimerStop, // Callback when timer stops
  size = 60,
  strokeWidth = 10
}, ref) => {
  const [showProfile, setShowProfile] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const pumpAnimationRef = useRef(null);
  const timeUpCalledRef = useRef(false);

  // Animated values
  const progress = useRef(new Animated.Value(1)).current; // 1 = full ring, 0 = empty
  const pumpScale = useRef(new Animated.Value(1)).current;

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const stopTimerInternal = useCallback(({ resetTime = true } = {}) => {
    setIsTimerActive(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animations
    progress.stopAnimation();
    if (pumpAnimationRef.current && pumpAnimationRef.current.stop) {
      pumpAnimationRef.current.stop();
      pumpAnimationRef.current = null;
    }

    // Reset animated values
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(pumpScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (resetTime) {
      setTimeLeft(maxDuration);
    }
  }, [maxDuration, progress, pumpScale]);

  const stopTimer = useCallback(() => {
    stopTimerInternal({ resetTime: true });
    onTimerStop && onTimerStop(playerIndex);
  }, [onTimerStop, playerIndex, stopTimerInternal]);

  const handleTimeUp = useCallback(() => {
    if (timeUpCalledRef.current) return;
    timeUpCalledRef.current = true;

    // Stop without firing onTimerStop here to preserve event order
    stopTimerInternal({ resetTime: true });

    // Fire callbacks in documented order (stop -> onTimeUp -> onTimerStop)
    onTimeUp && onTimeUp(playerIndex);
    onTimerStop && onTimerStop(playerIndex);
  }, [onTimeUp, onTimerStop, playerIndex, stopTimerInternal]);

  // Start timer function with animated API
  const startTimer = useCallback(() => {
    setIsTimerActive(true);
    setTimeLeft(maxDuration);
    timeUpCalledRef.current = false;
    onTimerStart && onTimerStart(playerIndex);

    // Reset progress to full ring
    progress.setValue(1);

    // Start shrinking ring animation
    Animated.timing(progress, {
      toValue: 0,
      duration: maxDuration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start((finished) => {
      // If animation finished naturally, handle time up
      if (finished?.finished) {
        handleTimeUp();
      }
    });

    // Start pulsing pump effect and store the loop to stop later
    pumpAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pumpScale, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pumpScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    );
    pumpAnimationRef.current.start();

    // Start countdown timer for display
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          // Ensure single execution even if the animation also completes
          handleTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [maxDuration, onTimerStart, playerIndex, progress, pumpScale, handleTimeUp]);

  // Trigger function to start the timer manually
  const triggerTimer = useCallback(() => {
    if (!isTimerActive && player?.isHuman && isCurrentPlayer && gamePhase === 'playing') {
      startTimer();
    }
  }, [isTimerActive, isCurrentPlayer, gamePhase, startTimer, player]);

  // Auto-start/stop timer based on turn and phase
  useEffect(() => {
    if (player?.isHuman && isCurrentPlayer && gamePhase === 'playing' && !isTimerActive) {
      startTimer();
    } else if (!isCurrentPlayer || gamePhase !== 'playing') {
      stopTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isCurrentPlayer, gamePhase, startTimer, stopTimer, isTimerActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimerInternal({ resetTime: false });
    };
  }, [stopTimerInternal]);

  const handlePress = () => {
    setShowProfile(true);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'P';
  };

  // Animated props for the progress ring
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Animated style for color interpolation
  const strokeColor = progress.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: ['#e53e3e', '#f56500', '#d69e2e', '#38a169'],
  });

  // Dynamic sizing
  const innerPadding = Math.max(10, strokeWidth + 6); // ensure the ring remains visible given stroke
  const innerSize = Math.max(24, size - innerPadding);
  const initialsFont = Math.round(innerSize * 0.32);
  const initialsFontUrgent = Math.round(innerSize * 0.36);
  const badgeSize = Math.max(18, Math.round(size * 0.36));
  const badgeOffset = -Math.round(Math.max(8, size * 0.133)); // keep the badge outside even with thicker ring

  // Expose trigger function for external use
  useImperativeHandle(ref, () => ({
    triggerTimer,
    stopTimer,
    isTimerActive,
    timeLeft
  }));

  return (
    <>
      <TouchableOpacity onPress={handlePress}>
        <AnimatedView style={[
          styles.circleContainer,
          { width: size, height: size },
          { transform: [{ scale: isCurrentPlayer && isTimerActive ? pumpScale : 1 }] }
        ]}>
          {/* Timer Ring */}
          {player?.isHuman && isCurrentPlayer && gamePhase === 'playing' && isTimerActive && (
            <Svg
              width={size}
              height={size}
              style={styles.svgCircle}
            >
              {/* Background circle (keep for contrast) */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Animated countdown ring */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={strokeColor}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
          )}

          <View style={[
            styles.circle,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
            isCurrentPlayer && styles.activeCircle,
            isTimerActive && styles.timerActiveCircle,
          ]}>
            <Text style={[
              styles.initials,
              { fontSize: initialsFont },
              isTimerActive && timeLeft <= 10 && [styles.urgentText, { fontSize: initialsFontUrgent }]
            ]}>
              {getInitials(player?.name)}
            </Text>
            {/* Numeric badge removed per request */}
            {false && player?.isHuman && isCurrentPlayer && gamePhase === 'playing' && isTimerActive && (
              <View style={[
                styles.timerContainer,
                { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, bottom: badgeOffset, right: badgeOffset },
                timeLeft <= 10 && styles.urgentTimer
              ]}>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            )}
          </View>
        </AnimatedView>
      </TouchableOpacity>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowProfile(false)}
        >
          <View style={styles.profileModal}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>
                {getInitials(player?.name)}
              </Text>
            </View>
            <Text style={styles.playerName}>{player?.name || `Player ${playerIndex + 1}`}</Text>
            <Text style={styles.playerInfo}>
              {player?.isHuman ? 'Human Player' : 'AI Player'}
            </Text>
            <Text style={styles.playerStats}>
              Cards: {player?.hand?.length || 0}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  circle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  activeCircle: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  timerActiveCircle: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.8)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  initials: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  urgentText: {
    color: '#e53e3e',
  },
  timerContainer: {
    position: 'absolute',
    backgroundColor: '#38a169',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  urgentTimer: {
    backgroundColor: '#e53e3e',
    transform: [{ scale: 1.1 }],
  },
  timerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  playerInfo: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 5,
  },
  playerStats: {
    fontSize: 12,
    color: '#718096',
  },
});

PlayerCircle.displayName = 'PlayerCircle';

export default PlayerCircle;
