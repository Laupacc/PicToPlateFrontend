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
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import { persistStore, persistReducer } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import user from "@/store/user";
import fridge from "@/store/fridge";
import recipes from "@/store/recipes";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Nobile: require("../assets/fonts/Nobile-Regular.ttf"),
    NobileBold: require("../assets/fonts/Nobile-Bold.ttf"),
    Maax: require("../assets/fonts/Maax.ttf"),
    Steradian: require("../assets/fonts/Steradian-Rg.ttf"),
    ConceptDraft: require("../assets/fonts/ConceptDraft.otf"),
    CreamyCookies: require("../assets/fonts/Creamycookies.otf"),
    Sketch: require("../assets/fonts/Sketch.ttf"),
    Flux: require("../assets/fonts/Flux_Architect_Regular.ttf"),
  });

  // Hide the splash screen when the app is loaded.
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Wait for the fonts to load before rendering the app.
  if (!loaded) {
    return null;
  }

  // const reducers = combineReducers({
  //   user: user,
  //   fridge: fridge,
  //   recipes: recipes,
  // });

  // const persistConfig = {
  //   key: "root",
  //   storage: AsyncStorage,
  //   whitelist: ["user", "fridge", "recipes"],
  // };

  // const persistedReducer = persistReducer(persistConfig, reducers);

  // const store = configureStore({
  //   reducer: persistedReducer,
  //   middleware: (getDefaultMiddleware) =>
  //     getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  // });

  // const persistor = persistStore(store);

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
