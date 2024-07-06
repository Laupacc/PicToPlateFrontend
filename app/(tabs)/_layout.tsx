import { Tabs } from "expo-router";
import React from "react";
import {
  Platform,
  useColorScheme,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
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
          fontSize: 14,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          // marginBottom: -3,
          // marginTop: 3,
        },
        tabBarStyle: {
          position: "absolute",
          height: Platform.OS === "ios" ? 80 : 70,
          bottom: 15,
          left: 10,
          right: 10,
          borderRadius: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: "#cbd5e1", // light grey
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
                <Image
                  source={
                    focused
                      ? require("../../assets/images/tabBarIcons/searchRamen.png")
                      : require("../../assets/images/tabBarIcons/searchRamen_outline.png")
                  }
                  style={{
                    width: 45,
                    height: 45,
                  }}
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
                <Image
                  source={
                    focused
                      ? require("../../assets/images/tabBarIcons/heartInPlate.png")
                      : require("../../assets/images/tabBarIcons/heartInPlate_outline.png")
                  }
                  style={{
                    width: 45,
                    height: 45,
                  }}
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
                  top: -15,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#85c3e7", // blue
                  ...styles.shadow,
                }}
              >
                <Image
                  source={
                    focused
                      ? require("../../assets/images/tabBarIcons/camera1.png")
                      : require("../../assets/images/tabBarIcons/camera1_outline.png")
                  }
                  style={{
                    width: 45,
                    height: 45,
                  }}
                />
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="notSureYet"
        options={{
          title: "notSureYet",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View>
                <Image
                  source={
                    focused
                      ? require("../../assets/images/tabBarIcons/shrug.png")
                      : require("../../assets/images/tabBarIcons/shrug_outline.png")
                  }
                  style={{
                    width: 45,
                    height: 45,
                  }}
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
                <Image
                  source={
                    focused
                      ? require("../../assets/images/tabBarIcons/pantry.png")
                      : require("../../assets/images/tabBarIcons/pantry_outline.png")
                  }
                  style={{
                    width: 45,
                    height: 45,
                  }}
                />
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
