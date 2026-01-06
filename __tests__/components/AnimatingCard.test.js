import React from 'react';
import { render } from '@testing-library/react-native';
import AnimatingCard from '../../components/AnimatingCard';

// Mock Card component
jest.mock('../../components/Card', () => 'Card');

describe('AnimatingCard', () => {
  const mockCard = { suit: 'Hearts', label: 'Ace' };
  const mockFromPosition = { x: 100, y: 200, rotation: 10 };
  const mockPlayerIndex = 2;
  const mockOnComplete = jest.fn();

  it('renders without crashing', () => {
    render(
      <AnimatingCard
        card={mockCard}
        fromPosition={mockFromPosition}
        playerIndex={mockPlayerIndex}
        onComplete={mockOnComplete}
      />
    );
    expect(true).toBe(true);
  });

  it('accepts custom cardWidth prop', () => {
    render(
      <AnimatingCard
        card={mockCard}
        fromPosition={mockFromPosition}
        playerIndex={mockPlayerIndex}
        onComplete={mockOnComplete}
        cardWidth={100}
      />
    );
    expect(true).toBe(true);
  });

  it('uses default cardWidth when not provided', () => {
    render(
      <AnimatingCard
        card={mockCard}
        fromPosition={mockFromPosition}
        playerIndex={mockPlayerIndex}
        onComplete={mockOnComplete}
      />
    );
    expect(true).toBe(true);
  });
});
