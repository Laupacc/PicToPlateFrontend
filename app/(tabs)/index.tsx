import { Image, StyleSheet, Platform, View, Text } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text className="text-cyan-800">Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
