import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useDispatch } from "react-redux";
import { login } from "@/store/user";

export default function Index() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // Check if token exists in SecureStore and logs in automatically or navigates to authentication screen
  const checkTokenOrLogin = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        dispatch(login({ token }));
        console.log("Token found, navigating to search screen");
        navigation.navigate("(tabs)", { screen: "search" });
      } else {
        navigation.navigate("authentication");
        console.log("No token found");
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
  };

  // Function to return a random background image
  const randomBackgroundImages = () => {
    const images = [
      require("../assets/images/backgrounds/background1.jpg"),
      require("../assets/images/backgrounds/background2.jpg"),
      require("../assets/images/backgrounds/background5.png"),
      require("../assets/images/backgrounds/background6.jpg"),
      require("../assets/images/backgrounds/background7.jpg"),
      require("../assets/images/backgrounds/background8.jpg"),
      require("../assets/images/backgrounds/background9.jpg"),
      require("../assets/images/backgrounds/background11.jpg"),
      require("../assets/images/backgrounds/background12.jpg"),
      require("../assets/images/backgrounds/background13.jpg"),
      require("../assets/images/backgrounds/background14.jpg"),
      require("../assets/images/backgrounds/background15.jpg"),
      require("../assets/images/backgrounds/background16.jpg"),
      require("../assets/images/backgrounds/background17.jpg"),
      require("../assets/images/backgrounds/background18.jpg"),
      require("../assets/images/backgrounds/background19.jpg"),
      require("../assets/images/backgrounds/background20.jpg"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  // Function to return a random catch phrase
  const randomCatchPhrases = () => {
    const catchPhrases = [
      "From Pantry to Plate",
      "From Fridge to Feast",
      "Inspired by Your Pantry",
      "Flavours from Your Fridge",
    ];
    return catchPhrases[Math.floor(Math.random() * catchPhrases.length)];
  };

  // Function to return a random enter phrase in the button
  const randomEnterPhrases = () => {
    const enterPhrases = [
      "Get Sizzlin'",
      "Whip It Up",
      "Spice It Up",
      "Chop Chop",
    ];
    return enterPhrases[Math.floor(Math.random() * enterPhrases.length)];
  };

  return (
    <View className="flex-1 justify-center items-center">
      <StatusBar barStyle="light-content" />
      <View className="w-full h-full relative flex justify-center items-center">
        <Image
          className="bg-cover bg-center relative w-full h-full"
          source={randomBackgroundImages()}
        />
        <LinearGradient
          colors={["transparent", "black"]}
          className="absolute w-full h-full"
        />

        <View className="absolute">
          <Text className="text-5xl text-slate-300 text-center m-3 top-40 font-CreamyCookies">
            {randomCatchPhrases()}
          </Text>
        </View>

        <View className="absolute bottom-32">
          <TouchableOpacity
            className="border-2 border-sky-700 p-4 rounded-xl"
            onPress={checkTokenOrLogin}
          >
            <Text className="text-3xl text-sky-700 text-center font-Nobile">
              {randomEnterPhrases()}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="absolute bottom-10">
          <Image
            source={require("../assets/images/logo8.png")}
            className="w-40 h-10"
          />
        </View>

        <View className="absolute bottom-8"></View>
      </View>
    </View>
  );
}
