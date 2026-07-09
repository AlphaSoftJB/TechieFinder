import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const COLORS = { primary: '#1B8B4D', accent: '#F97316', bg: '#F9FAFB', text: '#333', sub: '#666', border: '#E5E7EB' };

interface TechnicianDetail {
  id: number;
  firstName: string;
  lastName: string;
  bio: string;
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  hourlyRate: number;
  isVerified: boolean;
  yearsExperience: number;
  completedJobs: number;
  services: { id: number; name: string; price: number; duration: string }[];
  portfolio: { id: number; title: string; description: string }[];
  certifications: { id: number; name: string; issuer: string; year: number }[];
}

export default function TechnicianProfileScreen({ route, navigation }: any) {
  const { technicianId } = route.params;
  const { user } = useAuth();
  const [technician, setTechnician] = useState<TechnicianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'certs'>('services');

  useEffect(() => {
    fetchProfile();
  }, [technicianId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/technicians/${technicianId}`);
      setTechnician(res.data);
    } catch {
      Alert.alert('Error', 'Could not load technician profile.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to book a technician.');
      return;
    }
    Alert.alert(
      'Confirm Booking',
      `Book ${technician?.firstName} ${technician?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBooking(true);
            try {
              await api.post('/bookings', {
                technicianId,
                userId: user.id,
                scheduledDate: new Date().toISOString(),
                notes: 'Booked via mobile app',
              });
              Alert.alert('Booking Confirmed!', 'Your booking request has been sent to the technician.', [
                { text: 'OK', onPress: () => navigation.navigate('UserDashboard') },
              ]);
            } catch (e: any) {
              Alert.alert('Booking Failed', e.message || 'Please try again.');
            } finally {
              setBooking(false);
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={14} color={COLORS.accent} />
    ));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!technician) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{technician.firstName[0]}{technician.lastName[0]}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{technician.firstName} {technician.lastName}</Text>
            {technician.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.category}>{technician.category}</Text>
          <View style={styles.ratingRow}>
            {renderStars(technician.rating)}
            <Text style={styles.ratingText}> {technician.rating?.toFixed(1)} ({technician.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Rating', value: technician.rating?.toFixed(1) ?? '—', icon: 'star' },
            { label: 'Jobs Done', value: String(technician.completedJobs ?? 0), icon: 'briefcase' },
            { label: 'Experience', value: `${technician.yearsExperience ?? 0}yr`, icon: 'time' },
            { label: 'Rate/hr', value: `₦${(technician.hourlyRate ?? 0).toLocaleString()}`, icon: 'cash' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={18} color={COLORS.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {technician.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{technician.bio}</Text>
          </View>
        ) : null}

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.sub} />
          <Text style={styles.locationText}>{technician.location}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['services', 'portfolio', 'certs'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'services' ? 'Services' : tab === 'portfolio' ? 'Portfolio' : 'Certifications'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <View style={styles.section}>
            {technician.services?.length ? technician.services.map((s) => (
              <View key={s.id} style={styles.serviceItem}>
                <View style={styles.serviceIcon}><Ionicons name="construct-outline" size={18} color={COLORS.primary} /></View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceDuration}>{s.duration}</Text>
                </View>
                <Text style={styles.servicePrice}>₦{s.price?.toLocaleString()}</Text>
              </View>
            )) : <Text style={styles.emptyTabText}>No services listed yet.</Text>}
          </View>
        )}

        {activeTab === 'portfolio' && (
          <View style={styles.section}>
            {technician.portfolio?.length ? technician.portfolio.map((p) => (
              <View key={p.id} style={styles.portfolioItem}>
                <View style={styles.portfolioThumb}><Ionicons name="image-outline" size={28} color={COLORS.sub} /></View>
                <View style={styles.portfolioInfo}>
                  <Text style={styles.portfolioTitle}>{p.title}</Text>
                  <Text style={styles.portfolioDesc}>{p.description}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyTabText}>No portfolio items yet.</Text>}
          </View>
        )}

        {activeTab === 'certs' && (
          <View style={styles.section}>
            {technician.certifications?.length ? technician.certifications.map((c) => (
              <View key={c.id} style={styles.certItem}>
                <Ionicons name="ribbon-outline" size={22} color={COLORS.primary} />
                <View style={styles.certInfo}>
                  <Text style={styles.certName}>{c.name}</Text>
                  <Text style={styles.certIssuer}>{c.issuer} · {c.year}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyTabText}>No certifications listed yet.</Text>}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookBar}>
        <View>
          <Text style={styles.bookRate}>₦{(technician.hourlyRate ?? 0).toLocaleString()}<Text style={styles.bookRateLabel}>/hr</Text></Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
          {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Book Now</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 20 },
  profileHeader: { backgroundColor: COLORS.primary, alignItems: 'center', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 16 },
  backBtn: { position: 'absolute', top: 16, left: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, gap: 4 },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  category: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, alignItems: 'center', padding: 10, gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.sub },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  bio: { fontSize: 14, color: COLORS.sub, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 4 },
  locationText: { fontSize: 13, color: COLORS.sub },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, marginHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.sub, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  serviceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  serviceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  serviceDuration: { fontSize: 12, color: COLORS.sub },
  servicePrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  portfolioItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  portfolioThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  portfolioInfo: { flex: 1 },
  portfolioTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  portfolioDesc: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
  certItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border, gap: 12 },
  certInfo: { flex: 1 },
  certName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  certIssuer: { fontSize: 12, color: COLORS.sub },
  emptyTabText: { color: COLORS.sub, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  bookBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  bookRate: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  bookRateLabel: { fontSize: 13, fontWeight: '400', color: COLORS.sub },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
