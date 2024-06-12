import { Image, StyleSheet, Platform, View, Text } from "react-native";
import React from "react";

export default function Recipes() {
  return (
    <View style={styles.container}>
      <Text className="text-cyan-800">Recipes</Text>
      <Image source={require("../../assets/images/react-logo.png")} />
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
