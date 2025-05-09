import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/HomeScreen';
import LoginForm from './src/components/LoginForm';
import NewsDetailScreen from './src/components/Screen/NewsDetailScreen';
import { FontSizeProvider } from './src/FontSizeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

const Stack = createStackNavigator();

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <FontSizeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginForm} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </FontSizeProvider>
    </SafeAreaProvider>
  );
};

export default App;