import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Header from './Home/Header';
import Body from './Home/Body';
import Footer from './Home/Footer';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content}>
        <Body />
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 10,
  },
});

export default HomeScreen;
