import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useFontSize } from '../FontSizeContext';

const Header = ({ navigation }: { navigation: any }) => {
  const { toggleFontSize } = useFontSize();

  return (
    <View style={styles.header}>
      {/* Button to toggle font size */}
      <TouchableOpacity onPress={toggleFontSize} style={styles.button}>
        <Text style={styles.text}>Aa</Text>
      </TouchableOpacity>

      {/* Logo in the center */}
      <Image source={require('../assets/news-logo.png')} style={styles.logo} />

      {/* Navigate to Login screen when user icon is clicked */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.button}>
        <Image source={require('../assets/user-icon.png')} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  button: {
    padding: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default Header;
