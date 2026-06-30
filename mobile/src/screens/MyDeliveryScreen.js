import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../context/AuthContext';
import ProductManager from '../components/ProductManager';
import GetPaid from '../components/GetPaid';
import NotifyNearby from '../components/NotifyNearby';
import { FEATURES } from '../config';

const GREEN = '#2d6a4f';

export default function MyDeliveryScreen() {
  const [form, setForm] = useState({ name: '', radius_km: '10', route_corridor_km: '0', delivery_date: '' });
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/delivery/');
      setEvents(res.data);
    } catch (err) {
      console.log('Could not load deliveries', err.response?.data);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const setField = (key, value) => setForm({ ...form, [key]: value });

  const handleSave = async () => {
    if (!form.name || !form.delivery_date || !pin) {
      setMessage('Name, date (YYYY-MM-DD), and a destination pin are required!');
      return;
    }
    try {
      await api.post('/delivery/', {
        name: form.name,
        radius_km: form.radius_km,
        route_corridor_km: form.route_corridor_km,
        delivery_date: form.delivery_date,
        lat: pin.latitude,
        lng: pin.longitude,
      });
      setMessage('Delivery event saved! ✅');
      setForm({ name: '', radius_km: '10', route_corridor_km: '0', delivery_date: '' });
      setPin(null);
      fetchEvents();
    } catch (err) {
      setMessage('Error saving delivery event.');
    }
  };

  const startEdit = (ev) => { setEditingId(ev.id); setEditName(ev.name); };

  const saveEdit = async (ev) => {
    try {
      await api.patch(`/delivery/${ev.id}/`, { name: editName });
      setEditingId(null);
      fetchEvents();
    } catch (err) { /* ignore */ }
  };

  const deleteEvent = (ev) => {
    Alert.alert('Delete delivery', `Delete "${ev.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/delivery/${ev.id}/`);
            fetchEvents();
          } catch (err) { /* ignore */ }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.formTitle}>Create a Delivery Event 🚚</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Event name (e.g. Tuesday Split run)"
        value={form.name}
        onChangeText={(v) => setField('name', v)}
      />
      <TextInput
        style={styles.nameInput}
        placeholder="Date (YYYY-MM-DD)"
        value={form.delivery_date}
        onChangeText={(v) => setField('delivery_date', v)}
      />
      <View style={styles.row}>
        <View style={styles.smallBox}>
          <Text style={styles.smallLabel}>Radius (km)</Text>
          <TextInput style={styles.smallInput} keyboardType="numeric" value={form.radius_km} onChangeText={(v) => setField('radius_km', v)} />
        </View>
        <View style={styles.smallBox}>
          <Text style={styles.smallLabel}>Corridor (km)</Text>
          <TextInput style={styles.smallInput} keyboardType="numeric" value={form.route_corridor_km} onChangeText={(v) => setField('route_corridor_km', v)} />
        </View>
      </View>
      <Text style={styles.hint}>
        Corridor (optional): buyers within this distance of the straight-line route from your OPG to the
        destination see this too - even outside the destination radius. Leave at 0 to turn off.
      </Text>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Delivery</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.hint}>👆 Tap the map to set your delivery destination (e.g. Split center)</Text>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 45.1, longitude: 16.5, latitudeDelta: 4, longitudeDelta: 4 }}
        onPress={(e) => setPin(e.nativeEvent.coordinate)}
      >
        {pin && <Marker coordinate={pin} pinColor={GREEN} />}
      </MapView>

      <Text style={styles.heading}>My Delivery Events ({events.length})</Text>
      {events.length === 0 && <Text style={styles.empty}>No delivery events yet.</Text>}
    </View>
  );

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      renderItem={({ item: ev }) => (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              {editingId === ev.id ? (
                <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />
              ) : (
                <Text style={styles.cardTitle}>{ev.name}</Text>
              )}
              <Text style={styles.coords}>
                📅 {ev.delivery_date} · {ev.radius_km}km radius
                {ev.route_corridor_km > 0 ? ` + ${ev.route_corridor_km}km corridor` : ''} ·{' '}
                <Text style={{ color: ev.is_active ? '#198754' : '#999', fontWeight: '600' }}>
                  {ev.is_active ? 'Active' : 'Inactive'}
                </Text>
              </Text>
            </View>
            <View style={styles.actions}>
              {editingId === ev.id ? (
                <>
                  <TouchableOpacity style={styles.smallButton} onPress={() => saveEdit(ev)}>
                    <Text style={styles.smallButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => setEditingId(null)}>
                    <Text style={styles.smallButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.smallButton} onPress={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                    <Text style={styles.smallButtonText}>{expandedId === ev.id ? 'Close' : 'Products'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonAlt} onPress={() => startEdit(ev)}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEvent(ev)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          {expandedId === ev.id && (
            <>
              <ProductManager channelType="delivery_event" channelId={ev.id} />
              <GetPaid channelType="delivery_event" channelId={ev.id} />
              {FEATURES.notifications && <NotifyNearby channelType="delivery_event" channelId={ev.id} />}
            </>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: GREEN, marginBottom: 8 },
  nameInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  smallBox: { flex: 1 },
  smallLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  smallInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  hint: { fontSize: 12, color: '#777', marginBottom: 8 },
  saveButton: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  message: { color: GREEN, marginBottom: 6 },
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
