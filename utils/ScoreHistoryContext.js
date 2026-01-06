import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScoreHistoryContext = createContext();

const SCORE_HISTORY_STORAGE_KEY = '@tarneeb_score_history';

export const ScoreHistoryProvider = ({ children }) => {
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load score history from AsyncStorage on mount
  useEffect(() => {
    loadScoreHistory();
  }, []);

  const loadScoreHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(SCORE_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setScoreHistory(parsed);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading score history:', error);
      setIsLoaded(true);
    }
  };

  // Add a new score entry to history
  const addScoreEntry = useCallback(async (entry) => {
    try {
      const updatedHistory = [...scoreHistory, entry];
      await AsyncStorage.setItem(SCORE_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      setScoreHistory(updatedHistory);
      return updatedHistory;
    } catch (error) {
      console.error('Error saving score entry:', error);
      return scoreHistory;
    }
  }, [scoreHistory]);

  // Clear all score history
  const clearScoreHistory = async () => {
    try {
      await AsyncStorage.removeItem(SCORE_HISTORY_STORAGE_KEY);
      setScoreHistory([]);
    } catch (error) {
      console.error('Error clearing score history:', error);
    }
  };

  // Get score history for current game session (optional filtering)
  const getCurrentGameHistory = useCallback((gameStartRound = 1) => {
    // Filter history to get only entries from current game session
    // You can enhance this by adding a gameId or timestamp to entries
    return scoreHistory.filter(entry => entry.round >= gameStartRound);
  }, [scoreHistory]);

  // Get statistics
  const getStatistics = useCallback(() => {
    if (scoreHistory.length === 0) {
      return {
        totalRounds: 0,
        team1Wins: 0,
        team2Wins: 0,
        contractsMade: 0,
        contractsFailed: 0,
      };
    }

    const stats = scoreHistory.reduce((acc, entry) => {
      // Count contracts made/failed
      if (entry.contractMade) {
        acc.contractsMade++;
      } else {
        acc.contractsFailed++;
      }

      // Track which team is ahead after each round
      if (entry.team1Total > entry.team2Total) {
        acc.team1Ahead++;
      } else if (entry.team2Total > entry.team1Total) {
        acc.team2Ahead++;
      }

      return acc;
    }, {
      totalRounds: scoreHistory.length,
      contractsMade: 0,
      contractsFailed: 0,
      team1Ahead: 0,
      team2Ahead: 0,
    });

    return stats;
  }, [scoreHistory]);

  return (
    <ScoreHistoryContext.Provider
      value={{
        scoreHistory,
        isLoaded,
        addScoreEntry,
        clearScoreHistory,
        getCurrentGameHistory,
        getStatistics,
        loadScoreHistory,
      }}
    >
      {children}
    </ScoreHistoryContext.Provider>
  );
};

export const useScoreHistory = () => {
  const context = useContext(ScoreHistoryContext);
  if (!context) {
    throw new Error('useScoreHistory must be used within a ScoreHistoryProvider');
  }
  return context;
};

export default ScoreHistoryContext;
