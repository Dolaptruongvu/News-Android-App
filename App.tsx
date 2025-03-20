import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/HomeScreen';
import LoginScreen from './src/components/LoginForm'; // Import Login Form
import { FontSizeProvider } from './src/FontSizeContext';
const Stack = createStackNavigator();

const App = (): React.JSX.Element => {
  return (
   <FontSizeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </FontSizeProvider> 
  );
};

export default App;
