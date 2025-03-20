// src/Footer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Footer = () => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>© 2025 News App. All Rights Reserved.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  footerText: {
    fontSize: 14,
    color: '#555',
  },
});

export default Footer;
