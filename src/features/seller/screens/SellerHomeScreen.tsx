import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../store/authStore';
import {
  SellerProfile,
  SellerDashboardData,
  SellerOrderShortItem,
  SellerListingItem,
  SellerAvailableProductItem,
  SellerOperatingHoursData,
  SellerVerificationStatusData,
} from '../../../api/types';
import {
  getSellerDashboard,
  getSellerOrders,
  confirmSellerOrder,
  prepareSellerOrder,
  readySellerOrder,
  rejectSellerOrder,
  completeSellerOrder,
  getSellerOperatingHours,
  updateSellerOperatingHours,
  getSellerCatalogListings,
  getSellerAvailableCatalog,
  importSellerCatalogProducts,
  updateSellerListing,
  getSellerVerificationStatus,
  submitSellerVerification,
} from '../../../api/seller';
import { theme } from '../../../theme';
import { t } from '../../../i18n';

type SellerTab = 'orders' | 'catalog' | 'hours' | 'verification';
type OrderFilter = 'pending' | 'preparing' | 'ready' | 'active' | 'completed' | 'all';

export const SellerHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user) as SellerProfile | null;

  const [activeTab, setActiveTab] = useState<SellerTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard Data
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [isOpenState, setIsOpenState] = useState<boolean>(user?.is_open ?? false);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<SellerOrderShortItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Catalog State
  const [listings, setListings] = useState<SellerListingItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Operating Hours State
  const [operatingHours, setOperatingHours] = useState<SellerOperatingHoursData | null>(null);
  const [opensAtInput, setOpensAtInput] = useState('09:00');
  const [closesAtInput, setClosesAtInput] = useState('23:00');
  const [isSavingHours, setIsSavingHours] = useState(false);

  // Verification State
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatusData | null>(null);
  const [bizDesc, setBizDesc] = useState('');
  const [verifReason, setVerifReason] = useState('');
  const [verifDocs, setVerifDocs] = useState<string[]>([]);
  const [isSubmittingVerif, setIsSubmittingVerif] = useState(false);

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [orderToReject, setOrderToReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Edit Listing Modal
  const [editListingModalVisible, setEditListingModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SellerListingItem | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);

  // Import Catalog Modal State
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<SellerAvailableProductItem[]>([]);
  const [selectedProductIdsToImport, setSelectedProductIdsToImport] = useState<number[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  const openImportModal = async () => {
    setImportModalVisible(true);
    setIsLoadingAvailable(true);
    setSelectedProductIdsToImport([]);
    try {
      const res = await getSellerAvailableCatalog({ page: 1, per_page: 60 });
      if (res.data) {
        setAvailableProducts(res.data);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load available products.');
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIdsToImport((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleConfirmImport = async () => {
    if (selectedProductIdsToImport.length === 0) {
      Alert.alert('No Selection', 'Please select at least one product to import.');
      return;
    }
    setIsSubmittingImport(true);
    try {
      const res = await importSellerCatalogProducts({
        global_product_ids: selectedProductIdsToImport,
      });
      setImportModalVisible(false);
      Alert.alert(
        'Import Successful',
        `${res.data.imported_count} products have been added to your shop catalog.`
      );
      loadCatalog();
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Could not import products.');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // 1. Fetch Dashboard & Verification Status
  const loadDashboard = useCallback(async () => {
    try {
      const [dashRes, verifRes] = await Promise.all([
        getSellerDashboard(),
        getSellerVerificationStatus().catch(() => null),
      ]);
      if (dashRes.data) {
        setDashboard(dashRes.data);
        setIsOpenState(dashRes.data.store.is_open);
      }
      if (verifRes && verifRes.data) {
        setVerificationStatus(verifRes.data);
      }
    } catch (e) {
      console.warn('[SellerHomeScreen] loadDashboard error:', e);
    }
  }, []);

  // 2. Fetch Orders according to filter
  const loadOrders = useCallback(async (filter = orderFilter) => {
    setIsLoadingOrders(true);
    try {
      const apiFilter = filter === 'active' ? 'all' : filter === 'all' ? undefined : filter;
      const res = await getSellerOrders(apiFilter, 1, 30);
      if (res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.warn('[SellerHomeScreen] loadOrders error:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [orderFilter]);

  // 3. Fetch Catalog Listings
  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await getSellerCatalogListings({ page: 1, per_page: 50 });
      if (res.data) {
        setListings(res.data);
      }
    } catch (e) {
      console.warn('[SellerHomeScreen] loadCatalog error:', e);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // 4. Fetch Operating Hours
  const loadOperatingHours = useCallback(async () => {
    try {
      const res = await getSellerOperatingHours();
      if (res.data) {
        setOperatingHours(res.data);
        if (res.data.opens_at) setOpensAtInput(res.data.opens_at);
        if (res.data.closes_at) setClosesAtInput(res.data.closes_at);
      }
    } catch (e) {
      console.warn('[SellerHomeScreen] loadOperatingHours error:', e);
    }
  }, []);

  // Initial Data Load & 15-second Auto Poll
  useEffect(() => {
    loadDashboard();
    loadOrders('pending');
    loadOperatingHours();
    loadCatalog();

    const interval = setInterval(() => {
      loadDashboard();
      if (activeTab === 'orders') {
        loadOrders(orderFilter);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Filter change handler
  const handleFilterChange = (filter: OrderFilter) => {
    setOrderFilter(filter);
    loadOrders(filter);
  };

  // Pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadDashboard(),
      loadOrders(orderFilter),
      loadCatalog(),
      loadOperatingHours(),
    ]);
    setIsRefreshing(false);
  };

  // Toggle Store Open / Close
  const handleToggleStoreOpen = async (newVal: boolean) => {
    setIsTogglingOpen(true);
    setIsOpenState(newVal);
    try {
      await updateSellerOperatingHours({ is_open: newVal });
      await loadDashboard();
    } catch (e: any) {
      setIsOpenState(!newVal);
      Alert.alert('Status Update Failed', e.message || 'Could not update open status.');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  // Order Action: Confirm
  const handleConfirmOrder = async (orderId: number) => {
    try {
      await confirmSellerOrder(orderId);
      Alert.alert('Order Confirmed', `Order #${orderId} has been confirmed.`);
      loadDashboard();
      loadOrders(orderFilter);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not confirm order.');
    }
  };

  // Order Action: Start Preparing
  const handlePrepareOrder = async (orderId: number) => {
    try {
      await prepareSellerOrder(orderId);
      Alert.alert('In Preparation', `Order #${orderId} is now being prepared.`);
      loadDashboard();
      loadOrders(orderFilter);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not update order status.');
    }
  };

  // Order Action: Mark Ready for Pickup
  const handleReadyOrder = async (orderId: number) => {
    try {
      await readySellerOrder(orderId);
      Alert.alert('Ready for Rider', `Order #${orderId} is ready for pickup.`);
      loadDashboard();
      loadOrders(orderFilter);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not mark order ready.');
    }
  };

  // Order Action: Complete
  const handleCompleteOrder = async (orderId: number) => {
    try {
      await completeSellerOrder(orderId);
      Alert.alert('Order Completed', `Order #${orderId} marked as completed.`);
      loadDashboard();
      loadOrders(orderFilter);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not complete order.');
    }
  };

  // Order Action: Open Reject Modal
  const openRejectModal = (orderId: number) => {
    setOrderToReject(orderId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // Submit Reject
  const handleSubmitReject = async () => {
    if (!orderToReject) return;
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a valid reason for rejecting this order.');
      return;
    }
    setIsSubmittingReject(true);
    try {
      await rejectSellerOrder(orderToReject, rejectReason.trim());
      setRejectModalVisible(false);
      Alert.alert('Order Rejected', `Order #${orderToReject} has been rejected.`);
      loadDashboard();
      loadOrders(orderFilter);
    } catch (e: any) {
      Alert.alert('Rejection Failed', e.message || 'Could not reject order.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Catalog: Toggle Active
  const handleToggleListingActive = async (listing: SellerListingItem) => {
    const nextVal = !listing.is_active;
    try {
      setListings((prev) =>
        prev.map((item) =>
          item.listing_id === listing.listing_id ? { ...item, is_active: nextVal } : item
        )
      );
      await updateSellerListing(listing.listing_id, { is_active: nextVal });
    } catch (e: any) {
      // Revert on failure
      setListings((prev) =>
        prev.map((item) =>
          item.listing_id === listing.listing_id ? { ...item, is_active: !nextVal } : item
        )
      );
      Alert.alert('Update Failed', e.message || 'Could not toggle listing status.');
    }
  };

  // Catalog: Open Edit Modal
  const openEditListing = (listing: SellerListingItem) => {
    setSelectedListing(listing);
    setCustomPriceInput(listing.custom_price || '');
    setStockInput(String(listing.stock_quantity));
    setEditListingModalVisible(true);
  };

  // Catalog: Save Edit Listing
  const handleSaveListing = async () => {
    if (!selectedListing) return;
    setIsUpdatingListing(true);
    try {
      const priceVal = customPriceInput.trim() ? parseFloat(customPriceInput) : null;
      const stockVal = stockInput.trim() ? parseInt(stockInput, 10) : undefined;

      const res = await updateSellerListing(selectedListing.listing_id, {
        custom_price: priceVal,
        stock_quantity: isNaN(stockVal as number) ? undefined : stockVal,
      });

      if (res.data) {
        setListings((prev) =>
          prev.map((item) =>
            item.listing_id === selectedListing.listing_id ? res.data : item
          )
        );
      }
      setEditListingModalVisible(false);
      Alert.alert('Listing Updated', `${selectedListing.name} has been updated.`);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update listing.');
    } finally {
      setIsUpdatingListing(false);
    }
  };

  // Operating Hours: Save
  const handleSaveOperatingHours = async () => {
    setIsSavingHours(true);
    try {
      const res = await updateSellerOperatingHours({
        is_open: isOpenState,
        opens_at: opensAtInput.trim(),
        closes_at: closesAtInput.trim(),
      });
      if (res.data) {
        setOperatingHours(res.data);
      }
      Alert.alert('Hours Saved', 'Your store operating hours have been updated.');
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not update hours. Use HH:MM format (e.g. 09:00).');
    } finally {
      setIsSavingHours(false);
    }
  };

  // Verification: Pick Document
  const handlePickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVerifDocs((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (e) {
      Alert.alert('Selection Error', 'Could not open image picker.');
    }
  };

  // Verification: Submit
  const handleSubmitVerification = async () => {
    if (!bizDesc.trim()) {
      Alert.alert('Required Field', 'Please provide a brief description of your business.');
      return;
    }
    if (!verifReason.trim()) {
      Alert.alert('Required Field', 'Please specify your reason for verification.');
      return;
    }

    setIsSubmittingVerif(true);
    try {
      const res = await submitSellerVerification({
        business_description: bizDesc.trim(),
        reason_for_verification: verifReason.trim(),
        documentUris: verifDocs,
      });
      if (res.data) {
        setVerificationStatus({
          is_verified: false,
          has_submitted: true,
          verification: res.data,
        });
      }
      Alert.alert('Verification Submitted', 'Your documents have been submitted to admin for review.');
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message || 'Could not submit verification request.');
    } finally {
      setIsSubmittingVerif(false);
    }
  };

  // Filtered Catalog
  const filteredListings = useMemo(() => {
    if (!catalogSearch.trim()) return listings;
    const q = catalogSearch.toLowerCase();
    return listings.filter(
      (l) => l.name.toLowerCase().includes(q) || l.category.name.toLowerCase().includes(q)
    );
  }, [listings, catalogSearch]);

  const shopName = dashboard?.store.name || user?.name || 'My Shop';
  const profileImage = dashboard?.store.profile_image || user?.profile_image;
  const isApproved = user?.accountIsApproved === 1 || user?.accountIsApproved === true;
  const isVerified = verificationStatus?.is_verified ?? false;
  const pendingCount = dashboard?.order_badges.pending ?? 0;
  const todaySales = dashboard?.today.sales ?? '0.00';
  const todayOrders = dashboard?.today.orders_count ?? 0;
  const activeTotal = dashboard?.order_badges.active_total ?? 0;

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.shopImage} />
          ) : (
            <View style={styles.shopImageFallback}>
              <Text style={styles.shopFallbackIcon}>🏪</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <View style={styles.shopTitleRow}>
              <Text style={styles.shopName} numberOfLines={1}>
                {shopName}
              </Text>
              {isVerified && <Text style={styles.verifiedCheckIcon}> Verified</Text>}
            </View>
            <Text style={styles.sellerSector} numberOfLines={1}>
              Sector {dashboard?.store.sector || user?.sector || '4A'} • {dashboard?.store.area || 'Baldia Town'}
            </Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.badge,
                  isApproved ? styles.approvedBadge : styles.pendingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isApproved ? styles.approvedBadgeText : styles.pendingBadgeText,
                  ]}
                >
                  {isApproved ? 'Approved' : 'Pending Approval'}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  isVerified ? styles.verifiedBadge : styles.unverifiedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isVerified ? styles.verifiedBadgeText : styles.unverifiedBadgeText,
                  ]}
                >
                  {isVerified ? 'Verified Partner' : 'Unverified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Notifications & Settings */}
          <View style={styles.headerRightBtns}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/notifications' as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.settingsIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/(seller)/account' as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Store Open / Closed Switch Banner */}
        <View style={styles.storeStatusBanner}>
          <View style={styles.statusIndicatorBox}>
            <View
              style={[
                styles.statusDot,
                isOpenState ? styles.statusDotOpen : styles.statusDotClosed,
              ]}
            />
            <Text style={styles.statusBannerText}>
              {isOpenState ? 'Store is OPEN & accepting orders' : 'Store is CLOSED'}
            </Text>
          </View>
          <View style={styles.statusSwitchRow}>
            {isTogglingOpen && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 6 }} />}
            <Switch
              value={isOpenState}
              onValueChange={handleToggleStoreOpen}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isOpenState ? theme.colors.primary : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* KPI Overview Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Today's Sales</Text>
          <Text style={styles.kpiValue}>₨ {todaySales}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Today's Orders</Text>
          <Text style={styles.kpiValue}>{todayOrders}</Text>
        </View>
        <View style={[styles.kpiCard, pendingCount > 0 && styles.kpiCardPending]}>
          <Text style={[styles.kpiLabel, pendingCount > 0 && styles.kpiLabelPending]}>
            Pending Review
          </Text>
          <Text style={[styles.kpiValue, pendingCount > 0 && styles.kpiValuePending]}>
            {pendingCount}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Total</Text>
          <Text style={styles.kpiValue}>{activeTotal}</Text>
        </View>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}
        >
          <View style={styles.tabContentRow}>
            <Text
              style={[styles.tabButtonText, activeTab === 'orders' && styles.tabButtonTextActive]}
            >
              Orders
            </Text>
            {pendingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'catalog' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('catalog');
            if (listings.length === 0) loadCatalog();
          }}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'catalog' && styles.tabButtonTextActive]}
          >
            Catalog
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'hours' && styles.tabButtonActive]}
          onPress={() => setActiveTab('hours')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'hours' && styles.tabButtonTextActive]}
          >
            Hours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'verification' && styles.tabButtonActive]}
          onPress={() => setActiveTab('verification')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'verification' && styles.tabButtonTextActive]}
          >
            Verification
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <View style={styles.tabBody}>
          {/* Order Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'pending' && styles.filterPillActive]}
              onPress={() => handleFilterChange('pending')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'pending' && styles.filterPillTextActive]}>
                Pending ({dashboard?.order_badges.pending ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'preparing' && styles.filterPillActive]}
              onPress={() => handleFilterChange('preparing')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'preparing' && styles.filterPillTextActive]}>
                Preparing ({dashboard?.order_badges.preparing ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'ready' && styles.filterPillActive]}
              onPress={() => handleFilterChange('ready')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'ready' && styles.filterPillTextActive]}>
                Ready ({dashboard?.order_badges.ready ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'active' && styles.filterPillActive]}
              onPress={() => handleFilterChange('active')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'active' && styles.filterPillTextActive]}>
                Active Total
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'completed' && styles.filterPillActive]}
              onPress={() => handleFilterChange('completed')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'completed' && styles.filterPillTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, orderFilter === 'all' && styles.filterPillActive]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[styles.filterPillText, orderFilter === 'all' && styles.filterPillTextActive]}>
                All Orders
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Orders FlatList */}
          {isLoadingOrders && orders.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>No Orders Found</Text>
                  <Text style={styles.emptySubtitle}>
                    There are no orders in the {orderFilter} status currently.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isPending = item.status === 'pending';
                const isConfirmed = item.status === 'confirmed_by_seller';
                const isPreparing = item.status === 'preparing';
                const isDelivered = item.status === 'delivered';

                return (
                  <View style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderIdText}>Order #{item.id}</Text>
                        <Text style={styles.customerNameText}>
                          Customer: {item.customer_first_name}
                        </Text>
                      </View>
                      <View style={[styles.orderStatusBadge, getStatusStyle(item.status)]}>
                        <Text style={styles.orderStatusText}>{item.status_label}</Text>
                      </View>
                    </View>

                    <View style={styles.orderMetaRow}>
                      <Text style={styles.orderMetaText}>
                        🛒 {item.item_count} items • ₨ {item.total_amount}
                      </Text>
                      {item.unread_messages > 0 && (
                        <View style={styles.unreadPill}>
                          <Text style={styles.unreadPillText}>💬 {item.unread_messages} unread</Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.orderActionsRow}>
                      {isPending && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.confirmBtn]}
                            onPress={() => handleConfirmOrder(item.id)}
                          >
                            <Text style={styles.confirmBtnText}>✓ Confirm Order</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => openRejectModal(item.id)}
                          >
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.prepareBtn]}
                            onPress={() => handlePrepareOrder(item.id)}
                          >
                            <Text style={styles.prepareBtnText}>👨‍🍳 Start Preparing</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => openRejectModal(item.id)}
                          >
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {isPreparing && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.readyBtn]}
                          onPress={() => handleReadyOrder(item.id)}
                        >
                          <Text style={styles.readyBtnText}>🛵 Ready for Pickup</Text>
                        </TouchableOpacity>
                      )}

                      {isDelivered && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.completeBtn]}
                          onPress={() => handleCompleteOrder(item.id)}
                        >
                          <Text style={styles.completeBtnText}>✓ Complete Order</Text>
                        </TouchableOpacity>
                      )}

                      {/* Detail & Chat link */}
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => router.push(`/(seller)/orders/${item.id}` as any)}
                      >
                        <Text style={styles.detailBtnText}>View Details & Chat →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* TAB 2: CATALOG */}
      {activeTab === 'catalog' && (
        <View style={styles.tabBody}>
          <View style={styles.catalogTopBar}>
            <TouchableOpacity
              style={styles.importCatalogBtn}
              onPress={openImportModal}
              activeOpacity={0.8}
            >
              <Text style={styles.importCatalogBtnText}>+ Import from Master Catalog</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search catalog products..."
              placeholderTextColor="#9CA3AF"
              value={catalogSearch}
              onChangeText={setCatalogSearch}
            />
            {catalogSearch.length > 0 && (
              <TouchableOpacity onPress={() => setCatalogSearch('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingCatalog && listings.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading catalog...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredListings}
              keyExtractor={(item) => String(item.listing_id)}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No Products Found</Text>
                  <Text style={styles.emptySubtitle}>Try adjusting your search terms.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.listingCard}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.listingImage} />
                  ) : (
                    <View style={styles.listingImageFallback}>
                      <Text style={styles.listingFallbackIcon}>🛒</Text>
                    </View>
                  )}

                  <View style={styles.listingInfo}>
                    <Text style={styles.listingName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.listingCategory}>
                      {item.category.name} • {item.unit_type}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.listingPrice}>₨ {item.effective_price}</Text>
                      {item.price_differs_from_base && (
                        <Text style={styles.basePriceText}>(Base: ₨ {item.base_price})</Text>
                      )}
                    </View>

                    <View style={styles.stockRow}>
                      <Text
                        style={[
                          styles.stockText,
                          item.stock_quantity === 0 && styles.outOfStockText,
                        ]}
                      >
                        Stock: {item.stock_quantity}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Column */}
                  <View style={styles.listingActionsCol}>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => handleToggleListingActive(item)}
                      trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                      thumbColor={item.is_active ? theme.colors.primary : '#9CA3AF'}
                    />
                    <Text style={styles.activeLabel}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </Text>

                    <TouchableOpacity
                      style={styles.editListingBtn}
                      onPress={() => openEditListing(item)}
                    >
                      <Text style={styles.editListingText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* TAB 3: OPERATING HOURS */}
      {activeTab === 'hours' && (
        <ScrollView
          style={styles.tabBody}
          contentContainerStyle={styles.hoursContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Operating Hours & Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              Customers can only checkout orders when your shop is open and within these operating hours.
            </Text>

            <View style={styles.hoursToggleRow}>
              <View>
                <Text style={styles.hoursToggleTitle}>Store Open Status</Text>
                <Text style={styles.hoursToggleDesc}>
                  {isOpenState ? 'Accepting customer orders' : 'Currently paused'}
                </Text>
              </View>
              <Switch
                value={isOpenState}
                onValueChange={handleToggleStoreOpen}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={isOpenState ? theme.colors.primary : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Opens At (HH:MM format)</Text>
              <TextInput
                style={styles.timeInput}
                value={opensAtInput}
                onChangeText={setOpensAtInput}
                placeholder="09:00"
                placeholderTextColor="#9CA3AF"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Closes At (HH:MM format)</Text>
              <TextInput
                style={styles.timeInput}
                value={closesAtInput}
                onChangeText={setClosesAtInput}
                placeholder="23:00"
                placeholderTextColor="#9CA3AF"
                maxLength={5}
              />
            </View>

            <TouchableOpacity
              style={styles.saveHoursBtn}
              onPress={handleSaveOperatingHours}
              disabled={isSavingHours}
            >
              {isSavingHours ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveHoursText}>Save Operating Hours</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Earnings Quick Card */}
          <TouchableOpacity
            style={styles.earningsBannerCard}
            onPress={() => router.push('/(seller)/earnings' as any)}
          >
            <View>
              <Text style={styles.earningsBannerTitle}>💰 Financial Earnings Summary</Text>
              <Text style={styles.earningsBannerSubtitle}>
                View today, weekly, monthly, and lifetime sales reports.
              </Text>
            </View>
            <Text style={styles.bannerArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* TAB 4: VERIFICATION */}
      {activeTab === 'verification' && (
        <ScrollView
          style={styles.tabBody}
          contentContainerStyle={styles.verifContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {isVerified ? (
            <View style={styles.verifiedSuccessCard}>
              <Text style={styles.verifIcon}>🛡️</Text>
              <Text style={styles.verifSuccessTitle}>Verified Merchant Partner</Text>
              <Text style={styles.verifSuccessDesc}>
                Your shop is fully verified and holds the official Bakala Express Merchant Trust Badge.
              </Text>
            </View>
          ) : verificationStatus?.has_submitted && verificationStatus.verification?.status === 'pending' ? (
            <View style={styles.pendingReviewCard}>
              <Text style={styles.verifIcon}>⏳</Text>
              <Text style={styles.pendingTitle}>Verification Under Review</Text>
              <Text style={styles.pendingDesc}>
                Your application and submitted documents are currently being reviewed by the operations team.
              </Text>
              <Text style={styles.submittedAtText}>
                Submitted on: {new Date(verificationStatus.verification.submitted_at || '').toLocaleDateString()}
              </Text>
            </View>
          ) : (
            <View style={styles.cardSection}>
              {verificationStatus?.verification?.status === 'rejected' && (
                <View style={styles.rejectedBanner}>
                  <Text style={styles.rejectedTitle}>⚠️ Previous Request Declined</Text>
                  <Text style={styles.rejectedReason}>
                    Reason: {verificationStatus.verification.rejection_reason || 'Incomplete documentation'}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Apply for Merchant Verification</Text>
              <Text style={styles.sectionSubtitle}>
                Verified shops receive trust badges, priority search ranking, and higher visibility across neighborhood customers.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Description *</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={bizDesc}
                  onChangeText={setBizDesc}
                  placeholder="Describe your grocery shop, products, and years of operation..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Verification *</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={verifReason}
                  onChangeText={setVerifReason}
                  placeholder="e.g. Official merchant verification for community orders..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.docsSection}>
                <Text style={styles.inputLabel}>Verification Documents (Shop photos / Bills)</Text>
                <TouchableOpacity style={styles.uploadDocBtn} onPress={handlePickDocument}>
                  <Text style={styles.uploadDocText}>+ Select Document / Photo</Text>
                </TouchableOpacity>

                {verifDocs.map((uri, idx) => (
                  <View key={idx} style={styles.docPreviewRow}>
                    <Text style={styles.docFileName} numberOfLines={1}>
                      📄 Document {idx + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setVerifDocs((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Text style={styles.removeDocText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitVerifBtn}
                onPress={handleSubmitVerification}
                disabled={isSubmittingVerif}
              >
                {isSubmittingVerif ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitVerifText}>Submit Verification Request</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* REJECT ORDER MODAL */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Order #{orderToReject}</Text>
            <Text style={styles.modalSubtitle}>
              Please explain to the customer why this order cannot be fulfilled.
            </Text>

            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="e.g. Item out of stock, closing early..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={isSubmittingReject}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectConfirmBtn}
                onPress={handleSubmitReject}
                disabled={isSubmittingReject}
              >
                {isSubmittingReject ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalRejectConfirmText}>Confirm Rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT LISTING MODAL */}
      <Modal visible={editListingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Product Listing</Text>
            <Text style={styles.modalProductName}>{selectedListing?.name}</Text>
            <Text style={styles.modalBasePrice}>Base Price: ₨ {selectedListing?.base_price}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Custom Price (leave blank for Base Price)</Text>
              <TextInput
                style={styles.input}
                placeholder={selectedListing?.base_price || '0.00'}
                placeholderTextColor="#9CA3AF"
                value={customPriceInput}
                onChangeText={setCustomPriceInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={stockInput}
                onChangeText={setStockInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditListingModalVisible(false)}
                disabled={isUpdatingListing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveListing}
                disabled={isUpdatingListing}
              >
                {isUpdatingListing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* IMPORT CATALOG MODAL */}
      <Modal visible={importModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Import Global Products</Text>
            <Text style={styles.modalSubtitle}>
              Select products from the master neighborhood catalog to add to your shop:
            </Text>

            {isLoadingAvailable ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
                  Loading available products...
                </Text>
              </View>
            ) : availableProducts.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                  All available global products are already imported into your shop catalog!
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableProducts}
                keyExtractor={(item) => String(item.global_product_id)}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                  const isSelected = selectedProductIdsToImport.includes(item.global_product_id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.availableItemRow,
                        isSelected && styles.availableItemRowSelected,
                      ]}
                      onPress={() => toggleSelectProduct(item.global_product_id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.availableItemName}>{item.name}</Text>
                        <Text style={styles.availableItemMeta}>
                          {item.category.name} • Base: ₨ {item.base_price}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setImportModalVisible(false)}
                disabled={isSubmittingImport}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              {availableProducts.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.modalSaveBtn,
                    selectedProductIdsToImport.length === 0 && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirmImport}
                  disabled={isSubmittingImport || selectedProductIdsToImport.length === 0}
                >
                  {isSubmittingImport ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>
                      Import Selected ({selectedProductIdsToImport.length})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#FEF3C7' };
    case 'confirmed_by_seller':
    case 'preparing':
      return { backgroundColor: '#DBEAFE' };
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return { backgroundColor: '#E0E7FF' };
    case 'delivered':
    case 'completed':
      return { backgroundColor: '#DEF7EC' };
    case 'cancelled':
    case 'rejected':
      return { backgroundColor: '#FEE2E2' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  shopImage: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  shopImageFallback: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shopFallbackIcon: {
    fontSize: 28,
  },
  headerInfo: {
    flex: 1,
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  verifiedCheckIcon: {
    fontSize: 12,
    color: '#059669',
    fontWeight: theme.fontWeight.bold,
  },
  sellerSector: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  approvedBadge: {
    backgroundColor: '#DEF7EC',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
  },
  unverifiedBadge: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
  },
  approvedBadgeText: {
    color: '#03543F',
  },
  pendingBadgeText: {
    color: '#92400E',
  },
  verifiedBadgeText: {
    color: '#065F46',
  },
  unverifiedBadgeText: {
    color: '#6B7280',
  },
  settingsBtn: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
  },
  storeStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusDotOpen: {
    backgroundColor: '#10B981',
  },
  statusDotClosed: {
    backgroundColor: '#EF4444',
  },
  statusBannerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  statusSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 8,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.md,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  kpiCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  kpiLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  kpiLabelPending: {
    color: '#B45309',
    fontWeight: theme.fontWeight.bold,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  kpiValuePending: {
    color: '#D97706',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
  },
  tabBody: {
    flex: 1,
  },
  filtersScroll: {
    maxHeight: 52,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: 8,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  customerNameText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 10,
  },
  orderMetaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  unreadPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: '#92400E',
  },
  orderActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  prepareBtn: {
    backgroundColor: '#3B82F6',
  },
  prepareBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  readyBtn: {
    backgroundColor: '#6366F1',
  },
  readyBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  completeBtn: {
    backgroundColor: '#059669',
  },
  completeBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  detailBtn: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  detailBtnText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    backgroundColor: '#F3F4F6',
  },
  listingImageFallback: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listingFallbackIcon: {
    fontSize: 24,
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  listingCategory: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  basePriceText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  stockRow: {
    marginTop: 2,
  },
  stockText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  outOfStockText: {
    color: '#EF4444',
    fontWeight: theme.fontWeight.bold,
  },
  listingActionsCol: {
    alignItems: 'center',
    marginLeft: 8,
  },
  activeLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  editListingBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editListingText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  hoursContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  hoursToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hoursToggleTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  hoursToggleDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  timeInput: {
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    backgroundColor: '#FAFAFA',
    height: 44,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  saveHoursBtn: {
    height: 46,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveHoursText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  earningsBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  earningsBannerTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  earningsBannerSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  bannerArrow: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  verifContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  verifiedSuccessCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  verifSuccessTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#065F46',
    marginBottom: 6,
  },
  verifSuccessDesc: {
    fontSize: theme.fontSize.sm,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingReviewCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#92400E',
    marginBottom: 6,
  },
  pendingDesc: {
    fontSize: theme.fontSize.sm,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  submittedAtText: {
    fontSize: theme.fontSize.xs,
    color: '#78350F',
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  rejectedTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#B91C1C',
    marginBottom: 2,
  },
  rejectedReason: {
    fontSize: theme.fontSize.xs,
    color: '#991B1B',
  },
  docsSection: {
    marginBottom: theme.spacing.md,
  },
  uploadDocBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    marginBottom: 8,
  },
  uploadDocText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  docPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 4,
  },
  docFileName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  removeDocText: {
    fontSize: theme.fontSize.xs,
    color: '#EF4444',
    fontWeight: theme.fontWeight.medium,
  },
  submitVerifBtn: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitVerifText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadow.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalProductName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  modalBasePrice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
    marginBottom: theme.spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCancelText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  modalRejectConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#DC2626',
  },
  modalRejectConfirmText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catalogTopBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  importCatalogBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importCatalogBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  availableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: theme.borderRadius.sm,
  },
  availableItemRowSelected: {
    backgroundColor: '#F0FDF4',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  availableItemName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  availableItemMeta: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
