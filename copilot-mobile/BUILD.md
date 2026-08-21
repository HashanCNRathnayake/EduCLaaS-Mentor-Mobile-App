# APK Build Steps (EAS)

Use this exact flow. Login is separate and manual.

1. One-time install

```bash
npm install -g eas-cli
```

1. Manual step (you do this)

```bash
cd copilot-mobile
eas login
```

1. Build APK after login

```bash
cd copilot-mobile
eas build -p android --profile preview
```

1. Download and install

```bash
adb install -r path/to/app.apk
```

If build still shows old app, rebuild after clearing old app from device:

```bash
adb uninstall com.educlaas.mentorapp
adb install -r path/to/app.apk
```

Notes

- `app.json` uses `expo.android.package = com.educlaas.mentorapp`.
- App version is `1.0.1` and Android `versionCode` is `2`.
- Keep your backend/ngrok reachable while testing API calls in the app.
