import { Button, View, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tarneeb</Text>
      <Button title="Play Game" onPress={() => navigation.navigate('Game')} />
      <Button title="View Rules" onPress={() => navigation.navigate('Rules')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
