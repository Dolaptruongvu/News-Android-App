import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Alert } from 'react-native';
import { useFontSize } from '../FontSizeContext';
import { useRoute } from '@react-navigation/native';
import { summarizeContent } from '../utils/useGemini'; // Import hàm gọi API Gemini

const Header = ({ navigation, newsContent }: { navigation: any, newsContent?: string }) => {
  const { toggleFontSize } = useFontSize();
  const route = useRoute();

  // Kiểm tra nếu đang ở màn hình NewsDetail
  const isNewsDetail = route.name === 'NewsDetail';

  // Hàm gọi API Gemini khi bấm vào icon Gemini
  const handleSummarize = async () => {
    if (!newsContent) {
      Alert.alert("Error", "No content available to summarize.");
      return;
    }

    try {
      const summary = await summarizeContent(newsContent);
      Alert.alert("Summary", summary);
    } catch (error) {
      Alert.alert("Error", "Failed to summarize content.");
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={toggleFontSize} style={styles.button}>
        <Text style={styles.text}>Aa</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Image source={require('../assets/news-logo.png')} style={styles.logo} />
      </TouchableOpacity>

      {isNewsDetail ? (
        <TouchableOpacity onPress={handleSummarize} style={styles.button}>
          <Image source={require('../assets/gemini.png')} style={styles.icon} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.button}>
          <Image source={require('../assets/user-icon.png')} style={styles.icon} />
        </TouchableOpacity>
      )}
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
