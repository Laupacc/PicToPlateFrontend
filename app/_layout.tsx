import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "react-native-screens";
import "react-native-safe-area-context";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ToastProvider } from "react-native-toast-notifications";
import { store, persistor } from "@/store/store";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Nobile: require("../assets/fonts/Nobile-Regular.ttf"),
    NobileBold: require("../assets/fonts/Nobile-Bold.ttf"),
    NobileMedium: require("../assets/fonts/Nobile-Medium.ttf"),
    Maax: require("../assets/fonts/Maax.ttf"),
    Steradian: require("../assets/fonts/Steradian-Rg.ttf"),
    CreamyCookies: require("../assets/fonts/Creamycookies.otf"),
    Sketch: require("../assets/fonts/Sketch.ttf"),
    Flux: require("../assets/fonts/Flux_Architect_Regular.ttf"),
    Luminous: require("../assets/fonts/Luminous.otf"),
    OrleansCity: require("../assets/fonts/OrleansCity.otf"),
    RowsofSunflowers: require("../assets/fonts/RowsofSunflowers.ttf"),
    HappyWork: require("../assets/fonts/HappyWork.otf"),
  });

  // Hide the splash screen when the app is loaded.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Wait for the fonts to load before rendering the app.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="authentication" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </ToastProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
