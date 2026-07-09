import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  plumbing: { icon: 'water', color: '#3B82F6' },
  electrical: { icon: 'flash', color: '#F59E0B' },
  carpentry: { icon: 'hammer', color: '#8B5CF6' },
  'auto-mechanic': { icon: 'car', color: '#EF4444' },
  hvac: { icon: 'snow', color: '#6366F1' },
  painting: { icon: 'color-palette', color: '#10B981' },
  welding: { icon: 'flame', color: '#F97316' },
  cleaning: { icon: 'sparkles', color: '#06B6D4' },
  'appliance-repair': { icon: 'build', color: '#0EA5E9' },
  'generator-repair': { icon: 'battery-charging', color: '#DC2626' },
};
const DEFAULT_CATEGORY_STYLE = { icon: 'construct', color: '#1B8B4D' };

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredTechnicians, setFeaturedTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      const [categoriesResponse, techniciansResponse] = await Promise.all([
        api.get('/public/categories'),
        api.get('/technicians/recommended', { params: { limit: 5 } }),
      ]);
      setCategories(categoriesResponse.data);
      setFeaturedTechnicians(techniciansResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading home screen data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHome();
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate('Search', { categorySlug: category.slug, categoryName: category.name });
  };

  const handleTechnicianPress = (technician: any) => {
    navigation.navigate('TechnicianProfile', { technicianId: technician.id });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B8B4D']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'User'}! 👋</Text>
          <Text style={styles.subtitle}>Find skilled technicians near you</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchPlaceholder}>Search for services...</Text>
        <Ionicons name="options-outline" size={20} color="#666" />
      </TouchableOpacity>

      {/* Service Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const style = CATEGORY_ICONS[category.slug] || DEFAULT_CATEGORY_STYLE;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: style.color + '20' }]}>
                  <Ionicons name={style.icon as any} size={28} color={style.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Featured Technicians */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Technicians</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1B8B4D" />
          </View>
        ) : featuredTechnicians.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.techniciansList}
          >
            {featuredTechnicians.map((technician) => (
              <TouchableOpacity
                key={technician.id}
                style={styles.technicianCard}
                onPress={() => handleTechnicianPress(technician)}
              >
                <View style={styles.technicianImage}>
                  <Ionicons name="person" size={40} color="#1B8B4D" />
                </View>
                <View style={styles.technicianInfo}>
                  <Text style={styles.technicianName} numberOfLines={1}>
                    {technician.firstName} {technician.lastName}
                  </Text>
                  <Text style={styles.technicianService} numberOfLines={1}>
                    {technician.bio || 'Professional Technician'}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.rating}>{Number(technician.rating || 0).toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({technician.totalRatings || 0})</Text>
                  </View>
                  {technician.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#1B8B4D" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No featured technicians available</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Search')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="search" size={24} color="#1B8B4D" />
            </View>
            <Text style={styles.quickActionText}>Find Technician</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color="#F97316" />
            </View>
            <Text style={styles.quickActionText}>My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="person" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#1B8B4D',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  categoryCard: {
    width: '23%',
    margin: '1%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  techniciansList: {
    paddingHorizontal: 20,
  },
  technicianCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  technicianImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianInfo: {
    padding: 12,
  },
  technicianName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  technicianService: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 11,
    color: '#1B8B4D',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});
