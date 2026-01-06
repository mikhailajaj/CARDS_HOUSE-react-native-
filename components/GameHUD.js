import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GameHUD = ({ 
  trumpSuit, 
  highestBid, 
  teamTricks, 
  currentPlayer, 
  gamePhase,
  highestBidderIndex,
  declarerTeam,
  teamBidThresholds,
  teamScores,
  round = 1
}) => {
  // Unicode symbols for suits
  const suitSymbols = {
    'Spades': '♠',
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣'
  };

  // Get the appropriate suit symbol
  const getTrumpSymbol = () => {
    return suitSymbols[trumpSuit] || '?';
  };

  // Get trump suit color (red for Hearts/Diamonds, black for Spades/Clubs)
  const getTrumpColor = () => {
    return (trumpSuit === 'Hearts' || trumpSuit === 'Diamonds') ? '#FF0000' : '#000000';
  };

  // Format team name for display
  const getTeamName = (team) => {
    return team === 'team1' ? 'Team 1' : 'Team 2';
  };

  // Get current player name
  const getCurrentPlayerName = () => {
    return `Player ${currentPlayer + 1}`;
  };

  return (
    <View style={styles.hudContainer}>
      {/* Trump Suit Display */}
      <View style={styles.trumpContainer}>
        <Text style={styles.hudLabel}>Trump:</Text>
        <Text style={[styles.trumpSymbol, { color: getTrumpColor() }]}>
          {getTrumpSymbol()}
        </Text>
        <Text style={styles.trumpText}>{trumpSuit}</Text>
      </View>

      {/* Bidding Information */}
      {(highestBid || (teamBidThresholds && (teamBidThresholds.team1 > 0 || teamBidThresholds.team2 > 0))) && (
        <View style={styles.bidContainer}>
          <Text style={styles.hudLabel}>Bids:</Text>
          {highestBid && (
            <>
              <Text style={styles.bidText}>{highestBid}</Text>
              {declarerTeam && (
                <Text style={styles.bidTeamText}>({getTeamName(declarerTeam)})</Text>
              )}
            </>
          )}
          {teamBidThresholds && (teamBidThresholds.team1 > 0 || teamBidThresholds.team2 > 0) && (
            <Text style={styles.thresholdText}>
              T1:{teamBidThresholds.team1} T2:{teamBidThresholds.team2}
            </Text>
          )}
        </View>
      )}

      {/* Round Display */}
      <View style={styles.roundContainer}>
        <Text style={styles.hudLabel}>Round:</Text>
        <Text style={styles.roundText}>{round}</Text>
      </View>

      {/* Team Tricks Display */}
      <View style={styles.tricksContainer}>
        <Text style={styles.hudLabel}>Tricks:</Text>
        <Text style={styles.tricksText}>
          T1: {teamTricks?.team1?.tricks || 0} | T2: {teamTricks?.team2?.tricks || 0}
        </Text>
      </View>

      {/* Team Scores Display */}
      {teamScores && (
        <View style={styles.scoresContainer}>
          <Text style={styles.hudLabel}>Scores:</Text>
          <Text style={styles.scoresText}>
            T1: {teamScores?.team1?.score || 0} | T2: {teamScores?.team2?.score || 0}
          </Text>
        </View>
      )}

      {/* Current Turn Indicator */}
      <View style={styles.turnContainer}>
        <Text style={styles.hudLabel}>Turn:</Text>
        <Text style={styles.turnText}>{getCurrentPlayerName()}</Text>
      </View>

      {/* Game Phase Indicator (optional, for debugging/development) */}
      {gamePhase && (
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseText}>{gamePhase}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
  },
  trumpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tricksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(237, 137, 54, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(72, 187, 120, 0.3)',
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trumpSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 4,
  },
  trumpText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bidText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 5,
  },
  bidTeamText: {
    color: '#FFA500',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  thresholdText: {
    color: '#87CEEB',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 8,
    opacity: 0.9,
  },
  roundText: {
    color: '#9f7aea',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tricksText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scoresText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  turnText: {
    color: '#48bb78',
    fontSize: 13,
    fontWeight: 'bold',
  },
  phaseText: {
    color: '#a0aec0',
    fontSize: 10,
    fontStyle: 'italic',
    textTransform: 'capitalize',
    opacity: 0.8,
  },
});

export default GameHUD;