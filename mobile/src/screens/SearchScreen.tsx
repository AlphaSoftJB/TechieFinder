import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function SearchScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(route.params?.category || '');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (category) {
      searchTechnicians();
    }
  }, [category]);

  const searchTechnicians = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category) params.category = category;
      if (location) params.location = location;
      if (minRating) params.minRating = minRating;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/technicians/available', { params });
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error searching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTechnicianCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.technicianCard}
      onPress={() => navigation.navigate('TechnicianProfile', { technicianId: item.id })}
    >
      <View style={styles.technicianImage}>
        <Ionicons name="person" size={40} color="#1B8B4D" />
      </View>
      <View style={styles.technicianInfo}>
        <View style={styles.technicianHeader}>
          <Text style={styles.technicianName}>
            {item.firstName} {item.lastName}
          </Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1B8B4D" />
          )}
        </View>
        <Text style={styles.technicianBio} numberOfLines={2}>
          {item.bio || 'Professional technician'}
        </Text>
        <View style={styles.technicianMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{item.averageRating?.toFixed(1) || '5.0'}</Text>
          </View>
          <Text style={styles.experience}>{item.yearsOfExperience || 0} years exp</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Technicians</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchTechnicians}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={searchTechnicians}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Category (e.g., Plumbing)"
            value={category}
            onChangeText={setCategory}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Min Rating (0-5)"
            value={minRating}
            onChangeText={setMinRating}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B8B4D" />
        </View>
      ) : technicians.length > 0 ? (
        <FlatList
          data={technicians}
          renderItem={renderTechnicianCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No technicians found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search filters</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  searchButton: {
    paddingHorizontal: 20,
    height: 50,
    backgroundColor: '#1B8B4D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterInput: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    fontSize: 14,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  technicianCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  technicianImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  technicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  technicianBio: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  technicianMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  experience: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
