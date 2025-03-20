import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Animated } from "react-native";
import { createNews } from "../../services/newsService";
import RichEditor from "../RichEditor";

const AdminScreen = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const slideAnim = useState(new Animated.Value(0))[0];

  const adminOptions = [
    { id: "1", title: "Create News" },
    { id: "2", title: "Update News" },
    { id: "3", title: "Get News" },
    { id: "4", title: "Delete News" },
  ];

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    Animated.timing(slideAnim, {
      toValue: isFormVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleCreateNews = async () => {
    if (!title || !content) {
      Alert.alert("Error", "Title and Content are required!");
      return;
    }

    const response = await createNews(title, content);
    if (response?.status === "success") {
      Alert.alert("Success", "News created successfully!");
      setTitle("");
      setContent("");
      toggleForm();
    } else {
      Alert.alert("Error", "Failed to create news.");
    }
  };

  const renderItem = ({ item }: { item: { id: string; title: string } }) => (
    <TouchableOpacity
      style={styles.button}
      onPress={() => (item.id === "1" ? toggleForm() : alert(`${item.title} clicked!`))}
    >
      <Text style={styles.buttonText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <FlatList data={adminOptions} renderItem={renderItem} keyExtractor={(item) => item.id} />

      {isFormVisible && (
        <Animated.View style={[styles.formContainer, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }] }]}>
          <Text style={styles.formHeader}>Create News</Text>
          <RichEditor content={content} setContent={setContent} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateNews}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={toggleForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f8f8f8" },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  button: { width: "100%", padding: 15, marginVertical: 10, backgroundColor: "#3498db", borderRadius: 10, alignItems: "center" },
  buttonText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  formContainer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  formHeader: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  submitButton: { backgroundColor: "#27ae60", padding: 12, borderRadius: 5, flex: 1, marginRight: 5, alignItems: "center" },
  cancelButton: { backgroundColor: "#e74c3c", padding: 12, borderRadius: 5, flex: 1, marginLeft: 5, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default AdminScreen;
