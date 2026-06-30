import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../context/AuthContext';

const GREEN = '#2d6a4f';
const CATEGORIES = [
  { value: 'fruit', label: 'Fruit' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'herb', label: 'Herb' },
  { value: 'other', label: 'Other' },
];

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
export default function ProductManager({ channelType, channelId }) {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [catalogItem, setCatalogItem] = useState('');
  const [variety, setVariety] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const fetchData = async () => {
    try {
      const productRes = await api.get(`/products/?${channelType}=${channelId}`);
      setProducts(productRes.data);
      const catalogRes = await api.get('/catalog/');
      setCatalog(catalogRes.data);
    } catch (err) {
      console.log('Load error', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const filteredCatalog = category ? catalog.filter(c => c.category === category) : [];
  const selectedCatalog = catalog.find(c => String(c.id) === String(catalogItem));

  const handleAdd = async () => {
    if (!catalogItem || !price) {
      setMessage('Pick a product and set a price!');
      return;
    }
    try {
      await api.post('/products/', {
        catalog_item: catalogItem,
        variety: variety || null,
        price_per_kg: price,
        [channelType]: channelId,
      });
      setMessage('Added! ✅');
      setCategory('');
      setCatalogItem('');
      setVariety('');
      setPrice('');
      fetchData();
    } catch (err) {
      setMessage('Error adding product.');
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.patch(`/products/${product.id}/`, { is_available: !product.is_available });
      fetchData();
    } catch (err) { /* ignore */ }
  };

  const startPriceEdit = (p) => {
    setEditingId(p.id);
    setEditPrice(String(p.price_per_kg));
  };

  const savePrice = async (p) => {
    try {
      await api.patch(`/products/${p.id}/`, { price_per_kg: editPrice });
      setEditingId(null);
      fetchData();
    } catch (err) { /* ignore */ }
  };

  const removeProduct = async (product) => {
    try {
      await api.delete(`/products/${product.id}/`);
      fetchData();
    } catch (err) { /* ignore */ }
  };

  if (loading) return <ActivityIndicator style={{ marginVertical: 12 }} color={GREEN} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products here</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.pickerRow}>
        <Picker
          selectedValue={category}
          style={styles.picker}
          onValueChange={(v) => { setCategory(v); setCatalogItem(''); setVariety(''); }}
        >
          <Picker.Item label="-- Category --" value="" />
          {CATEGORIES.map(c => <Picker.Item key={c.value} label={c.label} value={c.value} />)}
        </Picker>
      </View>

      {category ? (
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={catalogItem}
            style={styles.picker}
            onValueChange={(v) => { setCatalogItem(v); setVariety(''); }}
          >
            <Picker.Item label={`-- Product (${filteredCatalog.length}) --`} value="" />
            {filteredCatalog.map(c => <Picker.Item key={c.id} label={c.name} value={String(c.id)} />)}
          </Picker>
        </View>
      ) : null}

      {selectedCatalog && selectedCatalog.varieties.length > 0 ? (
        <View style={styles.pickerRow}>
          <Picker selectedValue={variety} style={styles.picker} onValueChange={setVariety}>
            <Picker.Item label="-- Variety --" value="" />
            {selectedCatalog.varieties.map(v => <Picker.Item key={v.id} label={v.name} value={String(v.id)} />)}
          </Picker>
        </View>
      ) : null}

      <View style={styles.row}>
        <TextInput style={styles.priceInput} placeholder="€/kg" keyboardType="numeric" value={price} onChangeText={setPrice} />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? <Text style={styles.empty}>No products here yet.</Text> : null}
      {products.map(p => (
        <View key={p.id} style={styles.productRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>
              {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''}
            </Text>
            {editingId === p.id ? (
              <TextInput style={styles.editPriceInput} keyboardType="numeric" value={editPrice} onChangeText={setEditPrice} />
            ) : (
              <Text style={styles.productPrice}>€{p.price_per_kg}/kg · {p.is_available ? 'Active' : 'Off'}</Text>
            )}
          </View>
          <View style={styles.actions}>
            {editingId === p.id ? (
              <>
                <TouchableOpacity onPress={() => savePrice(p)} style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingId(null)} style={styles.smallButtonSecondary}>
                  <Text style={styles.smallButtonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => startPriceEdit(p)} style={styles.smallButtonAlt}>
                  <Text style={styles.smallButtonText}>€ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleActive(p)} style={p.is_available ? styles.smallButtonSecondary : styles.smallButton}>
                  <Text style={p.is_available ? styles.smallButtonSecondaryText : styles.smallButtonText}>
                    {p.is_available ? 'Off' : 'On'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeProduct(p)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 12, paddingTop: 12 },
  title: { fontWeight: 'bold', color: GREEN, marginBottom: 8 },
  message: { color: GREEN, fontSize: 13, marginBottom: 8 },
  pickerRow: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  picker: { height: 44 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  priceInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, width: 80 },
  addButton: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#999', fontSize: 13, marginBottom: 8 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  productName: { fontWeight: '600' },
  productPrice: { color: '#555', fontSize: 13 },
  editPriceInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 4, width: 70 },
  actions: { flexDirection: 'row', gap: 6 },
  smallButton: { backgroundColor: GREEN, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonAlt: { backgroundColor: '#5a8f73', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  smallButtonSecondary: { backgroundColor: '#999', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  smallButtonSecondaryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  removeButton: { borderWidth: 1, borderColor: '#c0392b', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  removeButtonText: { color: '#c0392b', fontSize: 12 },
});
