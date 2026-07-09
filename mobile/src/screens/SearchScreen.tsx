import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api, { apiErrorMessage } from '../services/api';

export default function SearchScreen({ route, navigation }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    route?.params?.categorySlug || null
  );
  const [nearMe, setNearMe] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api.get('/public/categories').then((response) => setCategories(response.data)).catch(() => {});
  }, []);

  const loadByCategory = useCallback(async (categorySlug: string | null) => {
    setLoading(true);
    try {
      const response = await api.get('/technicians/available', {
        params: categorySlug ? { category: categorySlug } : {},
      });
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error searching technicians:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!nearMe) {
      loadByCategory(selectedSlug);
    }
  }, [selectedSlug, nearMe, loadByCategory]);

  const handleSelectCategory = (slug: string | null) => {
    setNearMe(false);
    setSelectedSlug(slug);
  };

  const handleNearMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Enable location access to find technicians near you.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setNearMe(true);
      setSelectedSlug(null);
      setLoading(true);
      const response = await api.get('/technicians/nearby', {
        params: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radiusKm: 15,
        },
      });
      setTechnicians(response.data);
    } catch (error: any) {
      Alert.alert('Could not get your location', apiErrorMessage(error, 'Please try again.'));
    } finally {
      setLocating(false);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Technician</Text>
      </View>

      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All', slug: null }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                !nearMe && selectedSlug === item.slug && styles.chipActive,
              ]}
              onPress={() => handleSelectCategory(item.slug)}
            >
              <Text style={[styles.chipText, !nearMe && selectedSlug === item.slug && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.nearMeButton, nearMe && styles.nearMeButtonActive]}
        onPress={handleNearMe}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color={nearMe ? '#fff' : '#1B8B4D'} />
        ) : (
          <Ionicons name="locate" size={18} color={nearMe ? '#fff' : '#1B8B4D'} />
        )}
        <Text style={[styles.nearMeText, nearMe && styles.nearMeTextActive]}>Near Me</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B8B4D" />
        </View>
      ) : (
        <FlatList
          data={technicians}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No technicians found. Try a different filter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TechnicianProfile', { technicianId: item.id })}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color="#1B8B4D" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.bio} numberOfLines={1}>{item.bio || item.businessName || 'Professional Technician'}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)} ({item.totalRatings || 0})</Text>
                  {item.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#1B8B4D" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  chipsRow: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1B8B4D', borderColor: '#1B8B4D' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  nearMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1B8B4D',
    gap: 6,
  },
  nearMeButtonActive: { backgroundColor: '#1B8B4D' },
  nearMeText: { fontSize: 13, color: '#1B8B4D', fontWeight: '600' },
  nearMeTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  bio: { fontSize: 13, color: '#666', marginTop: 2, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: '#333', fontWeight: '600' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  verifiedText: { fontSize: 11, color: '#1B8B4D', fontWeight: '600', marginLeft: 2 },
});
