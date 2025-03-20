import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFontSize } from '../FontSizeContext';

const API_URL = 'http://10.0.2.2:5000/api/v1/news';

const Body = () => {
  const { fontSize } = useFontSize();
  const navigation = useNavigation();
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const loadNews = async () => {
    if (loading || page > totalPages) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?page=${page}&limit=5`);
      const json = await res.json();
      if (json.status === "success") {
        setNews(prev => [...prev, ...json.data]);
        setTotalPages(json.totalPages || 1);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("NewsDetail", { newsId: item._id })}>
      <View style={styles.newsContainer}>
        <Image source={{ uri: item.urlToImage }} style={styles.image} />
        <Text style={[styles.title, { fontSize }]}>{item.title}</Text>
        <Text style={[styles.description, { fontSize }]}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={news}
      keyExtractor={item => item._id}
      renderItem={renderNewsItem}
      onEndReached={loadNews}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading && <ActivityIndicator size="large" color="#0000ff" />}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  newsContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  title: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 5,
    color: '#555',
  },
});

export default Body;
