import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { apiErrorMessage } from '../services/api';

export default function TechnicianProfileScreen({ route, navigation }: any) {
  const { technicianId } = route.params;
  const [technician, setTechnician] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceDescription: '',
    serviceAddress: '',
    city: '',
    state: '',
    estimatedPrice: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    loadProfile();
  }, [technicianId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [technicianResponse, ratingsResponse, offeringsResponse] = await Promise.all([
        api.get(`/technicians/${technicianId}`),
        api.get(`/ratings/technician/${technicianId}`),
        api.get(`/technicians/${technicianId}/services`),
      ]);
      setTechnician(technicianResponse.data);
      setRatings(ratingsResponse.data);
      setOfferings(offeringsResponse.data);
    } catch (error) {
      Alert.alert('Error', apiErrorMessage(error, 'Could not load this technician.'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const response = await api.post(`/conversations/with-technician/${technicianId}`);
      navigation.navigate('Chat', { conversationId: response.data.id, technicianName: `${technician.firstName} ${technician.lastName}` });
    } catch (error: any) {
      Alert.alert('Could not start conversation', apiErrorMessage(error, 'Please try again.'));
    }
  };

  const handleBook = async () => {
    if (!form.serviceDescription || !form.serviceAddress || !form.city || !form.state || !form.estimatedPrice || !form.date || !form.time) {
      Alert.alert('Missing information', 'Please fill in every field.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        technicianId,
        scheduledDateTime: `${form.date}T${form.time}:00`,
        serviceDescription: form.serviceDescription,
        serviceAddress: form.serviceAddress,
        city: form.city,
        state: form.state,
        estimatedPrice: parseFloat(form.estimatedPrice),
      });
      Alert.alert('Booking requested', 'The technician will confirm shortly.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Dashboard' }) },
      ]);
    } catch (error: any) {
      Alert.alert('Could not create booking', apiErrorMessage(error, 'Please check your details and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !technician) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B8B4D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#1B8B4D" />
        </View>
        <Text style={styles.name}>{technician.firstName} {technician.lastName}</Text>
        {technician.businessName && <Text style={styles.businessName}>{technician.businessName}</Text>}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.ratingText}>{Number(technician.rating || 0).toFixed(1)} ({technician.totalRatings} reviews)</Text>
          {technician.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#1B8B4D" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.stat}>{technician.completedJobs} jobs completed</Text>
      </View>

      {technician.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{technician.bio}</Text>
        </View>
      )}

      {offerings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {offerings.map((offering) => (
            <View key={offering.id} style={styles.offeringRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offeringName}>{offering.serviceName}</Text>
                <Text style={styles.offeringCategory}>{offering.categoryName}</Text>
              </View>
              <Text style={styles.offeringPrice}>₦{Number(offering.basePrice).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews ({ratings.length})</Text>
        {ratings.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          ratings.map((rating) => (
            <View key={rating.id} style={styles.reviewCard}>
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name="star" size={14} color={i < rating.rating ? '#F59E0B' : '#E5E7EB'} />
                ))}
              </View>
              {rating.review && <Text style={styles.reviewText}>{rating.review}</Text>}
            </View>
          ))
        )}
      </View>

      {!showBookingForm ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={20} color="#1B8B4D" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton} onPress={() => setShowBookingForm(true)}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bookingForm}>
          <Text style={styles.sectionTitle}>Request a Booking</Text>
          <TextInput style={styles.input} placeholder="What do you need help with?" value={form.serviceDescription} onChangeText={(t) => setForm({ ...form, serviceDescription: t })} />
          <TextInput style={styles.input} placeholder="Service address" value={form.serviceAddress} onChangeText={(t) => setForm({ ...form, serviceAddress: t })} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="City" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="State" value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="Time (HH:mm)" value={form.time} onChangeText={(t) => setForm({ ...form, time: t })} />
          </View>
          <TextInput style={styles.input} placeholder="Estimated price (₦)" keyboardType="numeric" value={form.estimatedPrice} onChangeText={(t) => setForm({ ...form, estimatedPrice: t })} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.bookButton, styles.flex1, styles.cancelButton]} onPress={() => setShowBookingForm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bookButton, styles.flex1]} onPress={handleBook} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookButtonText}>Confirm</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  businessName: { fontSize: 14, color: '#666', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { fontSize: 13, color: '#333', fontWeight: '600' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  verifiedText: { fontSize: 12, color: '#1B8B4D', fontWeight: '600', marginLeft: 2 },
  stat: { fontSize: 13, color: '#999', marginTop: 6 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  bio: { fontSize: 14, color: '#555', lineHeight: 20 },
  offeringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  offeringName: { fontSize: 14, fontWeight: '600', color: '#333' },
  offeringCategory: { fontSize: 12, color: '#999', marginTop: 2 },
  offeringPrice: { fontSize: 14, fontWeight: 'bold', color: '#1B8B4D' },
  emptyText: { fontSize: 13, color: '#999' },
  reviewCard: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewText: { fontSize: 13, color: '#555', marginTop: 6 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 8 },
  messageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#1B8B4D' },
  messageButtonText: { color: '#1B8B4D', fontWeight: '600' },
  bookButton: { flex: 1.4, height: 50, borderRadius: 12, backgroundColor: '#1B8B4D', justifyContent: 'center', alignItems: 'center' },
  bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelButton: { backgroundColor: '#9CA3AF' },
  cancelButtonText: { color: '#fff', fontWeight: '600' },
  bookingForm: { paddingHorizontal: 20 },
  input: { height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#F9FAFB', fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
});
