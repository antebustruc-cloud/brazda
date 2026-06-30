import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { api } from '../context/AuthContext';

const GREEN = '#2d6a4f';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
export default function GetPaid({ channelType, channelId }) {
  const [amount, setAmount] = useState('1.00');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [txn, setTxn] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setMessage('');
    try {
      const res = await api.post('/payments/create/', {
        amount,
        buyer_email: buyerEmail,
        channel_type: channelType,
        channel_id: channelId,
      });
      setTxn(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate barcode.');
    }
  };

  const confirmPaid = async () => {
    try {
      const res = await api.patch(`/payments/${txn.id}/confirm/`, {});
      setTxn(res.data);
      setMessage(res.data.buyer_email ? `Payment confirmed ✅ — receipt sent to ${res.data.buyer_email}` : 'Payment confirmed ✅');
    } catch (err) {
      setError('Could not confirm payment.');
    }
  };

  const reset = () => {
    setTxn(null);
    setMessage('');
    setError('');
    setAmount('1.00');
    setBuyerEmail('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Paid 💳</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {!txn ? (
        <>
          <View style={styles.row}>
            <View style={styles.amountBox}>
              <Text style={styles.euro}>€</Text>
              <TextInput style={styles.amountInput} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            </View>
          </View>
          <TextInput
            style={styles.emailInput}
            placeholder="Buyer email (optional, for receipt)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={buyerEmail}
            onChangeText={setBuyerEmail}
          />
          <TouchableOpacity style={styles.button} onPress={generate}>
            <Text style={styles.buttonText}>Generate barcode</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            Buyer scans this with their own m-banking app — they can adjust the amount there before confirming.
          </Text>
          <Image source={{ uri: txn.barcode_image }} style={styles.barcode} resizeMode="contain" />
          <View style={styles.row}>
            {!txn.is_confirmed ? (
              <TouchableOpacity style={styles.button} onPress={confirmPaid}>
                <Text style={styles.buttonText}>Payment confirmed ✅</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>Confirmed</Text>
              </View>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>{txn.is_confirmed ? 'New barcode' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 12, paddingTop: 12 },
  title: { fontWeight: 'bold', color: GREEN, marginBottom: 8 },
  error: { color: '#c0392b', fontSize: 13, marginBottom: 6 },
  success: { color: GREEN, fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 8 },
  euro: { color: '#777', marginRight: 4 },
  amountInput: { paddingVertical: 8, width: 70 },
  emailInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  button: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#999', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  secondaryButtonText: { color: '#fff', fontWeight: 'bold' },
  hint: { fontSize: 12, color: '#777', marginBottom: 10 },
  barcode: { width: '100%', height: 140, backgroundColor: '#fff', marginBottom: 10 },
  confirmedBadge: { backgroundColor: '#198754', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  confirmedText: { color: '#fff', fontWeight: 'bold' },
});
