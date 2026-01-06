import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const MenuScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarneeb Game</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Play Game"
          onPress={() => navigation.navigate('Game')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Rules"
          onPress={() => navigation.navigate('Rules')}
        />
      </View>

      {/* Add more navigation options as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Consider using a neutral background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30, // Adjust spacing between the title and buttons
  },
  buttonContainer: {
    marginVertical: 10, // Adds spacing between buttons
    width: '100%', // Ensures buttons stretch to container width
    paddingHorizontal: 50, // Adjusts button width by adding horizontal padding
  },
});

export default MenuScreen;
