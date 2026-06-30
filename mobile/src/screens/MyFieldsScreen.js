import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../context/AuthContext';
import ProductManager from '../components/ProductManager';
import GetPaid from '../components/GetPaid';

const GREEN = '#2d6a4f';

export default function MyFieldsScreen() {
  const [parcelName, setParcelName] = useState('');
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [parcels, setParcels] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchParcels = async () => {
    try {
      const res = await api.get('/parcels/');
      setParcels(res.data);
    } catch (err) {
      console.log('Could not load parcels', err.response?.data);
    }
  };

  useEffect(() => { fetchParcels(); }, []);

  const handleSave = async () => {
    if (!parcelName || !pin) {
      setMessage('Tap the map to drop a pin and enter a name!');
      return;
    }
    try {
      await api.post('/parcels/', { name: parcelName, lat: pin.latitude, lng: pin.longitude });
      setMessage('Field saved! ✅');
      setParcelName('');
      setPin(null);
      fetchParcels();
    } catch (err) {
      setMessage('Error saving field. Try again.');
    }
  };

  const startEdit = (p) => { setEditingId(p.id); setEditName(p.name); };

  const saveEdit = async (p) => {
    try {
      await api.patch(`/parcels/${p.id}/`, { name: editName });
      setEditingId(null);
      fetchParcels();
    } catch (err) { /* ignore */ }
  };

  const deleteParcel = (p) => {
    Alert.alert('Delete field', `Delete "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/parcels/${p.id}/`);
            fetchParcels();
          } catch (err) { /* ignore */ }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.formRow}>
        <TextInput
          style={styles.nameInput}
          placeholder="Field name (e.g. Apple orchard)"
          value={parcelName}
          onChangeText={setParcelName}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Field</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.hint}>👆 Tap anywhere on the map to drop a pin for your field entrance</Text>

      <MapView
        style={styles.map}
        initialRegion={{ latitude: 45.1, longitude: 16.5, latitudeDelta: 4, longitudeDelta: 4 }}
        onPress={(e) => setPin(e.nativeEvent.coordinate)}
      >
        {pin && <Marker coordinate={pin} pinColor={GREEN} />}
      </MapView>

      <Text style={styles.heading}>My Fields ({parcels.length})</Text>
      {parcels.length === 0 && <Text style={styles.empty}>No fields yet. Tap the map to add one!</Text>}
    </View>
  );

  return (
    <FlatList
      data={parcels}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      renderItem={({ item: p }) => (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              {editingId === p.id ? (
                <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />
              ) : (
                <Text style={styles.cardTitle}>{p.name}</Text>
              )}
              <Text style={styles.coords}>📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}</Text>
            </View>
            <View style={styles.actions}>
              {editingId === p.id ? (
                <>
                  <TouchableOpacity style={styles.smallButton} onPress={() => saveEdit(p)}>
                    <Text style={styles.smallButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => setEditingId(null)}>
                    <Text style={styles.smallButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.smallButton} onPress={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <Text style={styles.smallButtonText}>{expandedId === p.id ? 'Close' : 'Products'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonAlt} onPress={() => startEdit(p)}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteParcel(p)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          {expandedId === p.id && (
            <>
              <ProductManager channelType="parcel" channelId={p.id} />
              <GetPaid channelType="parcel" channelId={p.id} />
            </>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  saveButton: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  message: { color: GREEN, marginBottom: 6 },
  hint: { fontSize: 12, color: '#777', marginBottom: 8 },
  map: { height: 220, borderRadius: 8, marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  empty: { color: '#999', marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 14, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, width: 180 },
  coords: { color: '#777', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  smallButton: { backgroundColor: GREEN, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonAlt: { backgroundColor: '#5a8f73', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  smallButtonSecondary: { backgroundColor: '#999', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonSecondaryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteButton: { borderWidth: 1, borderColor: '#c0392b', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  deleteButtonText: { color: '#c0392b', fontSize: 12, fontWeight: '600' },
});
