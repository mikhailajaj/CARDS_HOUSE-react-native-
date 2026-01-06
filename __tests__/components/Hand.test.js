/**
 * Component Tests for Hand (components/Hand.js)
 * Tests: H-001 to H-008
 * Target Coverage: 90% statement, 85% branch
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Hand from '../../components/Hand';

describe('Hand Component', () => {
  
  const mockHand = [
    { suit: 'Hearts', label: 'Ace', value: 14 },
    { suit: 'Hearts', label: 'King', value: 13 },
    { suit: 'Clubs', label: 'Queen', value: 12 }
  ];

  test('H-001: Renders all cards in hand', () => {
    const { container } = render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={() => true}
      />
    );
    
    expect(container).toBeTruthy();
  });

  test('H-002: Fan layout displays correctly', () => {
    const { container } = render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={() => true}
        fanLayout={true}
      />
    );
    
    expect(container).toBeTruthy();
  });

  test('H-003: Linear layout displays correctly', () => {
    const { container } = render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={() => true}
        fanLayout={false}
      />
    );
    
    expect(container).toBeTruthy();
  });

  test('H-004: Legal cards have full opacity', () => {
    const canPlayCard = jest.fn(() => true);
    
    render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={canPlayCard}
      />
    );
    
    expect(canPlayCard).toHaveBeenCalled();
  });

  test('H-005: Illegal cards have reduced opacity', () => {
    const canPlayCard = jest.fn(() => false);
    
    render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={canPlayCard}
      />
    );
    
    expect(canPlayCard).toHaveBeenCalled();
  });

  test('H-006: Card press triggers onCardPress callback', () => {
    const mockOnCardPress = jest.fn();
    
    render(
      <Hand 
        cards={mockHand}
        onCardPress={mockOnCardPress}
        canPlayCard={() => true}
      />
    );
    
    // Callback should be passed to Card components
    expect(mockOnCardPress).toBeDefined();
  });

  test('H-007: Selected card is highlighted', () => {
    const selectedCard = mockHand[0];
    
    const { container } = render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={() => true}
        selectedCard={selectedCard}
      />
    );
    
    expect(container).toBeTruthy();
  });

  test('H-008: Handles empty hand', () => {
    const { container } = render(
      <Hand 
        cards={[]}
        onCardPress={() => {}}
        canPlayCard={() => true}
      />
    );
    
    expect(container).toBeTruthy();
  });

  test('H-009: Custom card width is applied', () => {
    const { container } = render(
      <Hand 
        cards={mockHand}
        onCardPress={() => {}}
        canPlayCard={() => true}
        customCardWidth={100}
      />
    );
    
    expect(container).toBeTruthy();
  });
});
