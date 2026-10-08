import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCustomerProfile, updateCustomerProfile } from '../../src/api/profile';
import { useAuthStore } from '../../src/store/authStore';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { theme } from '../../src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const setAuthUser = useAuthStore((s) => s.setUser);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('Karachi');
  const [sector, setSector] = useState('');
  const [nearArea, setNearArea] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getCustomerProfile();
        if (res.data) {
          const p = res.data;
          setName(p.name || '');
          setMobile(p.mobile || '');
          setAddress(p.address || '');
          setAddress2(p.address2 || '');
          setCity(p.city || 'Karachi');
          setSector(p.sector || '');
          setNearArea(p.near_area || '');
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Could not load profile details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateCustomerProfile({
        name: name.trim(),
        mobile: mobile.trim() || undefined,
        address: address.trim() || undefined,
        address2: address2.trim() || undefined,
        city: city.trim() || 'Karachi',
        sector: sector.trim() || undefined,
        near_area: nearArea.trim() || undefined,
      });

      if (res.data) {
        const updated = res.data;
        // Update local auth store
        setAuthUser({
          id: updated.id,
          name: updated.name,
          email: updated.email,
          mobile: updated.mobile,
          address: updated.address,
          city: updated.city,
          role: 'customer',
        });

        Alert.alert('Profile Updated', 'Your profile details have been saved successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <Header title="Edit Profile" showBack onBack={() => router.back()} />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <Input
              label="Full Name"
              placeholder="e.g. Muhammad Ali"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Mobile Number"
              placeholder="03001234567"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>

            <Input
              label="Address Line 1"
              placeholder="House #, Street name"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label="Address Line 2 (Optional)"
              placeholder="Apartment, Floor, Landmark"
              value={address2}
              onChangeText={setAddress2}
            />

            <Input
              label="Sector / Area (Baldia Town)"
              placeholder="e.g. 5-J, 4-F, Saeedabad"
              value={sector}
              onChangeText={setSector}
            />

            <Input
              label="Near Landmark (Optional)"
              placeholder="e.g. Near Bilal Masjid, Chandni Chowk"
              value={nearArea}
              onChangeText={setNearArea}
            />

            <Input
              label="City"
              placeholder="Karachi"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <Button
            title={isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveBtn}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    padding: theme.spacing.screen,
    gap: theme.spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  saveBtn: {
    marginTop: theme.spacing.sm,
  },
});
