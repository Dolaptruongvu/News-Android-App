import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import Header from '../../Home/Header';
import { useFontSize } from '../../FontSizeContext';

const API_URL = 'http://10.0.2.2:5000/api/v1/news';

const NewsDetailScreen = ({ route, navigation }) => {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fontSize } = useFontSize();

  useEffect(() => {
    fetchNewsDetail();
  }, []);

  const fetchNewsDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/${newsId}`);
      const data = await response.json();
      if (data.status === "success") {
        setNews(data.data);
      }
    } catch (error) {
      console.error("Error fetching news details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!news) {
    return <Text style={styles.errorText}>News article not found.</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Truyền nội dung của bài báo vào Header */}
      <Header navigation={navigation} newsContent={news.content} />

      <ScrollView style={styles.scrollContainer}>
        <Image source={{ uri: news.urlToImage }} style={styles.image} />
        <Text style={[styles.title, { fontSize }]}>{news.title}</Text>
        <Text style={[styles.content, { fontSize }]}>{news.content}</Text>
        <Text style={styles.author}>Author: {news.author || "Unknown"}</Text>
        <Text style={styles.date}>Published on: {new Date(news.publishedAt).toLocaleString()}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 15,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  content: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  author: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#555',
  },
  date: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
    marginTop: 20,
  },
});

export default NewsDetailScreen;
