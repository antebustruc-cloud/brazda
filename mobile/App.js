import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BuyStandsScreen from './src/screens/BuyStandsScreen';
import BuyFieldsScreen from './src/screens/BuyFieldsScreen';
import BuyDeliveryScreen from './src/screens/BuyDeliveryScreen';
import MyFieldsScreen from './src/screens/MyFieldsScreen';
import MyStandsScreen from './src/screens/MyStandsScreen';
import MyDeliveryScreen from './src/screens/MyDeliveryScreen';
import OPGSettingsScreen from './src/screens/OPGSettingsScreen';

const Stack = createNativeStackNavigator();
const GREEN = '#2d6a4f';

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: GREEN }, headerTintColor: '#fff' }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Join Ubrano' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: '🌾 Ubrano' }} />
          <Stack.Screen name="BuyStands" component={BuyStandsScreen} options={{ title: 'Find Stands' }} />
          <Stack.Screen name="BuyFields" component={BuyFieldsScreen} options={{ title: 'Find Fields' }} />
          <Stack.Screen name="BuyDelivery" component={BuyDeliveryScreen} options={{ title: 'Find Delivery' }} />
          <Stack.Screen name="MyFields" component={MyFieldsScreen} options={{ title: 'My Fields' }} />
          <Stack.Screen name="MyStands" component={MyStandsScreen} options={{ title: 'My Stands' }} />
          <Stack.Screen name="MyDelivery" component={MyDeliveryScreen} options={{ title: 'My Delivery' }} />
          <Stack.Screen name="OPGSettings" component={OPGSettingsScreen} options={{ title: 'My OPG' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
