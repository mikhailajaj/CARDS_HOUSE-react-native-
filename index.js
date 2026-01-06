import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import App from './App';

// Register the root component so it works with Expo and (later) bare apps if you switch entry
registerRootComponent(App);
