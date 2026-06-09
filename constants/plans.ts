import type { SubscriptionTier } from '../types';

export interface Plan {
  id: SubscriptionTier;
  name: string;
  price: string;
  monthlyPrice: number;
  productLimit: number;
  monthlyInvoiceLimit: number;
  features: {
    debtTracking: boolean;
    reports: boolean;
    pdfExport: boolean;
    cloudBackup: boolean;
    prioritySupport: boolean;
  };
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 DA',
    monthlyPrice: 0,
    productLimit: 50,
    monthlyInvoiceLimit: 30,
    features: {
      debtTracking: true,
      reports: true,
      pdfExport: true,
      cloudBackup: false,
      prioritySupport: false,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '500 DA/mo',
    monthlyPrice: 500,
    productLimit: 500,
    monthlyInvoiceLimit: Infinity,
    features: {
      debtTracking: true,
      reports: true,
      pdfExport: true,
      cloudBackup: false,
      prioritySupport: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '1200 DA/mo',
    monthlyPrice: 1200,
    productLimit: Infinity,
    monthlyInvoiceLimit: Infinity,
    features: {
      debtTracking: true,
      reports: true,
      pdfExport: true,
      cloudBackup: true,
      prioritySupport: true,
    },
  },
];

export const getPlanById = (id: SubscriptionTier): Plan => {
  return PLANS.find(p => p.id === id) ?? PLANS[0];
};
