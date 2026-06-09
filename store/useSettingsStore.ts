import { create } from 'zustand';
import { getSetting, setSetting } from '../db/database';

interface SettingsState {
  shopName: string;
  currencyLabel: string;
  defaultLowStockThreshold: number;
  subscriptionTier: 'free' | 'basic' | 'pro';
  isSubscriptionActive: boolean;
  loaded: boolean;

  loadSettings: () => void;
  setShopName: (name: string) => void;
  setCurrencyLabel: (label: string) => void;
  setDefaultLowStockThreshold: (threshold: number) => void;
  setSubscriptionTier: (tier: 'free' | 'basic' | 'pro', active: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  shopName: 'My Shop',
  currencyLabel: 'DA',
  defaultLowStockThreshold: 5,
  subscriptionTier: 'free',
  isSubscriptionActive: false,
  loaded: false,
  loadSettings: () => {
    const shopName = getSetting('shop_name') ?? 'My Shop';
    const currencyLabel = getSetting('currency_label') ?? 'DA';
    const defaultLowStockThreshold = parseInt(getSetting('default_low_stock_threshold') ?? '5');
    const subscriptionTier = (getSetting('subscription_tier') ?? 'free') as 'free' | 'basic' | 'pro';
    const isSubscriptionActive = getSetting('subscription_active') === 'true';
    set({
      shopName,
      currencyLabel,
      defaultLowStockThreshold,
      subscriptionTier,
      isSubscriptionActive,
      loaded: true,
    });
  },

  setShopName: (name: string) => {
    setSetting('shop_name', name);
    set({ shopName: name });
  },

  setCurrencyLabel: (label: string) => {
    setSetting('currency_label', label);
    set({ currencyLabel: label });
  },

  setDefaultLowStockThreshold: (threshold: number) => {
    setSetting('default_low_stock_threshold', threshold.toString());
    set({ defaultLowStockThreshold: threshold });
  },

  setSubscriptionTier: (tier, active) => {
    setSetting('subscription_tier', tier);
    setSetting('subscription_active', active.toString());
    set({ subscriptionTier: tier, isSubscriptionActive: active });
  },

}));
