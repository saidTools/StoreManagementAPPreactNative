import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { t } from '../../i18n';
import { exportBackup, shareBackupFile, importBackup } from '../../utils/exportData';
import { useProductStore } from '../../store/useProductStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import { getPlanById, PLANS } from '../../constants/plans';
import type { SubscriptionTier } from '../../types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    shopName, currencyLabel, defaultLowStockThreshold,
    subscriptionTier, isSubscriptionActive,
    setShopName, setCurrencyLabel, setDefaultLowStockThreshold, setSubscriptionTier,
  } = useSettingsStore();

  const [editShopName, setEditShopName] = useState(false);
  const [shopNameInput, setShopNameInput] = useState(shopName);
  const [editCurrency, setEditCurrency] = useState(false);
  const [currencyInput, setCurrencyInput] = useState(currencyLabel);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const { language, setLanguage } = useLanguageStore();

  const currentPlan = getPlanById(subscriptionTier);

  const handleExportBackup = async () => {
    try {
      const path = await exportBackup(shopName);
      await shareBackupFile(path);
    } catch (error) {
      Alert.alert(t('settings.backupFailed'), t('settings.backupFailedMsg'));
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await importBackup(result.assets[0].uri);
        Alert.alert(t('common.success'), 'Data restored successfully!');
      }
    } catch (error) {
      Alert.alert(t('settings.restoreFailed'), t('settings.restoreFailedMsg'));
    }
  };

  const handleResetData = () => {
    Alert.alert(
      t('settings.resetAllData'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetAllData'),
          style: 'destructive',
          onPress: () => {
            const db = require('../../db/database').default;
            db.withTransactionSync(() => {
              db.runSync('DELETE FROM sale_items');
              db.runSync('DELETE FROM debts');
              db.runSync('DELETE FROM sales');
              db.runSync('DELETE FROM expenses');
              db.runSync('DELETE FROM customers');
              db.runSync('DELETE FROM products');
            });
            Alert.alert(t('common.done'), t('settings.resetDone'));
          },
        },
      ]
    );
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    setSubscriptionTier(tier, true);
    Alert.alert(t('settings.subscriptionUpdated'), t('settings.subscriptionMsg', { tier }));
  };

  const handleExportProductsCSV = async () => {
    const { exportProductsCSV } = await import('../../utils/csv');
    const { products } = useProductStore.getState();
    if (products.length === 0) { Alert.alert(t('settings.noProducts'), t('settings.noProductsMsg')); return; }
    await exportProductsCSV(products);
  };

  const handleExportCustomersCSV = async () => {
    const { exportCustomersCSV } = await import('../../utils/csv');
    const { customers } = useCustomerStore.getState();
    if (customers.length === 0) { Alert.alert(t('settings.noCustomers'), t('settings.noCustomersMsg')); return; }
    await exportCustomersCSV(customers);
  };

  const handleImportProductsCSV = async () => {
    const { importProductsCSV } = await import('../../utils/csv');
    const { addProduct } = useProductStore.getState();
    const items = await importProductsCSV();
    if (items.length === 0) return;
    for (const item of items) addProduct(item);
    Alert.alert(t('settings.importDone'), t('settings.productsImported', { count: items.length }));
  };

  const handleImportCustomersCSV = async () => {
    const { importCustomersCSV } = await import('../../utils/csv');
    const { addCustomer } = useCustomerStore.getState();
    const items = await importCustomersCSV();
    if (items.length === 0) return;
    for (const item of items) addCustomer(item);
    Alert.alert(t('settings.importDone'), t('settings.customersImported', { count: items.length }));
  };

  const handleSaveShopName = () => {
    setShopName(shopNameInput);
    setEditShopName(false);
  };

  const handleSaveCurrency = () => {
    setCurrencyLabel(currencyInput);
    setEditCurrency(false);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.shopInfo')}</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="store" size={20} color={colors.textSecondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.shopName')}</Text>
              {editShopName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={shopNameInput}
                    onChangeText={setShopNameInput}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveShopName}>
                    <MaterialCommunityIcons name="check" size={20} color={colors.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.settingValue}>{shopName}</Text>
              )}
            </View>
            {!editShopName && (
              <TouchableOpacity onPress={() => setEditShopName(true)}>
                <MaterialCommunityIcons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="currency-usd" size={20} color={colors.textSecondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.currencyLabel')}</Text>
              {editCurrency ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={currencyInput}
                    onChangeText={setCurrencyInput}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveCurrency}>
                    <MaterialCommunityIcons name="check" size={20} color={colors.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.settingValue}>{currencyLabel}</Text>
              )}
            </View>
            {!editCurrency && (
              <TouchableOpacity onPress={() => setEditCurrency(true)}>
                <MaterialCommunityIcons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.textSecondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.defaultLowStock')}</Text>
              <Text style={styles.settingValue}>{t('settings.thresholdUnits', { count: defaultLowStockThreshold })}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.prompt?.(
                  t('settings.lowStockThreshold'),
                  t('settings.enterThreshold'),
                  (val) => setDefaultLowStockThreshold(parseInt(val) || 5),
                  'plain-text',
                  defaultLowStockThreshold.toString()
                );
              }}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textSecondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.lowStockAlerts')}</Text>
              <Text style={styles.settingValue}>{t('settings.dailyReminder')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, true && styles.toggleOn]}
              onPress={async () => {
                const { requestNotificationPermission, scheduleLowStockCheck, checkAndNotifyLowStock } = await import('../../utils/notifications');
                const ok = await requestNotificationPermission();
                if (!ok) { Alert.alert(t('settings.permissionDenied'), t('settings.enableNotif')); return; }
                await scheduleLowStockCheck();
                await checkAndNotifyLowStock();
                Alert.alert(t('settings.enabled'), t('settings.dailyAlertMsg'));
              }}
            >
              <View style={styles.toggleKnob} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.settingCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowLanguagePicker(true)}>
            <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.selectLanguage')}</Text>
              <Text style={styles.actionSub}>{language === 'ar' ? t('settings.arabic') : t('settings.english')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            <TouchableOpacity
              style={[styles.langOption, language === 'en' && styles.langOptionActive]}
              onPress={() => { setLanguage('en'); setShowLanguagePicker(false); }}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>{t('settings.english')}</Text>
              {language === 'en' && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, language === 'ar' && styles.langOptionActive]}
              onPress={() => { setLanguage('ar'); setShowLanguagePicker(false); }}
            >
              <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>{t('settings.arabic')}</Text>
              {language === 'ar' && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.langCancel} onPress={() => setShowLanguagePicker(false)}>
              <Text style={styles.langCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>
        <View style={styles.settingCard}>
          <View style={[styles.planBadge, { backgroundColor: subscriptionTier === 'pro' ? '#E8F5E9' : subscriptionTier === 'basic' ? '#FFF3E0' : '#F5F5F5' }]}>
            <MaterialCommunityIcons
              name={subscriptionTier === 'pro' ? 'crown' : subscriptionTier === 'basic' ? 'star' : 'star-outline'}
              size={24}
              color={subscriptionTier === 'pro' ? colors.success : subscriptionTier === 'basic' ? colors.warning : colors.textSecondary}
            />
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{t('settings.plan', { name: currentPlan.name })}</Text>
              <Text style={styles.planPrice}>{currentPlan.price}</Text>
            </View>
          </View>

          <View style={styles.plansList}>
            {PLANS.filter(p => p.id !== subscriptionTier).map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.upgradeCard}
                onPress={() => handleUpgrade(plan.id)}
              >
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{plan.name}</Text>
                  <Text style={styles.upgradePrice}>{plan.price}</Text>
                  <View style={styles.upgradeFeatures}>
                    {Object.entries(plan.features)
                      .filter(([, v]) => v)
                      .slice(0, 3)
                      .map(([key]) => (
                        <Text key={key} style={styles.upgradeFeature}>
                          ✓ {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                      ))}
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.dataManagement')}</Text>
        <View style={styles.settingCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleExportBackup}>
            <MaterialCommunityIcons name="backup-restore" size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.exportBackup')}</Text>
              <Text style={styles.actionSub}>{t('settings.exportBackupSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleImportBackup}>
            <MaterialCommunityIcons name="restore" size={20} color={colors.warning} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.restoreBackup')}</Text>
              <Text style={styles.actionSub}>{t('settings.restoreBackupSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleExportProductsCSV}>
            <MaterialCommunityIcons name="file-delimited" size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.exportProductsCSV')}</Text>
              <Text style={styles.actionSub}>{t('settings.exportProductsCSVSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleExportCustomersCSV}>
            <MaterialCommunityIcons name="file-delimited" size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.exportCustomersCSV')}</Text>
              <Text style={styles.actionSub}>{t('settings.exportCustomersCSVSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleImportProductsCSV}>
            <MaterialCommunityIcons name="file-upload" size={20} color={colors.warning} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.importProductsCSV')}</Text>
              <Text style={styles.actionSub}>{t('settings.importProductsCSVSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleImportCustomersCSV}>
            <MaterialCommunityIcons name="file-upload" size={20} color={colors.warning} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>{t('settings.importCustomersCSV')}</Text>
              <Text style={styles.actionSub}>{t('settings.importCustomersCSVSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={handleResetData}>
            <MaterialCommunityIcons name="delete-sweep" size={20} color={colors.danger} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>{t('settings.resetAllData')}</Text>
              <Text style={styles.actionSub}>{t('settings.resetAllDataSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.settingCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.appVersion')}</Text>
            <Text style={styles.infoValue}>{t('settings.appVersionVal')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.database')}</Text>
            <Text style={styles.infoValue}>{t('settings.databaseVal')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.madeFor')}</Text>
            <Text style={styles.infoValue}>{t('settings.madeForVal')}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>{t('settings.developer')}</Text>
            <Text style={styles.infoValue}>{t('settings.developerVal')}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: insets.bottom + spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  section: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  settingValue: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body1,
    color: colors.textPrimary,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  planInfo: {
    marginLeft: spacing.md,
  },
  planName: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  planPrice: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  plansList: {
    gap: 1,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  upgradePrice: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  upgradeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  upgradeFeature: {
    ...typography.caption,
    color: colors.success,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dangerRow: {
    borderBottomWidth: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: colors.primary },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  modalTitle: { ...typography.heading3, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  langOptionActive: { backgroundColor: colors.primaryLight },
  langText: { ...typography.body1, color: colors.textPrimary, fontWeight: '600' },
  langTextActive: { color: colors.primary },
  langCancel: { alignItems: 'center', padding: spacing.md, marginTop: spacing.sm },
  langCancelText: { ...typography.body1, color: colors.textSecondary, fontWeight: '600' },

});
