import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '../context/AuthContext';

const GREEN = '#2d6a4f';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
export default function NotifyNearby({ channelType, channelId }) {
  const [radiusKm, setRadiusKm] = useState('3');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');

  const send = async () => {
    setError('');
    try {
      const res = await api.post('/notifications/send/', {
        channel_type: channelType,
        channel_id: channelId,
        radius_km: radiusKm,
        message,
      });
      setSent(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send notification.');
    }
  };

  const reset = () => {
    setSent(null);
    setError('');
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notify Nearby Buyers 📢</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {sent ? (
        <>
          <Text style={styles.success}>
            Sent ✅ Buyers within {sent.radius_km}km will see this for the next 24h.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryButtonText}>Send another</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.radiusBox}>
              <TextInput style={styles.radiusInput} keyboardType="numeric" value={radiusKm} onChangeText={setRadiusKm} />
              <Text style={styles.kmLabel}>km</Text>
            </View>
          </View>
          <TextInput
            style={styles.messageInput}
            placeholder="Optional message (e.g. Fresh tomatoes today!)"
            maxLength={200}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.button} onPress={send}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </>
      )}
      <Text style={styles.hint}>
        Free for now. Buyers see this on their Notifications page or when browsing nearby - it expires after 24h.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 12, paddingTop: 12 },
  title: { fontWeight: 'bold', color: GREEN, marginBottom: 8 },
  error: { color: '#c0392b', fontSize: 13, marginBottom: 6 },
  success: { color: GREEN, fontSize: 13, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 8 },
  radiusBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 8 },
  radiusInput: { paddingVertical: 8, width: 50 },
  kmLabel: { color: '#777', marginLeft: 4 },
  messageInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  button: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#999', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  secondaryButtonText: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 11, color: '#999', marginTop: 8 },
});
