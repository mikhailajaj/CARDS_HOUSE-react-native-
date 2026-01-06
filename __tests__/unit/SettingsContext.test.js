import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { SettingsProvider, useSettings } from '../../utils/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;

  describe('Initialization', () => {
    it('should load default settings when no stored settings exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.settings.playTimeout).toBe(15);
    });

    it('should load stored settings from AsyncStorage', async () => {
      const storedSettings = JSON.stringify({ playTimeout: 20 });
      AsyncStorage.getItem.mockResolvedValue(storedSettings);

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.settings.playTimeout).toBe(20);
    });

    it('should handle JSON parse errors gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json');

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Should fall back to defaults
      expect(result.current.settings.playTimeout).toBe(15);
    });

    it('should handle AsyncStorage errors', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Should still load with defaults
      expect(result.current.settings.playTimeout).toBe(15);
    });
  });

  describe('updatePlayTimeout', () => {
    it('should update timeout and save to AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      await act(async () => {
        await result.current.updatePlayTimeout(30);
      });

      expect(result.current.settings.playTimeout).toBe(30);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@tarneeb_settings',
        JSON.stringify({ playTimeout: 30 })
      );
    });

    it('should handle save errors gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not crash
      await act(async () => {
        await result.current.updatePlayTimeout(25);
      });

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should validate timeout values', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const validTimeouts = [5, 10, 15, 20, 30];

      for (const timeout of validTimeouts) {
        await act(async () => {
          await result.current.updatePlayTimeout(timeout);
        });
        expect(result.current.settings.playTimeout).toBe(timeout);
      }
    });
  });

  describe('saveSettings', () => {
    it('should save complete settings object', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const newSettings = { playTimeout: 10 };
      await act(async () => {
        await result.current.saveSettings(newSettings);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@tarneeb_settings',
        JSON.stringify(newSettings)
      );
    });

    it('should merge with existing settings', async () => {
      const existingSettings = JSON.stringify({ playTimeout: 15, someOtherSetting: true });
      AsyncStorage.getItem.mockResolvedValue(existingSettings);
      AsyncStorage.setItem.mockResolvedValue();

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      await act(async () => {
        await result.current.saveSettings({ playTimeout: 20 });
      });

      expect(result.current.settings.playTimeout).toBe(20);
      expect(result.current.settings.someOtherSetting).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('should reset to default settings', async () => {
      const storedSettings = JSON.stringify({ playTimeout: 30 });
      AsyncStorage.getItem.mockResolvedValue(storedSettings);
      AsyncStorage.removeItem.mockResolvedValue();

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.settings.playTimeout).toBe(30);

      await act(async () => {
        await result.current.resetSettings();
      });

      expect(result.current.settings.playTimeout).toBe(15);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@tarneeb_settings');
    });

    it('should handle reset errors gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.removeItem.mockRejectedValue(new Error('Remove failed'));

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Should not crash
      await act(async () => {
        await result.current.resetSettings();
      });

      expect(result.current.settings.playTimeout).toBe(15);
    });
  });

  describe('Hook usage', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useSettings());
      }).toThrow('useSettings must be used within a SettingsProvider');

      consoleSpy.mockRestore();
    });
  });
});
