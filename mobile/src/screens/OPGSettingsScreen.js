import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../context/AuthContext';

const GREEN = '#2d6a4f';

export default function OPGSettingsScreen() {
  const [opg, setOpg] = useState(null);
  const [iban, setIban] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/opg/')
      .then(res => {
        setOpg(res.data);
        setIban(res.data.iban || '');
      })
      .catch(err => console.log('Load error', err.response?.data))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setMessage('');
    setError('');
    try {
      const res = await api.patch('/opg/', { iban });
      setOpg(res.data);
      setIban(res.data.iban || '');
      setMessage('Saved ✅');
    } catch (err) {
      setError(err.response?.data?.iban?.[0] || 'Could not save IBAN.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  if (!opg) {
    return (
      <View style={styles.center}>
        <Text>Could not load OPG.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My OPG</Text>
      <Text style={styles.subtitle}>{opg.name} · MIBPG {opg.mibpg}</Text>

      <Text style={styles.label}>IBAN (for receiving payments)</Text>
      <TextInput
        style={styles.input}
        placeholder="HR1210010051863000160"
        autoCapitalize="characters"
        value={iban}
        onChangeText={(v) => setIban(v.toUpperCase())}
      />
      <Text style={styles.help}>Used to generate your payment barcode. Never shown to buyers directly.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: GREEN, marginBottom: 4 },
  subtitle: { color: '#777', marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 6 },
  help: { fontSize: 12, color: '#999', marginBottom: 16 },
  error: { color: '#c0392b', marginBottom: 10 },
  success: { color: GREEN, marginBottom: 10 },
  button: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
