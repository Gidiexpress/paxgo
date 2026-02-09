import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY;

export const REVENUECAT_CONFIG = {
    apiKey: API_KEY,
    entitlementId: 'pro', // The entitlement identifier from RevenueCat dashboard
    products: {
        // Replace these with your actual product IDs from RevenueCat
        monthly: 'rc_monthly_pro',
        yearly: 'rc_yearly_pro',
        lifetime: 'rc_lifetime_pro',
    },
};

export const isRevenueCatConfigured = () => {
    return !!API_KEY && API_KEY !== 'test_key_placeholder';
};
