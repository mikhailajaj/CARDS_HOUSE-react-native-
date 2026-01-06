import React from 'react';
import { render } from '@testing-library/react-native';
import AnimatingCardsOverlay from '../../components/AnimatingCardsOverlay';

// Mock AnimatingCard component
jest.mock('../../components/AnimatingCard', () => 'AnimatingCard');

describe('AnimatingCardsOverlay', () => {
  it('renders without crashing with empty array', () => {
    render(
      <AnimatingCardsOverlay animatingCards={[]} onAnimationComplete={jest.fn()} />
    );
    expect(true).toBe(true);
  });

  it('renders with animating cards', () => {
    const mockAnimatingCards = [
      {
        id: 'anim-1',
        card: { suit: 'Hearts', label: 'Ace' },
        fromPosition: { x: 100, y: 200, rotation: 0 },
        playerIndex: 2,
        cardWidth: 80,
      },
    ];

    render(
      <AnimatingCardsOverlay
        animatingCards={mockAnimatingCards}
        onAnimationComplete={jest.fn()}
      />
    );
    expect(true).toBe(true);
  });

  it('handles multiple animating cards', () => {
    const mockAnimatingCards = [
      {
        id: 'anim-1',
        card: { suit: 'Hearts', label: 'Ace' },
        fromPosition: { x: 100, y: 200, rotation: 0 },
        playerIndex: 0,
        cardWidth: 80,
      },
      {
        id: 'anim-2',
        card: { suit: 'Spades', label: 'King' },
        fromPosition: { x: 150, y: 250, rotation: 5 },
        playerIndex: 1,
        cardWidth: 80,
      },
    ];

    render(
      <AnimatingCardsOverlay
        animatingCards={mockAnimatingCards}
        onAnimationComplete={jest.fn()}
      />
    );
    expect(true).toBe(true);
  });
});
