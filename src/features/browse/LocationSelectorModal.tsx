import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getLocationsMeta } from '../../api/browse';
import { useLocationStore } from '../../store/locationStore';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { t } from '../../i18n';

export interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  isInitialRequired?: boolean;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  onClose,
  isInitialRequired = false,
}) => {
  const currentSector = useLocationStore((s) => s.sector);
  const currentNearArea = useLocationStore((s) => s.nearArea);
  const setLocation = useLocationStore((s) => s.setLocation);

  const [selectedSector, setSelectedSector] = useState<string>('4A');
  const [selectedNearArea, setSelectedNearArea] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['locations-meta'],
    queryFn: getLocationsMeta,
    enabled: visible,
  });

  const locationsData = data?.data;
  const sectors = locationsData?.sectors || ['4A', '4B', '4C'];
  const nearAreas = locationsData?.near_areas || [];

  useEffect(() => {
    if (currentSector) {
      setSelectedSector(currentSector);
    } else if (sectors.length > 0) {
      setSelectedSector(sectors[0]);
    }
    setSelectedNearArea(currentNearArea);
  }, [currentSector, currentNearArea, visible]);

  const handleSave = () => {
    setLocation(selectedSector, selectedNearArea);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={isInitialRequired ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('selectSectorTitle')}</Text>
              <Text style={styles.subtitle}>{t('selectSectorSubtitle')}</Text>
            </View>
            {!isInitialRequired ? (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('errors.NETWORK_ERROR')}</Text>
              <Button title={t('retry')} onPress={() => refetch()} variant="outline" />
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>{t('sectorLabel')}</Text>
              <View style={styles.chipsGrid}>
                {sectors.map((sec) => {
                  const isSelected = selectedSector === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.sectorChip, isSelected && styles.sectorChipActive]}
                      onPress={() => setSelectedSector(sec)}
                    >
                      <Text
                        style={[styles.sectorChipText, isSelected && styles.sectorChipTextActive]}
                      >
                        Sector {sec}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {nearAreas.length > 0 ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: theme.spacing.lg }]}>
                    {t('nearAreaLabel')}
                  </Text>
                  <View style={styles.nearAreasWrap}>
                    <TouchableOpacity
                      style={[
                        styles.nearAreaChip,
                        selectedNearArea === null && styles.nearAreaChipActive,
                      ]}
                      onPress={() => setSelectedNearArea(null)}
                    >
                      <Text
                        style={[
                          styles.nearAreaChipText,
                          selectedNearArea === null && styles.nearAreaChipTextActive,
                        ]}
                      >
                        Any Landmark
                      </Text>
                    </TouchableOpacity>
                    {nearAreas.map((area) => {
                      const isSelected = selectedNearArea === area;
                      return (
                        <TouchableOpacity
                          key={area}
                          style={[styles.nearAreaChip, isSelected && styles.nearAreaChipActive]}
                          onPress={() => setSelectedNearArea(area)}
                        >
                          <Text
                            style={[
                              styles.nearAreaChipText,
                              isSelected && styles.nearAreaChipTextActive,
                            ]}
                          >
                            {area}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button
              title={t('saveLocation')}
              onPress={handleSave}
              disabled={isLoading || !selectedSector}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
  },
  errorContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
  },
  body: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  chipsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectorChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardMuted,
  },
  sectorChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  sectorChipText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  sectorChipTextActive: {
    color: theme.colors.primaryDark,
  },
  nearAreasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  nearAreaChip: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  nearAreaChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  nearAreaChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  nearAreaChipTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.semibold,
  },
  footer: {
    paddingTop: theme.spacing.sm,
  },
  saveButton: {
    width: '100%',
  },
});
