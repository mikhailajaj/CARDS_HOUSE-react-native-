import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native'; 
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import RulesScreen from './screens/RulesScreen';
import SettingsScreen from './screens/SettingsScreen';
import { SettingsProvider } from './utils/SettingsContext';
import { ScoreHistoryProvider } from './utils/ScoreHistoryContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SettingsProvider>
      <ScoreHistoryProvider>
        <NavigationContainer>
          <StatusBar style="light" hidden={false} />
          <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="Game" 
            component={GameScreen} 
            options={{ 
              headerShown: false,
              gestureEnabled: false // Prevents swipe back gesture
            }}
          />
          <Stack.Screen 
            name="Rules" 
            component={RulesScreen}
            options={{ 
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </ScoreHistoryProvider>
    </SettingsProvider>
  );
}
