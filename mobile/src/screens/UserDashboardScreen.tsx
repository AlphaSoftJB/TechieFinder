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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function UserDashboardScreen() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'bookings' | 'notifications'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const load = useCallback(async () => {
    try {
      const [bookingsResponse, notificationsResponse] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/notifications/my'),
      ]);
      setBookings(bookingsResponse.data);
      setNotifications(notificationsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handlePay = async (bookingId: number) => {
    try {
      await api.post(`/payments/bookings/${bookingId}/pay`);
      Alert.alert('Payment successful');
      load();
    } catch (error: any) {
      Alert.alert('Payment failed', apiErrorMessage(error, 'Please try again.'));
    }
  };

  const handleCancel = (bookingId: number) => {
    Alert.alert('Cancel booking?', 'This cannot be undone.', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/bookings/${bookingId}/status`, { status: 'CANCELLED', reason: 'Cancelled by customer' });
            load();
          } catch (error: any) {
            Alert.alert('Could not cancel', apiErrorMessage(error, 'Please try again.'));
          }
        },
      },
    ]);
  };

  const submitRating = async () => {
    try {
      await api.post('/ratings', {
        bookingId: ratingBooking.id,
        rating: ratingValue,
        review: reviewText || undefined,
      });
      setRatingBooking(null);
      setReviewText('');
      setRatingValue(5);
      Alert.alert('Thanks for the feedback!');
    } catch (error: any) {
      Alert.alert('Could not submit rating', apiErrorMessage(error, 'Please try again.'));
    }
  };

  const markRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking notification read:', error);
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
          <Text style={styles.title}>My Account</Text>
          <Text style={styles.subtitle}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'bookings' && styles.tabActive]} onPress={() => setTab('bookings')}>
          <Text style={[styles.tabText, tab === 'bookings' && styles.tabTextActive]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'notifications' && styles.tabActive]} onPress={() => setTab('notifications')}>
          <Text style={[styles.tabText, tab === 'notifications' && styles.tabTextActive]}>
            Notifications{notifications.filter((n) => !n.read).length > 0 ? ` (${notifications.filter((n) => !n.read).length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'bookings' ? (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No bookings yet. Find a technician to get started.</Text>}
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
                {item.status === 'CONFIRMED' && item.paymentStatus === 'PENDING' && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => handlePay(item.id)}>
                    <Text style={styles.actionButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
                {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={() => handleCancel(item.id)}>
                    <Text style={styles.actionButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'COMPLETED' && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => setRatingBooking(item)}>
                    <Text style={styles.actionButtonText}>Rate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notificationCard, !item.read && styles.notificationUnread]}
              onPress={() => !item.read && markRead(item.id)}
            >
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!ratingBooking} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate this technician</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRatingValue(n)}>
                  <Ionicons name="star" size={32} color={n <= ratingValue ? '#F59E0B' : '#E5E7EB'} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Leave a review (optional)"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary, styles.flex1]} onPress={() => setRatingBooking(null)}>
                <Text style={styles.actionButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.flex1]} onPress={submitRating}>
                <Text style={styles.actionButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  logoutButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB' },
  tabActive: { backgroundColor: '#1B8B4D' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 14 },
  card: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingNumber: { fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  description: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  meta: { fontSize: 13, color: '#666', marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: { backgroundColor: '#1B8B4D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  actionButtonSecondary: { backgroundColor: '#F3F4F6' },
  actionButtonSecondaryText: { color: '#666', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  notificationCard: { padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', marginBottom: 10 },
  notificationUnread: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#1B8B4D' },
  notificationTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  notificationMessage: { fontSize: 13, color: '#666', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  reviewInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, minHeight: 80, marginBottom: 16, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
});
