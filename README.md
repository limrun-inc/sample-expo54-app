# Limrun Expo Test App

This is a small Expo Go app built for Limrun automated testing examples. It
exposes stable React Native `testID`s so frameworks like Detox and Maestro can
drive a visible end-to-end flow on a Limrun remote iOS simulator.

## Run With Expo Go

```bash
npm install
npm run tunnel
```

Copy the `exp://` tunnel URL from Expo CLI and use it as `EXPO_URL` in a
Limrun TypeScript SDK example such as `examples/detox-ios` or
`examples/maestro-ios`.

Tunnel support is included through the local `@expo/ngrok` dev dependency.

The local `with-pod-deployment-target` plugin applies Expo SDK 54's iOS 15.1
minimum to CocoaPods resource bundles for Xcode 27. It covers the
[upstream fix](https://github.com/expo/expo/pull/47562) that ships in SDK 57.

## Test Contract

The Limrun example expects these stable selectors:

- `demo-home-screen`
- `demo-home-title`
- `demo-counter-value`
- `demo-increment-button`
- `demo-decrement-button`
- `demo-name-input`
- `demo-submit-name-button`
- `demo-greeting-message`
- `demo-open-detail-button`
- `demo-detail-screen`
- `demo-automation-switch`
- `demo-complete-task-button`
- `demo-success-message`
- `demo-reset-button`

Examples also assert the visible text `Limrun Expo Test App`,
`Hello, Limrun!`, and `Success: Limrun completed the automated test flow.`

The app intentionally avoids custom native modules so it can run inside Expo Go.
