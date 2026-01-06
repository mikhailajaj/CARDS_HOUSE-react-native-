import React, { useState, useEffect } from 'react';
import { evaluateBid, chooseTrumpSuit } from './utils/biddingStrategy';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const Bidding = ({ 
  visible, 
  currentBidder, 
  highestBid, 
  highestBidder,
  players, 
  playersStillBidding,
  onBid, 
  onBiddingComplete,
  onTrumpSelect,
  isHumanPlayer,
  biddingComplete = false,
  contract = null
}) => {


  const suits = [
    { name: 'Spades', symbol: '♠', color: '#000' },
    { name: 'Hearts', symbol: '♥', color: '#e53e3e' },
    { name: 'Diamonds', symbol: '♦', color: '#e53e3e' },
    { name: 'Clubs', symbol: '♣', color: '#000' }
  ];

  const minBid = Math.max(7, highestBid + 1);
  const maxBid = 13;

  // Check if bidding should be complete
  useEffect(() => {
    if (!visible) return;
    if (!playersStillBidding) return;
    if (biddingComplete) return;

    // Complete bidding when only one player remains (even if all passed).
    // The reducer will force the dealer to 7 if highestBidder is null.
    if (playersStillBidding.length <= 1) {
      onBiddingComplete();
    }
  }, [visible, playersStillBidding?.length, highestBidder, biddingComplete]);
  
  // Auto-bid for AI players
  useEffect(() => {
    if (!visible) return;
    if (biddingComplete) return;
    if (currentBidder === null || currentBidder === undefined) return;
    if (isHumanPlayer) return;

    const timer = setTimeout(() => {
      handleAIBid();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [visible, biddingComplete, currentBidder, isHumanPlayer]);
  
  // Auto-select trump for AI winner
  useEffect(() => {
    if (!biddingComplete) return;
    if (!contract || contract.declarer === null) return;
    if (contract.trumpSuit !== null) return;
    if (players[contract.declarer]?.isHuman) return;

    const timer = setTimeout(() => {
      handleAITrumpSelection();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [biddingComplete, contract?.declarer, contract?.trumpSuit, players]);

  const handleAIBid = () => {
    if (true) {
      try {
        // lazy require to avoid circular import problems in some RN setups
        const strat = require('./utils/biddingStrategy');
        const { suit, tricks } = strat ? strat.pickBestTrumpByTricks?.(players[currentBidder]?.hand || []) || {} : {};
        console.log('[AI-BID/CTX]', {
          currentBidder,
          highestBid,
          highestBidder,
          bestSuit: suit,
          myExpected: tricks,
        });
      } catch (e) {
        // ignore
      }
    }
    const aiPlayer = players[currentBidder];
    const hand = aiPlayer?.hand || [];

    const decision = evaluateBid(hand, highestBid, highestBidder, currentBidder);

    if (decision.type === 'bid') {
      const bidAmount = Math.max(minBid, Math.min(decision.amount, maxBid));
      onBid(currentBidder, bidAmount, 'bid');
    } else {
      onBid(currentBidder, 0, 'pass');
    }
  };

  const handleBidAmount = (amount) => {
    onBid(currentBidder, amount, 'bid');
  };

  const handleTrumpSelection = (suit) => {
    onTrumpSelect(suit);
  };

  // Optional: AI trump choice aligned with strategy
  const handleAITrumpSelection = () => {
    const aiPlayer = players[contract.declarer];
    const hand = aiPlayer?.hand || [];
    const suit = chooseTrumpSuit(hand);
    handleTrumpSelection(suit);
  };

  const handlePass = () => {
    onBid(currentBidder, 0, 'pass');
  };



  if (!visible) return null;

  return (
    <View style={styles.tableOverlay}>
      <View style={styles.container}>
        {biddingComplete && contract && contract.declarer !== null ? (
          // Trump selection phase - simplified
          <View style={styles.trumpSelection}>
            <Text style={styles.headerText}>Choose Trump Suit</Text>
            <View style={styles.suitButtons}>
              {suits.map(suit => (
                <TouchableOpacity
                  key={suit.name}
                  style={[styles.suitButton, { borderColor: suit.color }]}
                  onPress={() => handleTrumpSelection(suit.name)}
                >
                  <Text style={[styles.suitSymbol, { color: suit.color }]}>
                    {suit.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // Bidding phase - simplified
          <View style={styles.humanBidding}>
            <Text style={styles.headerText}>Your Bid</Text>
            <View style={styles.bidAmountContainer}>
              <View style={styles.bidButtons}>
                {Array.from({ length: maxBid - minBid + 1 }, (_, i) => minBid + i).map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.bidButton}
                    onPress={() => handleBidAmount(amount)}
                  >
                    <Text style={styles.bidButtonText}>{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                <Text style={styles.passButtonText}>Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -85 }], // Center in table area (half of 160px width)
    zIndex: 1000,
    pointerEvents: 'box-none', // Allow touches to pass through to underlying components
  },
  container: {
    backgroundColor: 'rgba(255, 253, 245, 0.98)', // Warm gold-tinted background
    borderRadius: 12,
    padding: 12,
    width: 160, // Increased from 120px
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#d4af37', // Gold shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 3, // Thicker border
    borderColor: 'rgba(212, 175, 55, 0.9)', // Richer gold border
  },
  headerText: {
    fontSize: 14, // Reduced from 18
    fontWeight: 'bold',
    color: '#8b6914', // Dark gold text
    marginBottom: 8, // Reduced from 12
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  humanBidding: {
    width: '100%',
  },
  bidAmountContainer: {
    alignItems: 'center',
  },

  bidButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8, // Reduced from 12
  },
  bidButton: {
    backgroundColor: '#4299e1',
    borderRadius: 6, // Reduced from 8
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 10, // Reduced from 16
    margin: 2, // Reduced from 3
    minWidth: 28, // Reduced from 40
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', // Subtle gold accent
  },
  bidButtonText: {
    color: 'white',
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
  },
  passButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 6, // Reduced from 8
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 16, // Reduced from 24
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', // Subtle gold accent
  },
  passButtonText: {
    color: 'white',
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
  },
  suitSelectionContainer: {
    alignItems: 'center',
  },
  suitButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 6, // Reduced from 8
  },
  suitButton: {
    backgroundColor: 'rgba(255, 253, 245, 0.9)', // Gold-tinted background
    borderRadius: 8,
    borderWidth: 2,
    padding: 2,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 50,
    elevation: 3,
  },
  suitSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  suitName: {
    fontSize: 7, // Kept for other potential uses
    color: '#4a5568',
    fontWeight: '600',
  },

  trumpSelection: {
    alignItems: 'center',
    width: '100%',
  },

});

export default Bidding;
