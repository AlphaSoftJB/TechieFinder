import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const COLORS = { primary: '#1B8B4D', accent: '#F97316', bg: '#F9FAFB', text: '#333', sub: '#666', border: '#E5E7EB' };

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' },
  ACCEPTED:  { color: '#3B82F6', bg: '#DBEAFE', label: 'Accepted' },
  COMPLETED: { color: '#10B981', bg: '#D1FAE5', label: 'Completed' },
  CANCELLED: { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled' },
};

interface Booking {
  id: number;
  technicianName: string;
  category: string;
  scheduledDate: string;
  status: string;
  totalAmount: number;
}

export default function UserDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const res = await api.get(`/bookings/user/${user?.id}`);
      setBookings(res.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const QUICK_ACTIONS = [
    { label: 'Find Technician', icon: 'search-outline', action: () => navigation.navigate('Search') },
    { label: 'My Profile', icon: 'person-outline', action: () => Alert.alert('Coming Soon', 'Profile editing coming soon!') },
    { label: 'My Addresses', icon: 'location-outline', action: () => Alert.alert('Coming Soon', 'Address management coming soon!') },
    { label: 'Payment Methods', icon: 'card-outline', action: () => Alert.alert('Coming Soon', 'Payment methods coming soon!') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} colors={[COLORS.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
            <Text style={styles.subGreeting}>Manage your bookings below</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total', value: stats.total, color: COLORS.primary, icon: 'list-outline' },
            { label: 'Pending', value: stats.pending, color: '#F59E0B', icon: 'time-outline' },
            { label: 'Completed', value: stats.completed, color: '#10B981', icon: 'checkmark-circle-outline' },
            { label: 'Cancelled', value: stats.cancelled, color: '#EF4444', icon: 'close-circle-outline' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={styles.actionCard} onPress={a.action}>
                <View style={styles.actionIcon}><Ionicons name={a.icon as any} size={22} color={COLORS.primary} /></View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.emptyBtnText}>Find a Technician</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.map((b) => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
              return (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingLeft}>
                    <View style={styles.bookingAvatar}>
                      <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingName}>{b.technicianName}</Text>
                      <Text style={styles.bookingCategory}>{b.category}</Text>
                      <Text style={styles.bookingDate}>{new Date(b.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingRight}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    {b.totalAmount > 0 && <Text style={styles.bookingAmount}>₦{b.totalAmount.toLocaleString()}</Text>}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 30 },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  logoutBtn: { padding: 6 },
  statsGrid: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 12, alignItems: 'center', padding: 12, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.sub },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 15, color: COLORS.sub, marginTop: 10, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  bookingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 10 },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bookingAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  bookingCategory: { fontSize: 12, color: COLORS.sub },
  bookingDate: { fontSize: 11, color: COLORS.sub, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  bookingAmount: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
