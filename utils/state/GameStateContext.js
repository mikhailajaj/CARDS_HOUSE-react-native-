import React, { createContext, useContext, useReducer } from 'react';
import { gameReducer, initialGameState } from './GameReducer';

const GameStateContext = createContext();

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
};

export default GameStateContext;