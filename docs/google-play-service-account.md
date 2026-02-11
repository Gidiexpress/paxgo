# Google Play Service Account Setup Guide

RevenueCat needs a **Service Account Key (.json)** to communicate with the Google Play Store to verify your subscriptions and prices. Without this, you will see a "Connection issue" in your dashboard.

---

## 1. Create the Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your PaxGo project.
3. Go to **IAM & Admin** > **Service Accounts**.
4. Click **+ Create Service Account**.
5. **Name**: `revenuecat-access`
6. Click **Create and Continue**.
7. **Role**: Choose `Pub/Sub Admin` (Required for real-time notifications).
8. Click **Done**.

---

## 2. Generate the JSON Key

1. In the Service Accounts list, click on the email of the account you just created.
2. Go to the **Keys** tab.
3. Click **Add Key** > **Create new key**.
4. Select **JSON** and click **Create**.
5. **Save this file!** This is the `.json` file you will upload to RevenueCat.

---

## 3. Link to Google Play Console

1. Go to the [Google Play Console](https://play.google.com/console/).
2. Go to **Users and permissions** (sidebar).
3. Click **Invite new users**.
4. **Email**: Paste the email address of the service account you created in Step 1.
5. **Account Permissions**:
    * **Financial data**: Check "View financial data, orders, and cancellation survey responses."
    * **App Access**: Check "Manage orders and subscriptions."
6. Click **Invite user**.

---

## 4. Upload to RevenueCat

1. Go to your **RevenueCat Dashboard**.
2. Go to **Project Settings** > **Apps** > **Paxgo Android**.
3. Find the section **Google Play Service Account Key**.
4. Upload the `.json` file you downloaded in Step 2.
5. Click **Save**.

---

## 5. Troubleshooting "Could not check"

If you still see "Could not check" after uploading:

* **Wait 15 mins**: It can take a moment for permissions to sync.
* **Check API Access**: In the Play Console, go to **Setup** > **API Access** and ensure the Google Play Billing API is turned "On."
* **Release Required**: Ensure you have uploaded at least one `.aab` (App Bundle) to a testing track in the Play Console. Google won't verify products for an app that has zero uploaded code.
