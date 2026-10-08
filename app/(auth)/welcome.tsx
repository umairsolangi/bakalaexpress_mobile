import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/theme';
import { Config } from '../../src/config';
import { BrandLogo } from '../../src/components/BrandLogo';

const RIDER_3D_IMG = require('../../assets/images/welcome-rider-3d.jpg');
const GROCERY_BAG_3D_IMG = require('../../assets/images/welcome-grocery-bag-3d.jpg');
const IC_PIN = require('../../assets/images/welcome-ic-pin.png');

interface SlideData {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  tag: string;
}

const SLIDES: SlideData[] = [
  {
    id: 'slide-1',
    image: RIDER_3D_IMG,
    title: 'Fast Delivery, Fresh Groceries',
    subtitle: 'Get your groceries delivered quickly and fresh, right to your doorstep.',
    tag: '⚡ 20-30 Min Delivery',
  },
  {
    id: 'slide-2',
    image: GROCERY_BAG_3D_IMG,
    title: 'Everything You Need',
    subtitle: 'Get your groceries delivered fresh and safely, straight to your doorstep.',
    tag: '🌿 100% Fresh & Authentic',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [activeSlide, setActiveSlide] = useState(0);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [partnerType, setPartnerType] = useState<'seller' | 'rider'>('seller');
  const [authChoiceVisible, setAuthChoiceVisible] = useState(false);

  const isCompactScreen = screenHeight < 720;
  const isTallScreen = screenHeight > 820;

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGuest = () => {
    setGuest(true);
    router.replace('/(tabs)' as any);
  };

  const openPartnerPortal = (type: 'seller' | 'rider') => {
    setPartnerType(type);
    setPartnerModalVisible(true);
  };

  const currentSlide = SLIDES[activeSlide];

  const imageSize = Math.min(
    Math.round(screenWidth * 0.76),
    isCompactScreen ? 230 : isTallScreen ? 310 : 270
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* ============================================================== */}
        {/* Top Header Bar                                                 */}
        {/* ============================================================== */}
        <View style={styles.headerBar}>
          {/* Location Chip */}
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

          {/* Partner Portal Pill */}
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
        {/* Hero Illustration & Carousel Copy                             */}
        {/* ============================================================== */}
        <View style={styles.heroSection}>
          {/* 3D Visual Illustration with smooth rounded container */}
          <View
            style={[
              styles.imageContainer,
              { width: imageSize, height: imageSize },
            ]}
          >
            <Image
              source={currentSlide.image}
              style={styles.heroImage}
              contentFit="contain"
              transition={350}
            />
          </View>

          {/* Feature Badge Tag */}
          <View style={styles.featureBadge}>
            <Text style={styles.featureBadgeText}>{currentSlide.tag}</Text>
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.titleText,
                isCompactScreen && styles.titleTextCompact,
              ]}
            >
              {currentSlide.title}
            </Text>
            <Text
              style={[
                styles.subtitleText,
                isCompactScreen && styles.subtitleTextCompact,
              ]}
            >
              {currentSlide.subtitle}
            </Text>
          </View>

          {/* Carousel Pagination Capsule Indicators */}
          <View style={styles.paginationRow}>
            {SLIDES.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <TouchableOpacity
                  key={slide.id}
                  onPress={() => setActiveSlide(index)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  style={[
                    styles.paginationDot,
                    isActive ? styles.paginationActiveCapsule : styles.paginationInactiveDot,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* ============================================================== */}
        {/* Action Buttons (Matches Behance Layout)                       */}
        {/* ============================================================== */}
        <View style={styles.actionsSection}>
          {/* 1. Primary Solid Green Action */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setAuthChoiceVisible(true)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Log in or Sign up"
          >
            <Text style={styles.primaryBtnText}>Log in or Sign up</Text>
          </TouchableOpacity>

          {/* 2. Secondary Outlined Action */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleGuest}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Explore Bakala Express"
          >
            <Text style={styles.secondaryBtnText}>Explore Bakala Express</Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* Footer Links: Partner With Us & Admin Portal                   */}
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
      {/* Quick Auth Choice Modal (Log In / Create Account)              */}
      {/* ============================================================== */}
      <Modal
        visible={authChoiceVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthChoiceVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAuthChoiceVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Welcome to Bakala Express</Text>
                <Text style={styles.modalSubtitle}>
                  Order fresh groceries directly from neighborhood shops
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAuthChoiceVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.authChoicesWrap}>
              <TouchableOpacity
                style={styles.authChoicePrimaryBtn}
                onPress={() => {
                  setAuthChoiceVisible(false);
                  router.push({
                    pathname: '/(auth)/login' as any,
                    params: { role: 'customer' },
                  });
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.authChoicePrimaryText}>Sign In with Email</Text>
                <Text style={styles.choiceArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authChoiceSecondaryBtn}
                onPress={() => {
                  setAuthChoiceVisible(false);
                  router.push('/(auth)/register' as any);
                }}
                activeOpacity={0.84}
              >
                <Text style={styles.authChoiceSecondaryText}>Create New Account</Text>
                <Text style={styles.choiceArrowSecondary}>→</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
            <View style={styles.modalDragHandle} />

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
                <View style={[styles.modalRoleInfoCard, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}>
                  <Text style={[styles.modalRoleTitle, { color: '#C2410C' }]}>Deliver Orders &amp; Earn Reliably</Text>
                  <Text style={[styles.modalRoleDesc, { color: '#EA580C' }]}>
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
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
  },

  // -------------------------------------------------------------
  // Header Bar
  // -------------------------------------------------------------
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#C7E8D4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pinIcon: {
    width: 13,
    height: 16,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#157B42',
    letterSpacing: -0.2,
  },
  chevronIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#157B42',
    marginTop: -2,
  },
  partnersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
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
    fontSize: 13,
  },
  partnersPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // -------------------------------------------------------------
  // Hero Carousel Section
  // -------------------------------------------------------------
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  imageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#157B42',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featureBadge: {
    backgroundColor: '#FFF3EC',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6A1A',
    letterSpacing: -0.2,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleTextCompact: {
    fontSize: 20,
    lineHeight: 25,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#575757',
    textAlign: 'center',
    maxWidth: 320,
  },
  subtitleTextCompact: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationActiveCapsule: {
    width: 32,
    backgroundColor: '#157B42',
  },
  paginationInactiveDot: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },

  // -------------------------------------------------------------
  // Action Buttons
  // -------------------------------------------------------------
  actionsSection: {
    width: '100%',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#157B42',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#157B42',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#157B42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#157B42',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // -------------------------------------------------------------
  // Footer Links
  // -------------------------------------------------------------
  footerSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  partnerPrefixText: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#157B42',
    textDecorationLine: 'underline',
  },
  partnerPipe: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  adminTouch: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  adminText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // -------------------------------------------------------------
  // Modals
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
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#575757',
    maxWidth: 270,
    lineHeight: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  authChoicesWrap: {
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  authChoicePrimaryBtn: {
    height: 50,
    backgroundColor: '#157B42',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  authChoicePrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  choiceArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  authChoiceSecondaryBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#157B42',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  authChoiceSecondaryText: {
    color: '#157B42',
    fontSize: 15,
    fontWeight: '700',
  },
  choiceArrowSecondary: {
    color: '#157B42',
    fontSize: 18,
    fontWeight: '700',
  },
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
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
    fontWeight: '600',
    color: '#6B7280',
  },
  modalTabTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  modalRoleContent: {
    gap: 10,
  },
  modalRoleInfoCard: {
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#C7E8D4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  modalRoleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#157B42',
    marginBottom: 4,
  },
  modalRoleDesc: {
    fontSize: 12,
    color: '#0D582E',
    lineHeight: 17,
  },
  modalActionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: {
    backgroundColor: '#157B42',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  modalSecondaryBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
