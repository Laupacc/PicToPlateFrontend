import { Image, StyleSheet, Platform, View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Text className="text-cyan-800">Home Page</Text>
      <Link href="/(tabs)/profile" className="text-blue-500">
        Go to Profile
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
