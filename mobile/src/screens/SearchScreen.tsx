import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const COLORS = { primary: '#1B8B4D', accent: '#F97316', bg: '#F9FAFB', text: '#333', sub: '#666', border: '#E5E7EB' };

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { id: 'carpentry', label: 'Carpentry', icon: 'hammer-outline' },
  { id: 'mechanics', label: 'Mechanics', icon: 'car-outline' },
  { id: 'painting', label: 'Painting', icon: 'brush-outline' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
  { id: 'ac_repair', label: 'AC Repair', icon: 'thermometer-outline' },
];

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  hourlyRate: number;
  isVerified: boolean;
  yearsExperience: number;
}

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [results, setResults] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const params: any = {};
      if (query.trim()) params.query = query.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (minRating > 0) params.minRating = minRating;
      const res = await api.get('/technicians/search', { params });
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearched(true);
    }
  }, [query, selectedCategory, minRating]);

  const renderStar = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={12} color={COLORS.accent} />
    ));
  };

  const renderTechnician = ({ item }: { item: Technician }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TechnicianProfile', { technicianId: item.id })}>
      <View style={styles.cardAvatar}>
        <Text style={styles.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.firstName} {item.lastName}</Text>
          {item.isVerified && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />}
        </View>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.ratingRow}>{renderStar(item.rating)}<Text style={styles.ratingText}> {item.rating?.toFixed(1)} ({item.reviewCount})</Text></View>
        <View style={styles.cardFooter}>
          <View style={styles.infoChip}><Ionicons name="location-outline" size={12} color={COLORS.sub} /><Text style={styles.chipText}>{item.location}</Text></View>
          <Text style={styles.rate}>₦{item.hourlyRate?.toLocaleString()}/hr</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Technician</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.sub} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or skill..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.sub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons name={item.icon as any} size={14} color={selectedCategory === item.id ? '#fff' : COLORS.primary} />
            <Text style={[styles.categoryLabel, selectedCategory === item.id && styles.categoryLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Rating Filter */}
      <View style={styles.ratingFilter}>
        <Text style={styles.filterLabel}>Min Rating:</Text>
        {[0, 3, 4, 5].map((r) => (
          <TouchableOpacity key={r} style={[styles.ratingBtn, minRating === r && styles.ratingBtnActive]} onPress={() => setMinRating(r)}>
            <Text style={[styles.ratingBtnText, minRating === r && styles.ratingBtnTextActive]}>{r === 0 ? 'Any' : `${r}+`}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderTechnician}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => doSearch(true)} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            searched ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No technicians found</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters</Text>
              </View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="people-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>Search for technicians</Text>
                <Text style={styles.emptySubText}>Use the search bar above to find skilled professionals</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, backgroundColor: COLORS.primary },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  categoryList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4, marginRight: 8 },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  categoryLabelActive: { color: '#fff' },
  ratingFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterLabel: { fontSize: 13, color: COLORS.sub, fontWeight: '500' },
  ratingBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  ratingBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ratingBtnText: { fontSize: 12, color: COLORS.sub },
  ratingBtnTextActive: { color: '#fff' },
  searchBtn: { marginLeft: 'auto', backgroundColor: COLORS.accent, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardCategory: { fontSize: 12, color: COLORS.sub, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingText: { fontSize: 11, color: COLORS.sub },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chipText: { fontSize: 11, color: COLORS.sub },
  rate: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: COLORS.sub, textAlign: 'center', marginTop: 4 },
});
