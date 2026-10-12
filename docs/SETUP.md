# Setup

## Quick preview (no Firebase needed)

The screens run without Firebase, so you can try the UI right away. Sign-in is just switched off there.

```bash
npm install
npx expo start --go     # scan the QR code with the Expo Go app on your Android phone
npx expo start --web    # or open it in a browser
```

## Full app

Sign-in uses native modules (Firebase, Google sign-in), so the full app runs in a **development build**, not Expo Go.

## 1. Create the Firebase project

1. In the [Firebase console](https://console.firebase.google.com/), create a new project called `roamies`.
2. Add an **Android app** with the package name `app.roamies` (this has to match `android.package` in `app.json`).
3. Download `google-services.json` and put it in the repo root. It is committed (the repo is private), so EAS cloud builds pick it up.
4. Go to **Authentication → Sign-in method** and enable **Google**. Under "Web SDK configuration", copy the **Web client ID**.
5. Go to **Firestore Database** and create a database (region `asia-south1`, Mumbai, is closest to Kochi). Start in production mode.

## 2. Local env

```bash
cp .env.example .env
# .env.example already has the Web client ID (it is public; EAS builds get it from eas.json)
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

## google-services.json

The file is committed because the repo is private and EAS only uploads files git tracks. It identifies the Firebase project (`roamies-99c10`) but holds no passwords. Its Android API key is restricted to this app's package and SHA-1 once fingerprints are added. Whenever you add a SHA-1, download it again and commit the new copy.

## Checks

```bash
npm run typecheck
```
