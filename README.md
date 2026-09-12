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

## iOS deployment target

Native builds target iOS 15.1, the minimum supported by Expo SDK 54.
`expo-build-properties` sets the app target. The local
`with-pod-deployment-target` plugin raises lower CocoaPods targets to the same
minimum during `pod install`, including ReachabilitySwift's privacy manifest
bundle. This prevents Xcode 27 from rejecting that bundle's iOS 12 target.
Targets that already require a newer iOS version keep their minimum.

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
