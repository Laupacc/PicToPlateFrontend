import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { TabBarIcon } from "@/components/TabBarIcon";
import { Colors } from "@/constants/Colors";

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
        // tabBarStyle: {
        //   borderTopLeftRadius: 30,
        //   borderTopRightRadius: 30,
        //   backgroundColor: Colors[colorScheme ?? "light"].background,
        //   padding: 5,
        //   height: 70,
        //   position: "absolute",
        //   bottom: 0,
        //   left: 0,
        //   right: 0,
        //   overflow: "hidden",
        //   elevation: 0,
        // },
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "restaurant" : "restaurant-outline"}
              color={color}
              iconSet="Ionicons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "heart" : "heart-outline"}
              color={color}
              iconSet="MaterialCommunityIcons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={"camera-retro"}
              color={color}
              iconSet="FontAwesome"
              size={40}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: "Fridge",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "fridge" : "fridge-outline"}
              color={color}
              iconSet="MaterialCommunityIcons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={"user-secret"}
              color={color}
              iconSet="FontAwesome"
            />
          ),
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
