import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const GREEN = '#2d6a4f';

function BigButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.bigButton} onPress={onPress}>
      <Text style={styles.bigButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { isSeller, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Ubrano 🌾</Text>
      <Text style={styles.subtitle}>Fresh produce, direct from local farmers.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧺 I want to buy</Text>
        <Text style={styles.cardDesc}>Find fresh produce near you.</Text>
        <BigButton label="Find Fields" onPress={() => navigation.navigate('BuyFields')} />
        <BigButton label="Find Stands" onPress={() => navigation.navigate('BuyStands')} />
        <BigButton label="Find Delivery" onPress={() => navigation.navigate('BuyDelivery')} />
      </View>

      {isSeller && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚜 I want to sell</Text>
          <Text style={styles.cardDesc}>
            Managing fields, stands, and delivery events from the phone is coming soon -
            for now, use ubrano.com.hr on the web for your seller tools.
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: GREEN, textAlign: 'center', marginTop: 12 },
  subtitle: { textAlign: 'center', color: '#777', marginBottom: 24 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: GREEN, marginBottom: 6 },
  cardDesc: { color: '#666', marginBottom: 12 },
  bigButton: { backgroundColor: GREEN, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  bigButtonText: { color: '#fff', fontWeight: 'bold' },
  logout: { alignItems: 'center', marginTop: 12, marginBottom: 30 },
  logoutText: { color: '#c0392b', fontWeight: '600' },
});
