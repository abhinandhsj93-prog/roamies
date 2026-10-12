# Setup

The app uses native modules (Firebase, Google sign-in), so it runs in a **development build**, not Expo Go.

## 1. Create the Firebase project

1. In the [Firebase console](https://console.firebase.google.com/), create a new project called `roamies`.
2. Add an **Android app** with the package name `app.roamies` (this has to match `android.package` in `app.json`).
3. Download `google-services.json` and put it in the repo root. It is gitignored; see "EAS builds" below.
4. Go to **Authentication → Sign-in method** and enable **Google**. Under "Web SDK configuration", copy the **Web client ID**.
5. Go to **Firestore Database** and create a database (region `asia-south1`, Mumbai, is closest to Kochi). Start in production mode.

## 2. Local env

```bash
cp .env.example .env
# paste the Web client ID into EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
npm install
```

## 3. Add SHA-1 fingerprints

Google sign-in on Android fails with `DEVELOPER_ERROR` until the signing key's SHA-1 is registered in Firebase.

- **EAS builds:** run `npx eas-cli@latest credentials -p android` and copy the SHA-1 for each build profile.
- **Local builds:** run `cd android && ./gradlew signingReport` after `npx expo prebuild`.

Add each one under Firebase → Project settings → your Android app → **Add fingerprint**, then download `google-services.json` again.

## 4. Run

```bash
# Local (needs Android Studio / SDK)
npx expo run:android

# Or build in the cloud and install the APK on your phone
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

## EAS builds and google-services.json

EAS only uploads files that git tracks, so cloud builds don't see the gitignored `google-services.json`. Upload it as a file environment variable:

```bash
npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment development --environment preview --environment production
```

Then switch `app.json` to an `app.config.ts` that reads `process.env.GOOGLE_SERVICES_JSON ?? './google-services.json'`. Alternatively, since the repo is private, commit the file. It identifies the project but contains no secrets.

## Checks

```bash
npm run typecheck
```
