import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import user from "@/store/user";
import fridge from "@/store/fridge";
import recipes from "@/store/recipes";

// Combine reducers
const reducers = combineReducers({
  user: user,
  fridge: fridge,
  recipes: recipes,
});

// Configure persistence
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["user", "fridge", "recipes"],
};

const persistedReducer = persistReducer(persistConfig, reducers);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types for usage throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
