/**
 * Component Tests for HomeScreen (screens/HomeScreen.js)
 * Tests: HS-001 to HS-005
 * Target Coverage: 95% statement, 90% branch
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn()
};

describe('HomeScreen Component', () => {
  
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
  });

  test('HS-001: Renders title correctly', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByText('TARNEEB')).toBeTruthy();
  });

  test('HS-002: Play Game button navigates to Game screen', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    const playButton = getByText('Play Game');
    fireEvent.press(playButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Game');
  });

  test('HS-003: View Rules button navigates to Rules screen', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    const rulesButton = getByText('View Rules');
    fireEvent.press(rulesButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Rules');
  });

  test('HS-004: Displays subtitle text', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Classic Card Game')).toBeTruthy();
  });

  test('HS-005: Card symbols display correctly', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByText('♠')).toBeTruthy();
    expect(getByText('♥')).toBeTruthy();
    expect(getByText('♦')).toBeTruthy();
    expect(getByText('♣')).toBeTruthy();
  });

  test('HS-006: Footer text is displayed', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Tap to begin your journey')).toBeTruthy();
  });
});
