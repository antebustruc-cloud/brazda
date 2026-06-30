# Ubrano Mobile (React Native / Expo)

## What's built

Both buyer and seller flows, fully working against the live API (https://ubrano.com.hr/api):

**Buyer:** Login / Register (including the OPG map pin for sellers who register),
Dashboard, Find Stands / Find Fields / Find Delivery - GPS or tap-to-set-location,
radius, category/price/name filters, tap-to-call for Fields and Delivery (matches
what the web app exposes), route-corridor match indicator for deliveries.

**Seller:** My OPG (IBAN settings), My Fields, My Stands, My Delivery (including
the route corridor radius input), product management per channel (category ->
product -> variety -> price), and the Get Paid HUB-3A barcode flow.

## Not built yet (next pass)

- Notify Nearby Buyers - built (component exists, same as web), but hidden
  behind a feature flag (`FEATURES.notifications` in `src/config.js`) until
  the paid-boost model exists, same reasoning as the web app
- Push notifications (this needs Firebase - a Phase 3 item on the web side too)
- Mobile-native Google Sign-In (web has it; mobile needs a separate native
  OAuth client setup)
- iOS-specific testing (built to work on iOS, but Android is the near-term target
  since that's what's being published first)

## Testing it yourself right now (no build needed)

1. Install [Expo Go](https://expo.dev/go) on your Android phone from the Play Store.
2. On your computer, in this folder: `npm install` then `npx expo start`.
3. Scan the QR code shown in the terminal with the Expo Go app.

That's it - this runs the real app against the real production API, no separate
build step required for testing.

## Before you can submit to Google Play

**1. Get a Google Maps API key for Android** (the app won't show maps without this):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project (or use an existing one)
   - Enable "Maps SDK for Android"
   - Create an API key under Credentials
   - Open `app.json`, find `REPLACE_WITH_YOUR_GOOGLE_MAPS_ANDROID_API_KEY`, paste your key there

**2. Create a free Expo (EAS) account** at [expo.dev](https://expo.dev) - this is what
   actually builds the installable Android file (AAB), since there's no Android
   Studio involved in this workflow.

**3. Build the release file:**
   ```
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform android
   ```
   This builds in Expo's cloud and gives you a download link for the `.aab` file
   when it's done (10-20 minutes typically).

**4. Upload that `.aab` to the Google Play Console** - this part is genuinely on you,
   as agreed (app listing, screenshots, content rating questionnaire, the $25
   one-time developer account fee, etc.)

## A note on the package name

`app.json` currently has `com.ubrano.app` as both the Android package name and iOS
bundle identifier. **This becomes permanent the moment you first publish** - Google
Play won't let you change it later. If you want something different, change it in
`app.json` before your first build, not after.
