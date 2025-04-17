import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useFontSize } from '../FontSizeContext';
import { useRoute } from '@react-navigation/native';
import { summarizeContent } from '../utils/useGemini'; // Import hàm gọi API Gemini

const Header = ({ navigation, newsContent }: { navigation: any, newsContent?: string }) => {
  const { toggleFontSize } = useFontSize();
  const route = useRoute();
  const isNewsDetail = route.name === 'NewsDetail';

  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoadingAsk, setIsLoadingAsk] = useState(false);

  const handleSummarize = async () => {
    if (!newsContent) {
      Alert.alert("Error", "No content available to summarize.");
      return;
    }
    try {
      // Consider adding loading state for summarize as well
      const summary = await summarizeContent(newsContent);
      Alert.alert("Summary", summary);
    } catch (error) {
      Alert.alert("Error", "Failed to summarize content.");
      console.error("Summarize Error:", error);
    }
  };

  const handleAskToggle = () => {
    setIsAsking(!isAsking);
    setQuestion(''); // Clear question when toggling
  };

  const handleAskSubmit = async () => {
    if (!question.trim()) {
      Alert.alert("Input Required", "Please enter a question.");
      return;
    }

    setIsLoadingAsk(true);
    try {
      // Replace with your actual API endpoint if different
      const response = await fetch('http://10.0.2.2:5000/api/v1/news/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        Alert.alert("Answer", data.answer || "No answer provided.");
        setIsAsking(false); // Hide input after successful submission
        setQuestion('');   // Clear question
      } else {
        Alert.alert("Error", data.message || "Failed to get answer from API.");
      }
    } catch (error) {
      console.error("Ask API Error:", error);
      Alert.alert("Error", "An error occurred while asking the question. Make sure the server is running.");
    } finally {
      setIsLoadingAsk(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Left Buttons */}
        <View style={styles.leftButtons}>
          <TouchableOpacity onPress={toggleFontSize} style={styles.button}>
            <Text style={styles.text}>Aa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAskToggle} style={[styles.button, styles.askButton]}>
            <Text style={styles.text}>Ask</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require('../assets/news-logo.png')} style={styles.logo} />
        </TouchableOpacity>

        {/* Right Icon */}
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

      {/* Ask Input Area - Conditionally Rendered */}
      {isAsking && (
        <View style={styles.askContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            value={question}
            onChangeText={setQuestion}
            editable={!isLoadingAsk} // Disable input while loading
          />
          <TouchableOpacity
            onPress={handleAskSubmit}
            style={[styles.submitButton, isLoadingAsk && styles.submitButtonDisabled]}
            disabled={isLoadingAsk}
          >
            <Text style={styles.submitButtonText}>
              {isLoadingAsk ? 'Asking...' : 'Submit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAskToggle} style={styles.cancelButton}>
             <Text style={styles.cancelButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    paddingBottom: 5, // Add padding if ask container shows below
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5, // Reduced vertical padding a bit
    backgroundColor: '#f8f8f8',
    minHeight: 55, // Ensure header has a minimum height
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 8, // Adjusted padding
  },
  askButton: {
    marginLeft: 5, // Space between Aa and Ask
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 90, // Slightly smaller logo
    height: 35,
    resizeMode: 'contain',
  },
  icon: {
    width: 28, // Slightly smaller icons
    height: 28,
  },
  // Styles for Ask Input Area
  askContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e9e9e9', // Slightly different background
    marginTop: 5, // Space between header row and input
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8, // Adjusted padding
    backgroundColor: '#fff',
    marginRight: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 9, // Adjusted padding
    borderRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0cfff', // Lighter blue when disabled
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    marginLeft: 8,
    padding: 5,
  },
  cancelButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#555',
  }
});

export default Header;