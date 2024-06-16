import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
} from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

export default function RecipeSearch() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text className="text-cyan-800">Recipe Search</Text>
      <Link href="/recipeResults">Recipe Results</Link>
      <Link href="/insideRecipe">Inside Recipe</Link>
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
