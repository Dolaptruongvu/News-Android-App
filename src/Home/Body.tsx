import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFontSize } from '../FontSizeContext'; // Import font size context

const Body = () => {
  const { fontSize } = useFontSize(); // Lấy font size từ context

  return (
    <View style={styles.bodyContainer}>
      <Text style={[styles.text, { fontSize }]}>This is sample content from the backend.</Text>
      <Text style={[styles.text, { fontSize }]}>Later, this will be replaced with API data.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bodyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginBottom: 10,
  },
});

export default Body;
