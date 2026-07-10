import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container} testID="vibench-template-screen">
      <StatusBar style="auto" />
      <Text style={styles.title}>ViBench Expo template</Text>
      <Text style={styles.body}>Replace this screen with the app described in the PRD.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
});
