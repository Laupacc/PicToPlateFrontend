import { Image, StyleSheet, Platform, View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function Favourite() {
  return (
    <SafeAreaView style={styles.container}>
      <Text className="text-cyan-800">Favourite</Text>
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
