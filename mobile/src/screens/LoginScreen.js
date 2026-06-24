import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const GREEN = '#2d6a4f';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>🌾 Ubrano</Text>
      <Text style={styles.subtitle}>Fresh from local farmers</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Register</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: GREEN, textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#777', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: GREEN, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#c0392b', marginBottom: 12, textAlign: 'center' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#777' },
  link: { color: GREEN, fontWeight: 'bold' },
});
