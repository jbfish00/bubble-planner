# Android (Google Play Store) Setup

Bubble Planner is wrapped with [Capacitor](https://capacitorjs.com/) to ship to the Play Store as a native Android app while keeping a single React/Vite codebase.

## Prerequisites

- **Node 20+**, **npm**
- **Android Studio** (Hedgehog or newer)
- **JDK 17** (Android Gradle Plugin 8 requirement)

## First-time setup

```bash
npm install
npm run build
npm run android:init   # creates the /android native project
npm run android:sync   # copies the dist/ build into the Android shell
npm run android:open   # opens the project in Android Studio
```

In Android Studio:

1. Wait for Gradle sync to finish.
2. Plug in a device or start an emulator.
3. Click **Run** (the green play button).

## After every code change

```bash
npm run android:sync   # rebuilds the web app and syncs into Android
```

Or, to build + sync + run in one shot on a connected device:

```bash
npm run android:run
```

## Push notification reminders

The app uses `@capacitor/local-notifications` to schedule a 9 AM reminder on each task's due date. No backend required — schedules are handled on-device.

The first time the user launches the app, they'll be prompted for notification permission (see `src/App.tsx`).

To enable Firebase-based **remote** push notifications later, add `google-services.json` to `android/app/` and follow the [Capacitor push docs](https://capacitorjs.com/docs/apis/push-notifications).

## Building the release APK / AAB

```bash
npm run android:sync
cd android
./gradlew bundleRelease   # produces android/app/build/outputs/bundle/release/app-release.aab
```

Sign the AAB with your upload key, then upload to [Play Console](https://play.google.com/console/).

## App identity

- **Application ID:** `com.bubbleplanner.app`
- **App name:** `Bubble Planner`

Both are set in `capacitor.config.ts`.
