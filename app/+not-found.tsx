import React from "react";
import { Stack } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";

import { ThemedText } from "@/components/examples/ThemedText";
import { ThemedView } from "@/components/examples/ThemedView";

export default function NotFoundScreen() {
  const navigation = useNavigation<any>();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        <TouchableOpacity onPress={() => navigation.navigate("(tabs)/search")}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
