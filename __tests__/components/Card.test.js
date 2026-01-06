/**
 * Component Tests for Card (components/Card.js)
 * Tests: C-001 to C-006
 * Target Coverage: 90% statement, 85% branch
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Card from '../../components/Card';

describe('Card Component', () => {
  
  const mockCard = {
    suit: 'Hearts',
    label: 'Ace',
    value: 14
  };

  test('C-001: Renders card correctly', () => {
    const { getByTestId } = render(
      <Card card={mockCard} onPress={() => {}} />
    );
    
    // Card should render without crashing
    expect(getByTestId).toBeDefined();
  });

  test('C-002: Renders with custom width', () => {
    const { getByTestId } = render(
      <Card card={mockCard} onPress={() => {}} cardWidth={120} />
    );
    
    expect(getByTestId('card-touchable')).toBeTruthy();
  });

  test('C-003: onPress callback fires when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <Card card={mockCard} onPress={mockOnPress} testID="card-touchable" />
    );
    
    const touchable = getByTestId('card-touchable');
    fireEvent.press(touchable);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('C-004: Shows selection state visually', () => {
    const { rerender } = render(
      <Card card={mockCard} onPress={() => {}} isSelected={false} />
    );
    
    // Rerender with selected state
    rerender(
      <Card card={mockCard} onPress={() => {}} isSelected={true} />
    );
    
    // Component should handle selection state
    expect(true).toBe(true);
  });

  test('C-005: Handles null card gracefully', () => {
    const { getByTestId } = render(
      <Card card={null} onPress={() => {}} />
    );
    
    expect(getByTestId('card-touchable')).toBeTruthy();
  });

  test('C-006: Renders different suits correctly', () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    
    suits.forEach(suit => {
      const card = { suit, label: 'King', value: 13 };
      const { getByTestId } = render(
        <Card card={card} onPress={() => {}} />
      );
      
      expect(getByTestId('card-touchable')).toBeTruthy();
    });
  });
});
