import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';

const GREEN = '#2d6a4f';

const ROLES = [
  { key: 'buyer', label: 'Buyer', is_buyer: true, is_seller: false },
  { key: 'both', label: 'Producer / Seller', is_buyer: true, is_seller: true },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer');
  const [opgName, setOpgName] = useState('');
  const [mibpg, setMibpg] = useState('');
  const [pin, setPin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedRole = ROLES.find(r => r.key === role);
  const isSeller = selectedRole.is_seller;

  const handleRegister = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    const payload = {
      email, password, phone,
      is_buyer: selectedRole.is_buyer,
      is_seller: selectedRole.is_seller,
    };
    if (isSeller) {
      if (!phone) {
        setError('As a farmer you must enter a phone number so buyers can contact you.');
        return;
      }
      if (!opgName || !mibpg || !pin) {
        setError('As a farmer you must enter OPG name, MIBPG, and drop your OPG pin on the map.');
        return;
      }
      payload.opg_name = opgName;
      payload.mibpg = mibpg;
      payload.opg_lat = pin.latitude;
      payload.opg_lng = pin.longitude;
    }
    setBusy(true);
    try {
      await register(payload);
      setSuccess('Account created! You can log in now.');
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch (err) {
      setError('Registration failed. ' + JSON.stringify(err.response?.data || ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Join Ubrano</Text>
      <Text style={styles.subtitle}>Fresh from local farmers</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <TextInput style={styles.input} placeholder="you@example.com" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Choose a password" secureTextEntry
        value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="091 234 5678 or +385 91 234 5678"
        keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <Text style={styles.label}>I am here as:</Text>
      {ROLES.map(r => (
        <TouchableOpacity key={r.key} style={styles.radioRow} onPress={() => setRole(r.key)}>
          <View style={[styles.radioOuter, role === r.key && styles.radioOuterActive]}>
            {role === r.key && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>{r.label}</Text>
        </TouchableOpacity>
      ))}

      {isSeller && (
        <View style={styles.opgCard}>
          <Text style={styles.opgTitle}>Your OPG details</Text>
          <TextInput style={styles.input} placeholder="OPG name (e.g. OPG Marić)"
            value={opgName} onChangeText={setOpgName} />
          <TextInput style={styles.input} placeholder="MIBPG (your farm's unique number)"
            value={mibpg} onChangeText={setMibpg} />
          <Text style={styles.hint}>📍 Tap the map to set your OPG location (private):</Text>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 45.1, longitude: 16.5, latitudeDelta: 4, longitudeDelta: 4 }}
            onPress={(e) => setPin(e.nativeEvent.coordinate)}
          >
            {pin && <Marker coordinate={pin} />}
          </MapView>
          {pin && (
            <Text style={styles.pinSet}>
              Pin set: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Log in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  logo: { width: 64, height: 64, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: GREEN, textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#777', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: GREEN },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  radioLabel: { fontSize: 15 },
  opgCard: { borderWidth: 1, borderColor: GREEN, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 12 },
  opgTitle: { fontWeight: 'bold', marginBottom: 8 },
  hint: { fontSize: 13, color: '#555', marginBottom: 8 },
  map: { height: 220, borderRadius: 8 },
  pinSet: { fontSize: 12, color: '#777', marginTop: 6 },
  button: { backgroundColor: GREEN, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#c0392b', marginBottom: 12, textAlign: 'center' },
  success: { color: '#2d6a4f', marginBottom: 12, textAlign: 'center' },
  linkWrap: { marginTop: 16, marginBottom: 24, alignItems: 'center' },
  linkText: { color: '#777' },
  link: { color: GREEN, fontWeight: 'bold' },
});
