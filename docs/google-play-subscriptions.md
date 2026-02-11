# Google Play Console: Subscription Setup Guide

This guide explains how to properly configure your products in the Google Play Console to match the PaxGo RevenueCat integration.

---

## 1. Which Category to Choose?

In the Play Console sidebar, go to **Monetize** > **Products**.

* **DO NOT** use "App Pricing" (that is for paid apps).
* **DO NOT** use "One-time products" (those are for permanent unlocks).
* **USE "Subscriptions"**: This is for recurring monthly or yearly plans.

---

## 2. Step-by-Step Configuration

### **Part A: Create the Subscription**

1. Go to **Monetize** > **Products** > **Subscriptions**.
2. Click **Create subscription**.
3. **Product ID**:
    * For Monthly: Use `rc_monthly_pro`
    * For Yearly: Use `rc_yearly_pro`
    * *Note: These must exactly match the IDs set in RevenueCat.*
4. **Name**: Enter a name (e.g., "PaxGo Pro Monthly").
5. Click **Create**.

### **Part B: Set up the Base Plan**

A "Subscription" in Google Play is just a container. You must add a **Base Plan** for it to be purchasable.

1. Inside your new subscription, scroll to **Base plans** and click **Add base plan**.
2. **Base plan ID**:
    * For Monthly: Use **`pro1m`**
    * For Yearly: Use **`pro1yr`**
    * *Note: These IDs must exactly match your RevenueCat configuration.*
3. **Type**: Select **Auto-renewing**.
4. **Billing period**:
    * Select **Monthly** or **Yearly** based on which product you are editing.
5. **Price**:
    * Click **Set prices**.
    * Select all regions.
    * Enter your price: **$5.00** for monthly / **$45.00** for yearly.
    * Click **Update** > **Save**.
6. **Activate**: Click the **Activate** button next to the Base Plan.

---

## 3. Checklist for the Developer

* [ ] Is the **Product ID** in Play Console identical to the one in RevenueCat?
* [ ] Are the **Base Plan IDs** set to `pro1m` (monthly) and `pro1yr` (yearly)?
* [ ] Is the **Base Plan** status set to **Active**?
* [ ] Have you set up the **Service Account Key** in RevenueCat?
* [ ] **Wait**: Google Play can take 2-24 hours to "propagate" new products.

---

## 4. Verification

Once set up, the app should automatically detect these via the `useSubscription` hook. You can test using a **License Tester** account in the Play Console to avoid being charged real money.
