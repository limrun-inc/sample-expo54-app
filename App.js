import { StatusBar } from 'expo-status-bar';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useState } from 'react';
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [done, setDone] = useState(false);

  const submitName = () => {
    setSubmittedName(name.trim() || 'Tester');
    Keyboard.dismiss();
  };

  const reset = () => {
    setScreen('home');
    setCount(0);
    setName('');
    setSubmittedName('');
    setEnabled(false);
    setDone(false);
  };

  if (screen === 'details') {
    const success = enabled && done;

    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container} testID="demo-detail-screen">
            <StatusBar style="light" />
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Step 2</Text>
              <Text style={styles.title}>Remote simulator actions</Text>
              <Text style={styles.body}>
                An automated test is now driving Expo Go on a Limrun iOS simulator.
              </Text>

              <View style={styles.actionCard}>
                <View>
                  <Text style={styles.rowLabel}>Automation switch</Text>
                  <Text style={styles.rowSubtext}>Toggle state through the test flow</Text>
                </View>
                <Switch
                  testID="demo-automation-switch"
                  value={enabled}
                  onValueChange={setEnabled}
                  trackColor={{ false: '#d6deea', true: '#4ade80' }}
                  thumbColor="#ffffff"
                />
              </View>

              <Pressable
                testID="demo-complete-task-button"
                style={[styles.secondaryButton, done && styles.secondaryButtonActive]}
                onPress={() => setDone(true)}
              >
                <Text style={styles.secondaryButtonText}>
                  {done ? 'Checklist item complete' : 'Complete checklist item'}
                </Text>
              </Pressable>

              {success ? (
                <Text testID="demo-success-message" style={styles.success}>
                  Success: Limrun completed the automated test flow.
                </Text>
              ) : (
                <Text style={styles.hint}>Turn on the switch and complete the checklist.</Text>
              )}

              <Pressable testID="demo-reset-button" style={styles.linkButton} onPress={reset}>
                <Text style={styles.linkButtonText}>Reset demo</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container} testID="demo-home-screen">
          <StatusBar style="light" />
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Limrun sample app</Text>
            <Text testID="demo-home-title" style={styles.title}>
              Limrun Expo Test App
            </Text>
            <Text style={styles.body}>
              A tiny Expo Go app built to show automated testing frameworks tapping, typing, asserting,
              navigating, and capturing screenshots on a remote iOS simulator.
            </Text>

            <View style={styles.skiaPanel}>
              <Canvas style={styles.skiaCanvas}>
                <Circle cx={46} cy={44} r={30} color="#2563eb" />
                <Circle cx={80} cy={44} r={30} color="#14b8a6" />
                <Circle cx={114} cy={44} r={30} color="#f97316" />
              </Canvas>
              <Text testID="skia-working-message" style={styles.skiaStatus}>
                skia is working
              </Text>
            </View>

            <View style={styles.counterPanel}>
              <View>
                <Text style={styles.rowLabel}>Counter</Text>
                <Text style={styles.rowSubtext}>Fast tap feedback</Text>
              </View>
              <View style={styles.counterRow}>
                <Text testID="demo-counter-value" style={styles.counter}>
                  {count}
                </Text>
                <View style={styles.buttonRow}>
                  <Pressable testID="demo-decrement-button" style={styles.roundButton} onPress={() => setCount(count - 1)}>
                    <Text style={styles.roundButtonText}>-</Text>
                  </Pressable>
                  <Pressable testID="demo-increment-button" style={styles.roundButtonPrimary} onPress={() => setCount(count + 1)}>
                    <Text style={styles.roundButtonPrimaryText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <TextInput
              testID="demo-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Type a tester name"
              placeholderTextColor="#8fa3bd"
              returnKeyType="done"
              onSubmitEditing={submitName}
            />
            <Pressable
              testID="demo-submit-name-button"
              style={styles.primaryButton}
              onPress={submitName}
            >
              <Text style={styles.primaryButtonText}>Submit name</Text>
            </Pressable>

            {submittedName ? (
              <Text testID="demo-greeting-message" style={styles.greeting}>
                Hello, {submittedName}!
              </Text>
            ) : (
              <Text style={styles.hint}>Submit a name before opening the detail screen.</Text>
            )}

            <Pressable testID="demo-open-detail-button" style={styles.secondaryButton} onPress={() => setScreen('details')}>
              <Text style={styles.secondaryButtonText}>Open detail flow</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  eyebrow: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 35,
    marginBottom: 10,
  },
  body: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  skiaPanel: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dbeafe',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  skiaCanvas: {
    height: 88,
    width: 160,
  },
  skiaStatus: {
    color: '#15803d',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  counterPanel: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 15,
    marginBottom: 14,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    padding: 15,
  },
  rowLabel: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtext: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  counterRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  counter: {
    color: '#0f172a',
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 50,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  roundButtonText: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '800',
  },
  roundButtonPrimary: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  roundButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe3ed',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    marginTop: 12,
    paddingVertical: 13,
  },
  secondaryButtonActive: {
    backgroundColor: '#16a34a',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  greeting: {
    color: '#15803d',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  success: {
    color: '#15803d',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 16,
  },
  hint: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
  },
});
