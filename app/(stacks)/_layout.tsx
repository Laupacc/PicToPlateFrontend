import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function StackLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle="dark-content" />
      <Stack>
        <Stack.Screen name="addItemsFridge" options={{ headerShown: false }} />
        <Stack.Screen name="insideRecipe" options={{ headerShown: false }} />
        <Stack.Screen name="recipeResults" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
