import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFontSize } from '../FontSizeContext';
import { useRoute } from '@react-navigation/native';
import { summarizeContent } from '../utils/useGemini';
import Tts from 'react-native-tts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  navigation: any;
  newsContent?: string;
}

const Header: React.FC<HeaderProps> = ({ navigation, newsContent }) => {
  const { toggleFontSize } = useFontSize();
  const route = useRoute();
  const isNewsDetail = route.name === 'NewsDetail';
  const insets = useSafeAreaInsets();

  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoadingAsk, setIsLoadingAsk] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);

  useEffect(() => {
    const initializeTts = async () => {
      if (Tts && typeof Tts.setDefaultLanguage === 'function') {
        try {
          await Tts.setDefaultLanguage('en-US');
          setIsTtsInitialized(true);
          console.log("Text-to-Speech (TTS) initialized successfully.");
        } catch (err: any) {
          console.error("TTS initialization error:", err.message || err);
          setIsTtsInitialized(false);
        }
      } else {
        console.warn("react-native-tts module or setDefaultLanguage is not available. TTS will be disabled.");
        setIsTtsInitialized(false);
      }
    };
    initializeTts();
    return () => {
      if (Tts && typeof Tts.stop === 'function') {
        Tts.stop();
      }
    };
  }, []);

  const speakText = (textToSpeak: string) => {
    if (!isTtsInitialized || !Tts || typeof Tts.speak !== 'function') {
      Alert.alert("TTS Not Ready", "Text-to-speech service is not available at the moment.");
      console.warn("Attempted to speak, but TTS is not initialized or Tts.speak is not a function.");
      return;
    }
    Tts.stop();
    Tts.speak(textToSpeak);
  };

  const handleSummarize = async () => {
    if (!newsContent || newsContent.trim() === "") {
      Alert.alert("No Content", "There is no content available to summarize.");
      return;
    }
    setIsSummarizing(true);
    try {
      const summaryText = await summarizeContent(newsContent);
      if (summaryText.toLowerCase().startsWith("error:") ||
          summaryText.toLowerCase().includes("unable to connect") ||
          summaryText.toLowerCase().includes("failed")) {
        Alert.alert("Summarization Error", summaryText);
      } else if (summaryText.toLowerCase().includes("no summary available") ||
                 summaryText.toLowerCase().includes("could not generate a summary") ||
                 summaryText.toLowerCase().includes("content was empty")) {
        Alert.alert("Summary", summaryText);
      } else {
        Alert.alert(
          "Summary Ready",
          "The summary is ready. Would you like to listen to it?",
          [
            {
              text: "No, Show Text",
              onPress: () => Alert.alert("Summary", summaryText),
              style: "default"
            },
            {
              text: "Yes, Listen",
              onPress: () => {
                if (isTtsInitialized) {
                  speakText(summaryText);
                } else {
                  Alert.alert("TTS Not Ready", "Text-to-speech is currently unavailable. Displaying summary as text instead.", [
                    { text: "OK", onPress: () => Alert.alert("Summary", summaryText) }
                  ]);
                }
              }
            }
          ],
          { cancelable: true }
        );
      }
    } catch (error: any) {
      console.error("Error during summarization process in Header.tsx:", error);
      Alert.alert("Summarization Failed", error?.message || "An unexpected error occurred while trying to summarize.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskToggle = () => {
    setIsAsking(!isAsking);
    if (isAsking) setQuestion('');
  };

  const handleAskSubmit = async () => {
    if (!question.trim()) {
      Alert.alert("Input Required", "Please type a question before submitting.");
      return;
    }
    setIsLoadingAsk(true);
    try {
      const response = await fetch('http://10.0.2.2:5000/api/v1/news/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success' && data.answer) {
        Alert.alert(
          "Answer Received",
          `${data.answer}\n\nWould you like to listen to this answer?`,
          [
            { text: "No", style: "cancel" },
            { text: "Yes, Listen", onPress: () => {
                if (isTtsInitialized) {
                    speakText(data.answer);
                } else {
                    Alert.alert("TTS Not Ready", "Text-to-speech is currently unavailable.");
                }
            }}
          ]
        );
      } else {
        Alert.alert("API Error", data.message || "Failed to get an answer from the API.");
      }
    } catch (error: any) {
      console.error("Error submitting question to API:", error);
      Alert.alert("Connection Error", "An error occurred while asking the question. Please check your connection and ensure the server is running.");
    } finally {
      setIsLoadingAsk(false);
      setQuestion('');
      setIsAsking(false);
    }
  };

  return (
    <View style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0, backgroundColor: styles.baseContainer.backgroundColor }}>
      <View style={styles.baseContainer}>
        <View style={styles.headerRow}>
          <View style={styles.leftButtonsContainer}>
            <TouchableOpacity
              onPress={toggleFontSize}
              style={styles.button}
              disabled={isSummarizing || isLoadingAsk}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.text}>Aa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAskToggle}
              style={[styles.button, styles.askButton]}
              disabled={isSummarizing || isLoadingAsk}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.text}>Ask</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} disabled={isSummarizing || isLoadingAsk}>
              <Image source={require('../assets/news-logo.png')} style={styles.logo} />
            </TouchableOpacity>
          </View>

          <View style={styles.rightButtonContainer}>
            {isNewsDetail ? (
              isSummarizing ? (
                <ActivityIndicator size="small" color="#007bff" style={styles.button} />
              ) : (
                <TouchableOpacity
                  onPress={handleSummarize}
                  style={styles.button}
                  disabled={isSummarizing || isLoadingAsk}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image source={require('../assets/gemini.png')} style={styles.icon} />
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.button}
                disabled={isSummarizing || isLoadingAsk}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image source={require('../assets/user-icon.png')} style={styles.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isAsking && (
          <View style={styles.askContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question about the news..."
              value={question}
              onChangeText={setQuestion}
              editable={!isLoadingAsk}
              onSubmitEditing={handleAskSubmit}
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
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    backgroundColor: '#f8f8f8',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 55,
  },
  leftButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askButton: {
    marginLeft: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  icon: {
    width: 26,
    height: 26,
  },
  askContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eef1f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginRight: 10,
    fontSize: 15,
    color: '#495057',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 6,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0cfff',
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    marginLeft: 10,
    padding: 6,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
  }
});

export default Header;