import { Tabs } from "expo-router";
import React from "react";
import {
  Platform,
  useColorScheme,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarLabelStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          fontSize: 14,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          marginBottom: -3,
          marginTop: 3,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          borderRadius: 20,
          backgroundColor: "#e2e8f0",
          ...styles.shadow,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View>
                <Ionicons
                  name={focused ? "restaurant" : "restaurant-outline"}
                  color={color}
                  size={28}
                />
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View>
                <MaterialCommunityIcons
                  name={focused ? "heart" : "heart-outline"}
                  color={color}
                  size={28}
                />
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={{
                  top: Platform.OS === "ios" ? -10 : -20,
                  width: Platform.OS === "ios" ? 50 : 60,
                  height: Platform.OS === "ios" ? 50 : 60,
                  borderRadius: Platform.OS === "ios" ? 25 : 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors[colorScheme ?? "light"].tint,
                  ...styles.shadow,
                }}
              >
                <FontAwesome
                  name={focused ? "camera-retro" : "camera-retro"}
                  color={Colors[colorScheme ?? "light"].background}
                  size={40}
                />
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="fridge"
        options={{
          title: "Fridge",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View>
                <MaterialCommunityIcons
                  name={focused ? "fridge" : "fridge-outline"}
                  color={color}
                  size={28}
                />
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View>
                <FontAwesome name={"user-secret"} color={color} size={28} />
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="recipeCard"
        options={{
          tabBarButton: () => null,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="recipesFromFridge"
        options={{
          tabBarButton: () => null,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="addItemsFridge"
        options={{
          tabBarButton: () => null,
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#7F5DF0",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});
