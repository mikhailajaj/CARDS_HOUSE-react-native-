import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faTrophy, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { BlurView as ExpoBlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScoreTracker = ({ gameState }) => {
  const [showHistory, setShowHistory] = useState(false);

  // Safety check - don't render if gameState is not properly initialized
  if (!gameState || !gameState.teams) {
    return null;
  }

  const team1Score = gameState?.teams?.team1?.score || 0;
  const team2Score = gameState?.teams?.team2?.score || 0;
  const scoreHistory = gameState?.scoreHistory || [];
  const currentRound = gameState?.round || 1;
  const trumpSuit = gameState?.contract?.trumpSuit || null;

  // Get player scores - P0 and P2 are team1, P1 and P3 are team2
  const players = gameState?.players || [];
  const p0Score = team1Score; // Top player (team1)
  const p1Score = team2Score; // Left player (team2)
  const p2Score = team1Score; // Bottom player (team1)
  const p3Score = team2Score; // Right player (team2)

  // Determine border colors based on score comparison
  const getBorderColor = (playerScore, isTeam1) => {
    if (team1Score === team2Score) {
      return '#718096'; // Gray for equal scores
    }
    if (isTeam1) {
      return team1Score > team2Score ? '#48bb78' : '#f56565'; // Green if winning, red if losing
    } else {
      return team2Score > team1Score ? '#48bb78' : '#f56565'; // Green if winning, red if losing
    }
  };

  // Get suit symbol and color
  const getSuitSymbol = (suit) => {
    const symbols = {
      'Spades': '♠',
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣'
    };
    return symbols[suit] || '';
  };

  const getSuitColor = (suit) => {
    return (suit === 'Hearts' || suit === 'Diamonds') ? '#e53e3e' : '#2d3748';
  };

  // Determine if game is over and who won
  const gameOver = gameState?.phase === 'gameOver';
  const winningScore = gameState?.winningScore || 31;
  const team1Won = team1Score >= winningScore;
  const team2Won = team2Score >= winningScore;

  return (
    <>
      {/* Score Display - Cross-shaped layout below exit button */}
      <TouchableOpacity
        style={styles.scoreContainer}
        onPress={() => setShowHistory(true)}
        activeOpacity={0.8}
      >
        {/* Trump Suit - Above the cross layout */}
        {trumpSuit && (
          <View style={styles.topTrump}>
            <Text style={[styles.trumpSymbol, { color: getSuitColor(trumpSuit) }]}>
              {getSuitSymbol(trumpSuit)}
            </Text>
          </View>
        )}

        <View style={styles.crossLayout}>
          {/* Vertical Rectangle - Connects Top and Bottom */}
          <View style={[
            styles.verticalLine,
            { backgroundColor: getBorderColor(p0Score, true) }
          ]} />

          {/* Horizontal Rectangle - Connects Left and Right */}
          <View style={[
            styles.horizontalLine,
            { backgroundColor: getBorderColor(p1Score, false) }
          ]} />

          {/* Player 0 - Top */}
          <View style={[styles.scoreBox, styles.topBox]}>
            <Text style={styles.scoreValue}>{p0Score}</Text>
          </View>

          {/* Player 1 - Left */}
          <View style={[styles.scoreBox, styles.leftBox]}>
            <Text style={styles.scoreValue}>{p1Score}</Text>
          </View>

          {/* Player 3 - Right */}
          <View style={[styles.scoreBox, styles.rightBox]}>
            <Text style={styles.scoreValue}>{p3Score}</Text>
          </View>

          {/* Player 2 - Bottom */}
          <View style={[styles.scoreBox, styles.bottomBox]}>
            <Text style={styles.scoreValue}>{p2Score}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <ExpoBlurView intensity={40} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header with Team Scores */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>
                  TEAM 1 ({team1Score}) {team1Won && '🏆'} VS TEAM 2 ({team2Score}) {team2Won && '🏆'}
                </Text>
                {!gameOver && (
                  <Text style={styles.roundSubtitle}>Round {currentRound}</Text>
                )}
                {gameOver && (
                  <Text style={styles.gameOverSubtitle}>Game Over</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.closeButton}
              >
                <FontAwesomeIcon icon={faTimes} size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* History Table */}
            <View style={styles.historyScroll}>
              {scoreHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesomeIcon icon={faHandshake} size={48} color="#cbd5e0" />
                  <Text style={styles.emptyText}>No rounds completed yet</Text>
                  <Text style={styles.emptySubtext}>
                    Score history will appear here after each round
                  </Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.roundColumn]}>Rd</Text>
                    <Text style={[styles.tableHeaderCell, styles.contractColumn]}>Bid</Text>
                    <Text style={[styles.tableHeaderCell, styles.teamColumn]}>Team 1</Text>
                    <Text style={[styles.tableHeaderCell, styles.teamColumn]}>Team 2</Text>
                  </View>

                  {/* Table Body */}
                  <ScrollView style={styles.tableBody}>
                    {scoreHistory.map((entry, index) => {
                      // Determine which team won this round
                      const team1WonRound = entry.team1Change > entry.team2Change;
                      const team2WonRound = entry.team2Change > entry.team1Change;
                      const isTie = entry.team1Change === entry.team2Change;
                      
                      return (
                        <View 
                          key={index} 
                          style={[
                            styles.tableRow,
                            index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                          ]}
                        >
                          {/* Round */}
                          <View style={[styles.tableCell, styles.roundColumn]}>
                            <Text style={styles.roundCell}>
                              {entry.round}
                            </Text>
                          </View>

                          {/* Contract - Pill Style */}
                          <View style={[styles.tableCell, styles.contractColumn]}>
                            {entry.contract ? (
                              <View style={[
                                styles.contractPill,
                                entry.contractMade ? styles.contractPillSuccess : styles.contractPillFailed
                              ]}>
                                <Text style={styles.contractAmount}>{entry.contract.amount}</Text>
                                <Text style={[
                                  styles.contractSuitSymbol,
                                  { color: getSuitColor(entry.contract.trumpSuit) }
                                ]}>
                                  {getSuitSymbol(entry.contract.trumpSuit)}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.contractCellText}>-</Text>
                            )}
                          </View>

                          {/* Team 1 Score */}
                          <View style={[
                            styles.tableCell, 
                            styles.teamColumn,
                            entry.team1Change > 0 && styles.teamCellWin,
                            entry.team1Change < 0 && styles.teamCellLoss
                          ]}>
                            <View style={styles.scoreContainer}>
                              <Text style={styles.scoreTotalText}>
                                {entry.team1Total}
                              </Text>
                              <Text style={[
                                styles.scoreChangeSmall,
                                entry.team1Change > 0 ? styles.positiveChange : styles.negativeChange
                              ]}>
                                {entry.team1Change > 0 ? '+' : ''}{entry.team1Change}
                              </Text>
                            </View>
                          </View>

                          {/* Team 2 Score */}
                          <View style={[
                            styles.tableCell, 
                            styles.teamColumn,
                            entry.team2Change > 0 && styles.teamCellWin,
                            entry.team2Change < 0 && styles.teamCellLoss
                          ]}>
                            <View style={styles.scoreContainer}>
                              <Text style={styles.scoreTotalText}>
                                {entry.team2Total}
                              </Text>
                              <Text style={[
                                styles.scoreChangeSmall,
                                entry.team2Change > 0 ? styles.positiveChange : styles.negativeChange
                              ]}>
                                {entry.team2Change > 0 ? '+' : ''}{entry.team2Change}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ExpoBlurView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Score Container - positioned by parent wrapper in GameScreen
  scoreContainer: {
    alignItems: 'center',
    width: 70,
  },
  topTrump: {
    marginBottom: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  trumpSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  crossLayout: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  // Vertical rectangle connecting top and bottom
  verticalLine: {
    position: 'absolute',
    width: 4,
    height: 50,
    top: 10,
    left: 33, // Centered: (70 - 4) / 2
    borderRadius: 2,
    opacity: 0.8,
  },
  // Horizontal rectangle connecting left and right
  horizontalLine: {
    position: 'absolute',
    width: 50,
    height: 4,
    top: 33, // Centered: (70 - 4) / 2
    left: 10,
    borderRadius: 2,
    opacity: 0.8,
  },
  scoreBox: {
    position: 'absolute',
    width: 26,
    height: 26,
    backgroundColor: 'transparent',
    borderRadius: 4,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBox: {
    top: 0,
    left: 22, // Centered: (70 - 26) / 2 = 22
  },
  leftBox: {
    top: 22, // Centered vertically
    left: 0,
  },
  rightBox: {
    top: 22, // Centered vertically
    right: 0,
  },
  bottomBox: {
    bottom: 0,
    left: 22, // Centered: (70 - 26) / 2 = 22
  },
  scoreValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: Math.min(SCREEN_WIDTH * 0.92, 520),
    height: SCREEN_HEIGHT * 0.75, // Fixed height instead of maxHeight for better flex behavior
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  roundSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    marginTop: 4,
  },
  gameOverSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e53e3e',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },

  // History Table
  historyScroll: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Table Container
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#1a202c',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Table Body
  tableBody: {
    flexGrow: 1,
    maxHeight: SCREEN_HEIGHT * 0.45, // Ensure scrollable area has proper height
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 56,
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },

  // Table Cells
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  
  // Column Widths
  roundColumn: {
    flex: 0.8,
    minWidth: 45,
    alignItems: 'center',
  },
  contractColumn: {
    flex: 1.6,
    minWidth: 85,
    alignItems: 'center',
  },
  teamColumn: {
    flex: 1.8,
    minWidth: 90,
    alignItems: 'center',
  },

  // Cell Content
  roundCell: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2d3748',
  },
  
  // Contract Pill Style
  contractPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  contractPillSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#48bb78',
  },
  contractPillFailed: {
    backgroundColor: '#f8d7da',
    borderColor: '#f56565',
  },
  contractAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2d3748',
  },
  contractSuitSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contractCellText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a0aec0',
  },
  
  // Team Cell Win/Loss Background
  teamCellWin: {
    backgroundColor: 'rgba(72, 187, 120, 0.08)',
  },
  teamCellLoss: {
    backgroundColor: 'rgba(245, 101, 101, 0.08)',
  },
  
  // Score Display
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTotalText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2d3748',
    letterSpacing: 0.5,
  },
  scoreChangeSmall: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  positiveChange: {
    color: '#38a169',
  },
  negativeChange: {
    color: '#e53e3e',
  },

  // Footer
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  closeModalButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4299e1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ScoreTracker;
