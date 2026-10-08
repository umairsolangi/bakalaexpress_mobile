import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/theme';
import { Config } from '../../src/config';
import { BrandLogo } from '../../src/components/BrandLogo';

const HERO_BAG_IMG = require('../../assets/images/welcome-hero-bag-feathered.png');
const SKYLINE_BG_IMG = require('../../assets/images/welcome-skyline-clean.png');
const IC_FRESH = require('../../assets/images/welcome-ic-fresh.png');
const IC_STORES = require('../../assets/images/welcome-ic-stores.png');
const IC_DELIVERY = require('../../assets/images/welcome-ic-delivery.png');
const IC_PIN = require('../../assets/images/welcome-ic-pin.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Partner selection modal state (Shop / Rider)
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [partnerType, setPartnerType] = useState<'seller' | 'rider'>('seller');

  const isCompactScreen = screenHeight < 720;
  const isTallScreen = screenHeight > 820;

  const handleGuest = () => {
    setGuest(true);
    router.replace('/(tabs)' as any);
  };

  const openPartnerPortal = (type: 'seller' | 'rider') => {
    setPartnerType(type);
    setPartnerModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Background Karachi landmark & green waves watermark at bottom */}
      <View style={styles.backgroundDecorativeWrap} pointerEvents="none">
        <Image
          source={SKYLINE_BG_IMG}
          style={styles.skylineBackground}
          contentFit="cover"
        />
      </View>

      <View style={styles.container}>
        {/* ============================================================== */}
        {/* Top Header Navigation Bar                                      */}
        {/* ============================================================== */}
        <View style={styles.headerBar}>
          {/* Location Pill (Baldia Town, Karachi) */}
          <TouchableOpacity
            style={styles.locationPill}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Current delivery location Baldia Town Karachi"
          >
            <Image source={IC_PIN} style={styles.pinIcon} contentFit="contain" />
            <Text style={styles.locationPillText}>Baldia Town, Karachi</Text>
            <Text style={styles.chevronIcon}>⌄</Text>
          </TouchableOpacity>

          {/* Partners Pill Dropdown */}
          <TouchableOpacity
            style={styles.partnersPill}
            onPress={() => openPartnerPortal('seller')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Partner portal for store owners and riders"
          >
            <Text style={styles.handshakeEmoji}>🤝</Text>
            <Text style={styles.partnersPillText}>Partners</Text>
            <Text style={styles.chevronIcon}>⌄</Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* Hero Section (Left copy & Badges + Right Grocery Visual)       */}
        {/* ============================================================== */}
        <View style={[styles.heroContainer, isCompactScreen && styles.heroContainerCompact]}>
          {/* Right Floating Visual: Tote bag with vegetables, bread, milk & arch */}
          <View
            style={[
              styles.heroVisualWrap,
              {
                width: Math.min(Math.round(screenWidth * 0.52), 240),
                height: isCompactScreen ? 270 : isTallScreen ? 340 : 310,
              },
            ]}
            pointerEvents="none"
          >
            <Image
              source={HERO_BAG_IMG}
              style={styles.heroVisualImage}
              contentFit="contain"
              contentPosition="right bottom"
            />
          </View>

          {/* Left Hero Content Area */}
          <View style={styles.heroLeftContent}>
            {/* Brand Logo */}
            <View style={styles.logoWrap}>
              <BrandLogo
                variant="full"
                width={isCompactScreen ? 148 : 172}
              />
            </View>

            {/* Headline */}
            <View style={styles.headlineWrap}>
              <Text style={[styles.headlineDark, isCompactScreen && styles.headlineDarkCompact]}>
                Your Local Store,
              </Text>
              <Text style={[styles.headlineGreen, isCompactScreen && styles.headlineGreenCompact]}>
                Delivered Fast
              </Text>
            </View>

            {/* Subtitle */}
            <Text
              style={[
                styles.subtitleText,
                isCompactScreen && styles.subtitleTextCompact,
              ]}
              numberOfLines={4}
            >
              Fresh groceries, fruits, dairy &amp; daily essentials from your nearby shops — at your doorstep.
            </Text>

            {/* 3 Value Badges: 100% Fresh | Local Stores | Fast Delivery */}
            <View style={styles.badgesRow}>
              {/* Badge 1: 100% Fresh */}
              <View style={styles.badgeItem}>
                <Image source={IC_FRESH} style={styles.badgeSquircleIcon} contentFit="contain" />
                <Text style={styles.badgeTitle}>100%</Text>
                <Text style={styles.badgeSubtitle}>Fresh</Text>
              </View>

              <View style={styles.badgeDivider} />

              {/* Badge 2: Local Stores */}
              <View style={styles.badgeItem}>
                <Image source={IC_STORES} style={styles.badgeSquircleIcon} contentFit="contain" />
                <Text style={styles.badgeTitle}>Local</Text>
                <Text style={styles.badgeSubtitle}>Stores</Text>
              </View>

              <View style={styles.badgeDivider} />

              {/* Badge 3: Fast Delivery */}
              <View style={styles.badgeItem}>
                <Image source={IC_DELIVERY} style={styles.badgeSquircleIcon} contentFit="contain" />
                <Text style={styles.badgeTitle}>Fast</Text>
                <Text style={styles.badgeSubtitle}>Delivery</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* Action Buttons Section (3 Full Width Capsules)                 */}
        {/* ============================================================== */}
        <View style={styles.actionButtonsSection}>
          {/* 1. Primary Action: Sign In to Order */}
          <TouchableOpacity
            style={styles.primarySignInBtn}
            onPress={() =>
              router.push({
                pathname: '/(auth)/login' as any,
                params: { role: 'customer' },
              })
            }
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Sign In to Order"
          >
            <Text style={styles.primarySignInText}>Sign In to Order</Text>
            <View style={styles.primaryArrowCircle}>
              <Text style={styles.primaryArrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* 2. Secondary Action: New Customer? Create Account */}
          <TouchableOpacity
            style={styles.secondaryRegisterBtn}
            onPress={() => router.push('/(auth)/register' as any)}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="New Customer? Create Account"
          >
            <Text style={styles.secondaryRegisterText}>
              New Customer? Create Account
            </Text>
            <Text style={styles.secondaryArrowText}>→</Text>
          </TouchableOpacity>

          {/* 3. Guest Action: Explore Products as Guest */}
          <TouchableOpacity
            style={styles.guestExploreBtn}
            onPress={handleGuest}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Explore Products as Guest"
          >
            <Text style={styles.guestLeafIcon}>🌿</Text>
            <Text style={styles.guestExploreText}>Explore Products as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* Footer Links: Partner with us & Admin Portal                   */}
        {/* ============================================================== */}
        <View style={styles.footerSection}>
          <View style={styles.partnerRow}>
            <Text style={styles.partnerPrefixText}>Partner with us:</Text>

            <TouchableOpacity
              style={styles.partnerLinkTouch}
              onPress={() => openPartnerPortal('seller')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.partnerLinkIcon}>🏪</Text>
              <Text style={styles.partnerLinkText}>Store Owner</Text>
            </TouchableOpacity>

            <Text style={styles.partnerPipe}>|</Text>

            <TouchableOpacity
              style={styles.partnerLinkTouch}
              onPress={() => openPartnerPortal('rider')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.partnerLinkIcon}>🛵</Text>
              <Text style={styles.partnerLinkText}>Rider</Text>
            </TouchableOpacity>
          </View>

          {Config.enableAdminLogin && (
            <TouchableOpacity
              style={styles.adminTouch}
              onPress={() =>
                router.push({
                  pathname: '/(auth)/login' as any,
                  params: { role: 'admin' },
                })
              }
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={styles.adminText}>⚙️ Admin Portal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ============================================================== */}
      {/* Partner Access Bottom Sheet Modal                              */}
      {/* ============================================================== */}
      <Modal
        visible={partnerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPartnerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPartnerModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Drag Indicator */}
            <View style={styles.modalDragHandle} />

            {/* Modal Title & Close */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Partner Portal</Text>
                <Text style={styles.modalSubtitle}>
                  Access your merchant dashboard or rider partner account
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPartnerModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Partner Tabs */}
            <View style={styles.modalTabRow}>
              <TouchableOpacity
                style={[
                  styles.modalTabBtn,
                  partnerType === 'seller' && styles.modalTabBtnActive,
                ]}
                onPress={() => setPartnerType('seller')}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    partnerType === 'seller' && styles.modalTabTextActive,
                  ]}
                >
                  🏪 Store Owner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalTabBtn,
                  partnerType === 'rider' && styles.modalTabBtnActive,
                ]}
                onPress={() => setPartnerType('rider')}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    partnerType === 'rider' && styles.modalTabTextActive,
                  ]}
                >
                  🛵 Delivery Rider
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Specific Content */}
            {partnerType === 'seller' ? (
              <View style={styles.modalRoleContent}>
                <View style={styles.modalRoleInfoCard}>
                  <Text style={styles.modalRoleTitle}>Grow Your Neighborhood Shop</Text>
                  <Text style={styles.modalRoleDesc}>
                    Digitize your grocery store, manage your product inventory, and receive orders directly from local Baldia Town customers.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalPrimaryBtn]}
                  onPress={() => {
                    setPartnerModalVisible(false);
                    router.push({
                      pathname: '/(auth)/login' as any,
                      params: { role: 'seller' },
                    });
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Sign In to Store Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSecondaryBtn]}
                  onPress={() => {
                    setPartnerModalVisible(false);
                    router.push('/(auth)/seller-register' as any);
                  }}
                >
                  <Text style={styles.modalSecondaryBtnText}>Register New Shop Partner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalRoleContent}>
                <View style={[styles.modalRoleInfoCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.modalRoleTitle, { color: '#92400E' }]}>Deliver Orders &amp; Earn Reliably</Text>
                  <Text style={[styles.modalRoleDesc, { color: '#B45309' }]}>
                    Enjoy flexible working hours, local delivery routes in Baldia Town, and transparent weekly payouts.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalPrimaryBtn]}
                  onPress={() => {
                    setPartnerModalVisible(false);
                    router.push({
                      pathname: '/(auth)/login' as any,
                      params: { role: 'rider' },
                    });
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Sign In as Rider Partner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSecondaryBtn]}
                  onPress={() => {
                    setPartnerModalVisible(false);
                    router.push('/(auth)/rider-register' as any);
                  }}
                >
                  <Text style={styles.modalSecondaryBtnText}>Apply as Delivery Rider</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F1',
  },
  backgroundDecorativeWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 0,
  },
  skylineBackground: {
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    zIndex: 1,
  },

  // -------------------------------------------------------------
  // Header Bar
  // -------------------------------------------------------------
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 6 : 2,
    paddingBottom: 4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF6EE',
    borderWidth: 1,
    borderColor: '#CBE5D2',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pinIcon: {
    width: 13,
    height: 16,
  },
  locationPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0D3820',
    letterSpacing: -0.2,
  },
  chevronIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D3820',
    marginTop: -2,
  },
  partnersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 6,
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  handshakeEmoji: {
    fontSize: 14,
  },
  partnersPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },

  // -------------------------------------------------------------
  // Hero Container
  // -------------------------------------------------------------
  heroContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  heroContainerCompact: {
    paddingVertical: 2,
  },
  heroVisualWrap: {
    position: 'absolute',
    right: -16,
    top: 8,
    bottom: 4,
    zIndex: 1,
  },
  heroVisualImage: {
    width: '100%',
    height: '100%',
  },
  heroLeftContent: {
    width: '56%',
    zIndex: 2,
    alignItems: 'flex-start',
  },
  logoWrap: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  headlineWrap: {
    marginBottom: 8,
  },
  headlineDark: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headlineDarkCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  headlineGreen: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    color: '#128045',
    letterSpacing: -0.5,
  },
  headlineGreenCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  subtitleText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4B5563',
    marginBottom: 16,
    fontWeight: '400',
  },
  subtitleTextCompact: {
    fontSize: 11.5,
    lineHeight: 15.5,
    marginBottom: 10,
  },

  // -------------------------------------------------------------
  // Feature Badges
  // -------------------------------------------------------------
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 4,
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  badgeSquircleIcon: {
    width: 38,
    height: 38,
    marginBottom: 5,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 3,
  },

  // -------------------------------------------------------------
  // Action Buttons
  // -------------------------------------------------------------
  actionButtonsSection: {
    width: '100%',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 2,
    zIndex: 2,
  },
  primarySignInBtn: {
    height: 54,
    backgroundColor: '#104928',
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#104928',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primarySignInText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: -0.2,
  },
  primaryArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#277947',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryArrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  secondaryRegisterBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#104928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  secondaryRegisterText: {
    color: '#104928',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryArrowText: {
    position: 'absolute',
    right: 20,
    color: '#104928',
    fontSize: 18,
    fontWeight: '600',
  },
  guestExploreBtn: {
    height: 48,
    backgroundColor: '#EAF5EC',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestLeafIcon: {
    fontSize: 16,
  },
  guestExploreText: {
    color: '#104928',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // -------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------
  footerSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
    zIndex: 2,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  partnerPrefixText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  partnerLinkTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  partnerLinkIcon: {
    fontSize: 13,
  },
  partnerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#104928',
    textDecorationLine: 'underline',
  },
  partnerPipe: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 3,
  },
  adminTouch: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  adminText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },

  // -------------------------------------------------------------
  // Partner Modal Styles
  // -------------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalDragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    maxWidth: 270,
    lineHeight: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: '#64748B',
  },
  modalTabTextActive: {
    color: '#0F172A',
    fontWeight: theme.fontWeight.bold,
  },
  modalRoleContent: {
    gap: 10,
  },
  modalRoleInfoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  modalRoleTitle: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: '#166534',
    marginBottom: 4,
  },
  modalRoleDesc: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 17,
  },
  modalActionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: {
    backgroundColor: '#104928',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  modalSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modalSecondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
  },
});
