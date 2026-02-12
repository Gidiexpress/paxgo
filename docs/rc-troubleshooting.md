# RevenueCat Troubleshooting: "Product Not Found"

If prices are showing in the app but the purchase fails with "Product not found," follow these steps in the **Google Play Console**.

## 1. Verify License Testing

Go to **Setup** > **License Testing**.

- [ ] Add the Gmail address you are using on your test device to the list.
- [ ] Set **License response** to `RESPOND_NORMALLY`.
- [ ] Click **Save**.

## 2. Join the Testing Track

Even if you have the app installed, your Google Account must be enrolled in the track.

- [ ] Go to **Testing** > **Internal testing**.
- [ ] Go to the **Testers** tab.
- [ ] Copy the **Join on web** or **Join on Android** link at the bottom.
- [ ] Open this link on your phone and click **Join program**.

## 3. Check Base Plan Status

Google Play subscriptions require a Base Plan to be manually activated.

- [ ] Go to **Monetize** > **Products** > **Subscriptions**.
- [ ] Click on your subscription (`rc_monthly_pro` or `rc_yearly_pro`).
- [ ] Scroll down to **Base plans**.
- [ ] Ensure the status says **Active**. If it says "Inactive" or "Draft," click **Activate**.

## 4. App Integrity (Signing Key)

If you successfully uploaded the APK/AAB to the Play Console, your signing key is **not** the problem. Google would have rejected the upload if it didn't match.

---

**Note**: Changes in the Play Console can take 2-24 hours to sync to devices. Try clearing the cache of the Google Play Store app on your phone if it still fails.
