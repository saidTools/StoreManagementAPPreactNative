import { useSettingsStore } from '../store/useSettingsStore';
import type { SubscriptionTier } from '../types';

export type Feature = 'product_limit' | 'invoice_limit' | 'debt_tracking' | 'reports' | 'pdf_export' | 'cloud_backup' | 'priority_support';

const featureAccess: Record<SubscriptionTier, Feature[]> = {
  free: ['debt_tracking', 'reports', 'pdf_export'],
  basic: ['debt_tracking', 'reports', 'pdf_export', 'product_limit', 'invoice_limit'],
  pro: ['debt_tracking', 'reports', 'pdf_export', 'cloud_backup', 'priority_support', 'product_limit', 'invoice_limit'],
};

export const hasFeature = (feature: Feature): boolean => {
  const { subscriptionTier, isSubscriptionActive } = useSettingsStore.getState();

  if (!isSubscriptionActive && subscriptionTier !== 'free') {
    return false;
  }

  const accessible = featureAccess[subscriptionTier];

  switch (feature) {
    case 'product_limit':
      return subscriptionTier !== 'free';
    case 'invoice_limit':
      return subscriptionTier !== 'free';
    case 'debt_tracking':
      return subscriptionTier !== 'free';
    case 'reports':
      return subscriptionTier !== 'free';
    case 'pdf_export':
      return true;
    case 'cloud_backup':
      return subscriptionTier === 'pro';
    case 'priority_support':
      return subscriptionTier === 'pro';
    default:
      return accessible.includes(feature);
  }
};

export const getProductLimit = (): number => {
  const { subscriptionTier } = useSettingsStore.getState();
  switch (subscriptionTier) {
    case 'free': return 50;
    case 'basic': return 500;
    case 'pro': return Infinity;
    default: return 50;
  }
};

export const getMonthlyInvoiceLimit = (): number => {
  const { subscriptionTier } = useSettingsStore.getState();
  switch (subscriptionTier) {
    case 'free': return 30;
    case 'basic': return Infinity;
    case 'pro': return Infinity;
    default: return 30;
  }
};

export const canAddProduct = (currentCount: number): boolean => {
  const limit = getProductLimit();
  return currentCount < limit;
};

export const canCreateInvoice = (currentMonthlyCount: number): boolean => {
  const limit = getMonthlyInvoiceLimit();
  return currentMonthlyCount < limit;
};

export const getPlanName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free': return 'Free';
    case 'basic': return 'Basic';
    case 'pro': return 'Pro';
  }
};

export const getPlanPrice = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free': return '0 DA';
    case 'basic': return '500 DA/mo';
    case 'pro': return '1200 DA/mo';
  }
};
