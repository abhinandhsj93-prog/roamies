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

## Live places API (Cloudflare Worker)

`worker/` writes a guide the first time anyone opens the app in a new place, then serves it from Firestore. It runs on the Cloudflare Workers free plan, and GitHub deploys it on every push that touches `worker/`.

One-time setup:

1. **Firestore:** in Firebase, open **Firestore Database** and create a database if there isn't one yet (region `asia-south1`, production mode).
2. **Firebase service account:** go to Firebase → Project settings → **Service accounts** → **Generate new private key**. This downloads a JSON file.
3. **Gemini key:** go to [aistudio.google.com](https://aistudio.google.com) → **Get API key** → Create API key.
4. **Cloudflare:** sign up at [dash.cloudflare.com](https://dash.cloudflare.com). Copy the **Account ID** from the right side of the Workers & Pages overview. Then go to My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template.
5. **GitHub repository secrets** (repo → Settings → Secrets and variables → Actions → New repository secret):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `GEMINI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT`, which is the whole JSON file from step 2
6. Re-run the **Deploy places API** workflow (Actions tab → Deploy places API → Run workflow). The log prints the worker URL, `https://roamies-api.<your-subdomain>.workers.dev`.
7. Add that URL as a repository **variable** (same page, Variables tab) named `ROAMIES_API_URL`. Then re-run **Android APK** so the app uses it.

Try it in a browser: `https://roamies-api.<your-subdomain>.workers.dev/place?lat=9.9658&lng=76.2421` (Fort Kochi). The first call takes up to a minute while it writes the guide.

The model is set in `worker/wrangler.toml` (`AI_PROVIDER`, `AI_MODEL`). Run the tests with `cd worker && npm test`.
