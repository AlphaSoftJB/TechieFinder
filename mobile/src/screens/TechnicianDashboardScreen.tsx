import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import api, { apiErrorMessage } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  IN_PROGRESS: '#8B5CF6',
  COMPLETED: '#10B981',
  CANCELLED: '#9CA3AF',
  REJECTED: '#EF4444',
};
const PRICING_TYPES = ['FIXED', 'HOURLY', 'NEGOTIABLE'];

export default function TechnicianDashboardScreen() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'jobs' | 'profile' | 'notifications'>('jobs');
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationForm, setLocationForm] = useState({ address: '', city: '', state: '', latitude: '', longitude: '', serviceRadiusKm: '15' });
  const [locating, setLocating] = useState(false);
  const [serviceForm, setServiceForm] = useState({ categorySlug: '', serviceName: '', basePrice: '', pricingType: 'FIXED', estimatedDurationMinutes: '' });
  const [savingLocation, setSavingLocation] = useState(false);
  const [addingService, setAddingService] = useState(false);

  const ensureProfile = useCallback(async () => {
    try {
      const response = await api.get('/technicians/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 && user) {
        const created = await api.post(`/technicians/create/${user.id}`);
        return created.data;
      }
      throw error;
    }
  }, [user]);

  const load = useCallback(async () => {
    try {
      const technicianProfile = await ensureProfile();
      setProfile(technicianProfile);
      const [bookingsResponse, notificationsResponse, categoriesResponse, offeringsResponse] = await Promise.all([
        api.get('/bookings/technician/my'),
        api.get('/notifications/my'),
        api.get('/public/categories'),
        api.get('/technicians/me/services'),
      ]);
      setBookings(bookingsResponse.data);
      setNotifications(notificationsResponse.data);
      setCategories(categoriesResponse.data);
      setOfferings(offeringsResponse.data);
      if (categoriesResponse.data.length > 0 && !serviceForm.categorySlug) {
        setServiceForm((prev) => ({ ...prev, categorySlug: categoriesResponse.data[0].slug }));
      }
    } catch (error) {
      console.error('Error loading technician dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const updateStatus = async (bookingId: number, status: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      load();
    } catch (error: any) {
      Alert.alert('Could not update booking', apiErrorMessage(error, 'Please try again.'));
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Enable location access to set your service area.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocationForm((prev) => ({
        ...prev,
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
      }));
    } catch (error) {
      Alert.alert('Could not get location', 'Please enter it manually.');
    } finally {
      setLocating(false);
    }
  };

  const saveLocation = async () => {
    if (!locationForm.address || !locationForm.city || !locationForm.state || !locationForm.latitude || !locationForm.longitude) {
      Alert.alert('Missing information', 'Please fill in address, city, state, and location.');
      return;
    }
    setSavingLocation(true);
    try {
      await api.put('/technicians/me/location', {
        address: locationForm.address,
        city: locationForm.city,
        state: locationForm.state,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude),
        serviceRadiusKm: parseInt(locationForm.serviceRadiusKm, 10) || 15,
      });
      Alert.alert('Location saved', 'Customers can now find you in nearby search.');
    } catch (error: any) {
      Alert.alert('Could not save location', apiErrorMessage(error, 'Please try again.'));
    } finally {
      setSavingLocation(false);
    }
  };

  const addService = async () => {
    if (!serviceForm.categorySlug || !serviceForm.serviceName || !serviceForm.basePrice) {
      Alert.alert('Missing information', 'Please fill in category, service name, and price.');
      return;
    }
    setAddingService(true);
    try {
      await api.post('/technicians/me/services', {
        categorySlug: serviceForm.categorySlug,
        serviceName: serviceForm.serviceName,
        basePrice: parseFloat(serviceForm.basePrice),
        pricingType: serviceForm.pricingType,
        estimatedDurationMinutes: serviceForm.estimatedDurationMinutes ? parseInt(serviceForm.estimatedDurationMinutes, 10) : undefined,
      });
      setServiceForm({ ...serviceForm, serviceName: '', basePrice: '', estimatedDurationMinutes: '' });
      const offeringsResponse = await api.get('/technicians/me/services');
      setOfferings(offeringsResponse.data);
    } catch (error: any) {
      Alert.alert('Could not add service', apiErrorMessage(error, 'Please try again.'));
    } finally {
      setAddingService(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B8B4D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Technician Dashboard</Text>
          <Text style={styles.subtitle}>{profile?.technicianId} · ★ {Number(profile?.rating || 0).toFixed(1)} ({profile?.totalRatings})</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['jobs', 'profile', 'notifications'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'jobs' ? 'Jobs' : t === 'profile' ? 'Profile' : `Notifications${notifications.filter((n) => !n.read).length > 0 ? ` (${notifications.filter((n) => !n.read).length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'jobs' && (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No jobs yet. Add your services and location so customers can find you.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#999' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.description}>{item.serviceDescription}</Text>
              <Text style={styles.meta}>{item.serviceAddress}</Text>
              <Text style={styles.meta}>₦{Number(item.estimatedPrice).toLocaleString()} · Payment: {item.paymentStatus}</Text>
              <View style={styles.actionRow}>
                {item.status === 'PENDING' && (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus(item.id, 'CONFIRMED')}>
                      <Text style={styles.actionButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => updateStatus(item.id, 'REJECTED')}>
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.status === 'CONFIRMED' && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus(item.id, 'IN_PROGRESS')}>
                    <Text style={styles.actionButtonText}>Start Job</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'IN_PROGRESS' && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus(item.id, 'COMPLETED')}>
                    <Text style={styles.actionButtonText}>Mark Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {tab === 'notifications' && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.notificationCard, !item.read && styles.notificationUnread]}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
            </View>
          )}
        />
      )}

      {tab === 'profile' && (
        <FlatList
          data={[{ key: 'form' }]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />}
          renderItem={() => (
            <View>
              <Text style={styles.sectionTitle}>Service Area</Text>
              <TextInput style={styles.input} placeholder="Street address" value={locationForm.address} onChangeText={(t) => setLocationForm({ ...locationForm, address: t })} />
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.flex1]} placeholder="City" value={locationForm.city} onChangeText={(t) => setLocationForm({ ...locationForm, city: t })} />
                <TextInput style={[styles.input, styles.flex1]} placeholder="State" value={locationForm.state} onChangeText={(t) => setLocationForm({ ...locationForm, state: t })} />
              </View>
              <TouchableOpacity style={styles.locateButton} onPress={handleUseCurrentLocation} disabled={locating}>
                {locating ? <ActivityIndicator size="small" color="#1B8B4D" /> : <Ionicons name="locate" size={16} color="#1B8B4D" />}
                <Text style={styles.locateButtonText}>Use my current location</Text>
              </TouchableOpacity>
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.flex1]} placeholder="Latitude" keyboardType="numeric" value={locationForm.latitude} onChangeText={(t) => setLocationForm({ ...locationForm, latitude: t })} />
                <TextInput style={[styles.input, styles.flex1]} placeholder="Longitude" keyboardType="numeric" value={locationForm.longitude} onChangeText={(t) => setLocationForm({ ...locationForm, longitude: t })} />
              </View>
              <TextInput style={styles.input} placeholder="Service radius (km)" keyboardType="numeric" value={locationForm.serviceRadiusKm} onChangeText={(t) => setLocationForm({ ...locationForm, serviceRadiusKm: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={saveLocation} disabled={savingLocation}>
                {savingLocation ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Location</Text>}
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Add a Service</Text>
              <View style={styles.chipsRow}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, serviceForm.categorySlug === c.slug && styles.chipActive]}
                    onPress={() => setServiceForm({ ...serviceForm, categorySlug: c.slug })}
                  >
                    <Text style={[styles.chipText, serviceForm.categorySlug === c.slug && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Service name (e.g. Pipe repair)" value={serviceForm.serviceName} onChangeText={(t) => setServiceForm({ ...serviceForm, serviceName: t })} />
              <View style={styles.row}>
                {PRICING_TYPES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, styles.flex1, serviceForm.pricingType === p && styles.chipActive]}
                    onPress={() => setServiceForm({ ...serviceForm, pricingType: p })}
                  >
                    <Text style={[styles.chipText, { textAlign: 'center' }, serviceForm.pricingType === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Base price (₦)" keyboardType="numeric" value={serviceForm.basePrice} onChangeText={(t) => setServiceForm({ ...serviceForm, basePrice: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={addService} disabled={addingService}>
                {addingService ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Add Service</Text>}
              </TouchableOpacity>

              {offerings.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  {offerings.map((o) => (
                    <View key={o.id} style={styles.offeringRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.offeringName}>{o.serviceName}</Text>
                        <Text style={styles.offeringCategory}>{o.categoryName}</Text>
                      </View>
                      <Text style={styles.offeringPrice}>₦{Number(o.basePrice).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 40 }} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  logoutButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB' },
  tabActive: { backgroundColor: '#1B8B4D' },
  tabText: { fontSize: 12, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 14, paddingHorizontal: 20 },
  card: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingNumber: { fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  description: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  meta: { fontSize: 13, color: '#666', marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: { backgroundColor: '#1B8B4D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonDanger: { backgroundColor: '#EF4444' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  notificationCard: { padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', marginBottom: 10 },
  notificationUnread: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#1B8B4D' },
  notificationTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  notificationMessage: { fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#F9FAFB', fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  locateButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 12 },
  locateButtonText: { color: '#1B8B4D', fontWeight: '600', fontSize: 13 },
  saveButton: { height: 48, borderRadius: 10, backgroundColor: '#1B8B4D', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1B8B4D', borderColor: '#1B8B4D' },
  chipText: { fontSize: 12, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  offeringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  offeringName: { fontSize: 14, fontWeight: '600', color: '#333' },
  offeringCategory: { fontSize: 12, color: '#999', marginTop: 2 },
  offeringPrice: { fontSize: 14, fontWeight: 'bold', color: '#1B8B4D' },
});
