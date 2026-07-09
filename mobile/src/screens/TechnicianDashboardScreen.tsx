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

interface Job {
  id: number;
  userName: string;
  category: string;
  scheduledDate: string;
  status: string;
  totalAmount: number;
  notes: string;
}

export default function TechnicianDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');

  const fetchJobs = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const res = await api.get(`/bookings/technician/${user?.id}`);
      setJobs(res.data || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleJobAction = async (jobId: number, action: 'ACCEPTED' | 'CANCELLED') => {
    const label = action === 'ACCEPTED' ? 'Accept' : 'Decline';
    Alert.alert(`${label} Job`, `Are you sure you want to ${label.toLowerCase()} this job?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: action === 'CANCELLED' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await api.patch(`/bookings/${jobId}/status`, { status: action });
            fetchJobs();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not update job status.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const pendingJobs = jobs.filter((j) => j.status === 'PENDING');
  const activeJobs = jobs.filter((j) => j.status === 'ACCEPTED');
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0);

  const displayJobs = activeTab === 'pending' ? pendingJobs : activeTab === 'active' ? activeJobs : completedJobs;

  const QUICK_ACTIONS = [
    { label: 'My Profile', icon: 'person-outline', action: () => Alert.alert('Coming Soon', 'Profile editing coming soon!') },
    { label: 'My Services', icon: 'construct-outline', action: () => Alert.alert('Coming Soon', 'Service management coming soon!') },
    { label: 'Availability', icon: 'calendar-outline', action: () => Alert.alert('Coming Soon', 'Availability management coming soon!') },
    { label: 'Portfolio', icon: 'images-outline', action: () => Alert.alert('Coming Soon', 'Portfolio management coming soon!') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} colors={[COLORS.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, {user?.firstName}! 🔧</Text>
            <Text style={styles.subGreeting}>Manage your jobs and earnings</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>₦{totalEarnings.toLocaleString()}</Text>
            <Text style={styles.earningsSub}>From {completedJobs.length} completed jobs</Text>
          </View>
          <View style={styles.earningsIcon}>
            <Ionicons name="cash-outline" size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Jobs', value: jobs.length, color: COLORS.primary, icon: 'briefcase-outline' },
            { label: 'Pending', value: pendingJobs.length, color: '#F59E0B', icon: 'time-outline' },
            { label: 'Active', value: activeJobs.length, color: '#3B82F6', icon: 'play-circle-outline' },
            { label: 'Done', value: completedJobs.length, color: '#10B981', icon: 'checkmark-circle-outline' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
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

        {/* Jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jobs</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            {([['pending', 'Pending', pendingJobs.length], ['active', 'Active', activeJobs.length], ['completed', 'Completed', completedJobs.length]] as const).map(([tab, label, count]) => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
                {count > 0 && <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}><Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>{count}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : displayJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No {activeTab} jobs</Text>
            </View>
          ) : (
            displayJobs.map((job) => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING;
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobAvatarWrap}>
                      <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobName}>{job.userName}</Text>
                      <Text style={styles.jobCategory}>{job.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}><Ionicons name="calendar-outline" size={13} color={COLORS.sub} /><Text style={styles.metaText}>{new Date(job.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text></View>
                    {job.totalAmount > 0 && <Text style={styles.jobAmount}>₦{job.totalAmount.toLocaleString()}</Text>}
                  </View>
                  {job.notes ? <Text style={styles.jobNotes} numberOfLines={2}>{job.notes}</Text> : null}
                  {job.status === 'PENDING' && (
                    <View style={styles.jobActions}>
                      <TouchableOpacity style={styles.declineBtn} onPress={() => handleJobAction(job.id, 'CANCELLED')}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => handleJobAction(job.id, 'ACCEPTED')}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  earningsCard: { margin: 16, backgroundColor: COLORS.accent, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  earningsValue: { color: '#fff', fontSize: 28, fontWeight: '700' },
  earningsSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  earningsIcon: { opacity: 0.8 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 12, alignItems: 'center', padding: 10, gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, color: COLORS.sub },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  actionCard: { width: '47%', backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.sub, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabBadge: { backgroundColor: COLORS.border, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: COLORS.primary },
  tabBadgeText: { fontSize: 10, color: COLORS.sub, fontWeight: '600' },
  tabBadgeTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 15, color: COLORS.sub, marginTop: 10 },
  jobCard: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, marginBottom: 12 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  jobAvatarWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  jobCategory: { fontSize: 12, color: COLORS.sub },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  jobMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.sub },
  jobAmount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  jobNotes: { fontSize: 12, color: COLORS.sub, marginBottom: 8, fontStyle: 'italic' },
  jobActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  declineBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  acceptBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
