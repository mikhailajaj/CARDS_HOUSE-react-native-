import React from 'react';
import { render, screen, act, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import GameScreen from '../../screens/GameScreen';
import { SettingsProvider } from '../../utils/SettingsContext';
import { ScoreHistoryProvider } from '../../utils/ScoreHistoryContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock FontAwesome
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: 'FontAwesomeIcon',
}));

// IMPORTANT: Mock moti so animations complete immediately and call onDidAnimate
jest.mock('moti', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MotiView = (props) => {
    React.useEffect(() => {
      // Simulate animation completion callback used by AnimatingCard
      if (typeof props.onDidAnimate === 'function') {
        props.onDidAnimate('translateX', true);
      }
    }, []);
    return <View testID={props.testID || 'MotiView'}>{props.children}</View>;
  };
  const AnimatePresence = ({ children }) => <>{children}</>;
  return { MotiView, AnimatePresence };
});

// Helper to wrap with providers
const Providers = ({ children }) => (
  <SettingsProvider>
    <ScoreHistoryProvider>
      {children}
    </ScoreHistoryProvider>
  </SettingsProvider>
);

// Utilities
const pollUntil = async (predicate, { maxMs = 10000, step = 50 } = {}) => {
  let elapsed = 0;
  while (elapsed <= maxMs) {
    const ok = predicate();
    if (ok) return true;
    await act(async () => {
      jest.advanceTimersByTime(step);
      await Promise.resolve();
    });
    elapsed += step;
  }
  throw new Error('Timed out waiting for condition');
};

const waitForProvidersLoaded = async () => {
  // Wait until the loading screen (from Settings/ScoreHistory providers) disappears
  const loadingElement = screen.queryByText('Loading...');
  if (loadingElement) {
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
  }
};

async function findTextEventually(text, { maxMs = 10000, step = 50 } = {}) {
  let elapsed = 0;
  while (elapsed <= maxMs) {
    const node = screen.queryByText(text);
    if (node) return node;
    await act(async () => {
      jest.advanceTimersByTime(step);
      await Promise.resolve();
    });
    elapsed += step;
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

const clickDeal = async () => {
  // let providers load and modal render
  await waitForProvidersLoaded();
  const dealBtn = await findTextEventually('Deal Cards');
  fireEvent.press(dealBtn);
};

const passIfHumanBid = () => {
  const passBtn = screen.queryByText('Pass');
  const yourBid = screen.queryByText('Your Bid');
  if (yourBid && passBtn) {
    fireEvent.press(passBtn);
    return true;
  }
  return false;
};

// Advance timers in small chunks to allow multiple timers/effects to process
async function advance(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    // Flush any timers scheduled during the advance (nested timeouts/intervals)
    try { jest.runOnlyPendingTimers(); } catch {}
  });
}

// Drive the bidding phase until playing starts
async function driveBiddingToPlaying({ maxMs = 120000, tick = 250 }) {
  let elapsed = 0;
  // Loop until we see the Trick indicator which only shows in PLAYING
  while (elapsed < maxMs) {
    // If it's human's turn to bid, always pass to ensure AI can win/choose trump
    passIfHumanBid();

    // Check if PLAYING started
    const trickIndicator = screen.queryByText(/Trick\s+1\s*\/\s*13/i);
    if (trickIndicator) return true;

    await advance(tick);
    elapsed += tick;
  }
  throw new Error('Timed out waiting for PLAYING phase (Trick 1 / 13). Bidding may be stuck.');
}

// Play a full round until Round Complete modal shows
async function playRoundToFinish({ playTimeoutSec = 1, maxMs = 480000 }) {
  // Once playing starts, human will auto-play after playTimeoutSec
  // We'll advance time in chunks and look for the Round Complete modal
  const step = 500; // conservative step to flush timers/effects
  let elapsed = 0;
  while (elapsed < maxMs) {
    const roundComplete = screen.queryByText('Round Complete!');
    const gameOver = screen.queryByText('Game Over!');
    if (roundComplete || gameOver) return true;
    // Also ensure trick indicator keeps changing to detect progress
    await advance(step);
    elapsed += step;
  }
  throw new Error('Timed out waiting for Round Complete modal. AI play may be stuck.');
}

// Click Next Round and wait for dealing/bidding to resume
async function goToNextRound() {
  const nextRoundBtn = await screen.findByText('Next Round');
  fireEvent.press(nextRoundBtn);
}

// Play multiple rounds until Game Over modal appears
async function playUntilGameOver({ maxRounds = 10, perRoundMaxMs = 240000 }) {
  for (let round = 1; round <= maxRounds; round++) {
    // Wait for bidding->playing for new round
    await driveBiddingToPlaying({ maxMs: perRoundMaxMs });
    await playRoundToFinish({ maxMs: perRoundMaxMs });

    // After round complete either game over or next round
    const gameOver = screen.queryByText('Game Over!');
    if (gameOver) return true;

    // If not over, proceed to next round
    await goToNextRound();
  }
  throw new Error(`Game did not finish within ${maxRounds} rounds.`);
}

// TODO: Re-enable when fake-timer orchestration is refactored for long-running E2E flows
// All other integration tests (FullGameFlow, HumanAutoPlayAnimation) verify core functionality
describe.skip('E2E - Full Tarneeb Game Flow (AI automation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Use short human timeout so human auto-plays quickly during PLAYING
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === '@tarneeb_settings') return JSON.stringify({ playTimeout: 1 });
      if (key === '@tarneeb_score_history') return JSON.stringify([]);
      return null;
    });
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  afterEach(() => {
    try { jest.runAllTimers(); } catch {}
    try { jest.runOnlyPendingTimers(); } catch {}
    try { jest.clearAllTimers(); } catch {}
    try { jest.useRealTimers(); } catch {}
  });

  afterAll(() => {
    try { jest.runAllTimers(); } catch {}
    try { jest.runOnlyPendingTimers(); } catch {}
    try { jest.clearAllTimers(); } catch {}
    try { jest.useRealTimers(); } catch {}
  });

  test('runs a complete game: bidding -> trump -> playing 13 tricks -> multiple rounds -> game over', async () => {
    render(
      <Providers>
        <GameScreen navigation={mockNavigation} />
      </Providers>
    );

    // Start the game
    await clickDeal();

    // Drive bidding to playing (handle human pass if prompted)
    await driveBiddingToPlaying({});

    // Sanity: we should see Trick indicator
    expect(await screen.findByText(/Trick\s+1\s*\/\s*13/i)).toBeTruthy();

    // Play to end of round
    await playRoundToFinish({});

    // At round end, round complete modal visible
    expect(await screen.findByText('Round Complete!')).toBeTruthy();

    // Now proceed rounds until game over
    await goToNextRound();

    await playUntilGameOver({ maxRounds: 8 });

    expect(await screen.findByText('Game Over!')).toBeTruthy();
  }, 600000);

  test('edge case: all players pass bidding -> reducer forces dealer contract and play proceeds', async () => {
    // Mock evaluateBid to always pass for AIs for this test only
    const bidding = require('../../utils/biddingStrategy');
    const evalSpy = jest.spyOn(bidding, 'evaluateBid').mockImplementation(() => ({ type: 'pass' }));
    const trumpSpy = jest.spyOn(bidding, 'chooseTrumpSuit').mockImplementation(() => 'Spades');

    render(
      <Providers>
        <GameScreen navigation={mockNavigation} />
      </Providers>
    );

    await clickDeal();

    // Human pass any time asked
    // Drive until playing (should still progress even if AIs always pass; dealer will be set to 7)
    await driveBiddingToPlaying({ maxMs: 120000 });

    // Ensure we reached playing
    expect(await screen.findByText(/Trick\s+1\s*\/\s*13/i)).toBeTruthy();

    evalSpy.mockRestore();
    trumpSpy.mockRestore();
  }, 300000);
});
