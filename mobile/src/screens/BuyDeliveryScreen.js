import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '../context/AuthContext';

const GREEN = '#2d6a4f';
const CATEGORIES = ['', 'fruit', 'vegetable', 'herb', 'other'];

export default function BuyDeliveryScreen() {
  const [pin, setPin] = useState(null);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState('');
  const [fMaxPrice, setFMaxPrice] = useState('');

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setMessage('Location permission denied - tap the map instead.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  };

  const search = async (location = pin) => {
    if (!location) { setMessage('Set a location first - GPS or tap the map.'); return; }
    try {
      const res = await api.get(`/delivery/nearby/?lat=${location.lat}&lng=${location.lng}`);
      setEvents(res.data);
      setMessage(res.data.length === 0 ? 'No deliveries reach this location.' : '');
    } catch (err) {
      setMessage('Search error.');
    }
  };

  const onMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const location = { lat: latitude, lng: longitude };
    setPin(location);
    search(location);
  };

  const filterProducts = (products) => (products || []).filter(p => {
    if (fName && !p.catalog_name.toLowerCase().includes(fName.toLowerCase())) return false;
    if (fMaxPrice && parseFloat(p.price_per_kg) > parseFloat(fMaxPrice)) return false;
    if (fType && p.category !== fType) return false;
    return true;
  });

  const visibleEvents = events
    .map(ev => ({ ...ev, filtered: filterProducts(ev.products) }))
    .filter(ev => ev.filtered.length > 0);

  const renderHeader = () => (
    <View>
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.button} onPress={useMyLocation}>
          <Text style={styles.buttonText}>📍 Use my location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => search()}>
          <Text style={styles.buttonText}>Find deliveries</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Set where you want delivery - shows events whose range covers that spot.</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <MapView
        style={styles.map}
        initialRegion={{ latitude: 45.1, longitude: 16.5, latitudeDelta: 4, longitudeDelta: 4 }}
        onPress={onMapPress}
      >
        {pin && <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} pinColor={GREEN} />}
      </MapView>

      {events.length > 0 && (
        <View style={styles.filters}>
          <TextInput style={styles.filterInput} placeholder="Product (e.g. apple)" value={fName} onChangeText={setFName} />
          <View style={styles.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => setFType(c)}
                style={[styles.catChip, fType === c && styles.catChipActive]}>
                <Text style={[styles.catChipText, fType === c && styles.catChipTextActive]}>{c || 'Any'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.filterInput} placeholder="Max €/kg" keyboardType="numeric" value={fMaxPrice} onChangeText={setFMaxPrice} />
        </View>
      )}

      <Text style={styles.resultsHeading}>Deliveries available ({visibleEvents.length})</Text>
    </View>
  );

  return (
    <FlatList
      data={visibleEvents}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      renderItem={({ item: ev }) => (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{ev.name}</Text>
              <Text style={styles.cardSubtitle}>{ev.opg_name}</Text>
              <Text style={styles.dateText}>📅 {ev.delivery_date} · within {ev.radius_km}km</Text>
              {ev.matched_via === 'corridor' && (
                <Text style={styles.corridorText}>🛣️ Along the route, not at the destination</Text>
              )}
              {ev.owner_phone ? <Text style={styles.phoneText}>📞 {ev.owner_phone}</Text> : null}
            </View>
            {ev.owner_phone ? (
              <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${ev.owner_phone}`)}>
                <Text style={styles.buttonText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {ev.filtered.map(p => (
            <Text key={p.id} style={styles.productLine}>
              🚚 {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''} — <Text style={styles.price}>€{p.price_per_kg}/kg</Text>
            </Text>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  controlsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  button: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, flex: 1, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  hint: { color: '#777', fontSize: 13, marginBottom: 8 },
  message: { color: GREEN, marginBottom: 8 },
  map: { height: 220, borderRadius: 8, marginBottom: 8 },
  filters: { backgroundColor: '#eef6f0', borderRadius: 8, padding: 10, marginBottom: 12 },
  filterInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catChip: { borderWidth: 1, borderColor: GREEN, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  catChipActive: { backgroundColor: GREEN },
  catChipText: { color: GREEN, fontSize: 13 },
  catChipTextActive: { color: '#fff' },
  resultsHeading: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 14, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: '#777', marginBottom: 6 },
  dateText: { fontSize: 13, color: '#333' },
  corridorText: { fontSize: 12, color: '#2d6a4f', fontWeight: '600' },
  phoneText: { fontSize: 13, color: '#333' },
  callButton: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  productLine: { paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#f0f0f0', fontSize: 14 },
  price: { fontWeight: 'bold' },
});
