import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import React from "react";
import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/user";
import * as SecureStore from "expo-secure-store";
import Background from "@/components/Background";
import moment from "moment";
import { useToast } from "react-native-toast-notifications";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Profile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [userInfo, setUserInfo] = useState({});
  const [oldIngredients, setOldIngredients] = useState([{}]);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const BACKEND_URL = "http://192.168.1.34:3000";

  const handleLogout = async () => {
    if (!user.token) {
      return;
    }
    await SecureStore.deleteItemAsync("token");
    dispatch(logout());
    toast.show("Logged out successfully", {
      type: "normal",
      placement: "center",
      duration: 2000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
    console.log(user);
  };

  // fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      if (user.token) {
        const response = await fetch(
          `${BACKEND_URL}/users/userInformation/${user.token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const data = await response.json();
        setUserInfo(data);
      }
    };
    fetchUser();
  }, [user.token]);
  // userInfo

  //get favourite ingredients older than 7 days from today
  useEffect(() => {
    if (userInfo.ingredients) {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const oldIngredients = userInfo.ingredients.filter(
        (item: any) => new Date(item.dateAdded) < sevenDaysAgo
      );
      console.log(oldIngredients);
      setOldIngredients(oldIngredients);
    }
  }, [userInfo.ingredients]);

  const renderOldIngredients = () => {
    if (oldIngredients.length > 0) {
      return (
        <View>
          <Text>
            You have {oldIngredients.length} ingredient(s) older than a week in
            your fridge. You should use them up soon! The ingredients are:
            {oldIngredients
              ? oldIngredients.map((item: any) => (
                  <Text key={item._id}>
                    {item.name} added on{" "}
                    {moment(item.dateAdded).format("MMM Do YY")}
                  </Text>
                ))
              : null}
          </Text>
        </View>
      );
    }
    return <Text>You have no old ingredients in your fridge.</Text>;
  };

  const randomPostitImage = () => {
    const images = [
      require("../../assets/images/stickers/postit1.png"),
      require("../../assets/images/stickers/postit2.png"),
      require("../../assets/images/stickers/postit3.png"),
      require("../../assets/images/stickers/postit4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      {/* <LinearGradient
        colors={["transparent", "transparent", "#0891b2"]}
        className="absolute top-0 left-0 right-0 bottom-0"
      /> */}
      <Background cellSize={25} />

      <View className="flex justify-center items-center mb-2 absolute top-16">
        <Image
          source={require("../../assets/images/logo8.png")}
          className="w-60 h-14"
        />
      </View>
      {/* <View className="flex justify-center items-center m-4">
        <Link href="/">Got to home</Link>
        <Link href="/recipesFromFridge">Got to recipes from fridge</Link>
        <Link href="/authentication">Got to authentication</Link>
      </View> */}

      {/* Top Box */}
      <View className="flex justify-center items-center">
        <View className="flex justify-center items-center relative">
          <View
            className="absolute bg-[#9333ea] rounded-2xl right-0.5 bottom-0.5"
            style={{
              width: screenWidth - 45,
              height: calculatedHeight,
              ...styles.shadow,
            }}
          ></View>
          <View
            className="flex justify-center items-center bg-white rounded-2xl m-2 p-2"
            style={{
              width: screenWidth - 40,
              height: calculatedHeight,
            }}
          >
            {/* <LinearGradient
              colors={["transparent", "#d97706"]}
              className="absolute top-0 left-0 right-0 bottom-0 rounded-2xl"
            /> */}

            <Image
              source={require("../../assets/images/avatar.png")}
              className="w-20 h-20 rounded-full"
            />

            {user.token ? (
              <Text className="text-xl text-cyan-600">{userInfo.username}</Text>
            ) : (
              <Text className="text-xl text-cyan-600">Guest</Text>
            )}

            {!user.token ? (
              <Link href="/authentication">
                <TouchableOpacity className="flex flex-row justify-center items-center">
                  <Text className="text-lg font-Nobile">Login</Text>
                  <Image
                    source={require("@/assets/images/login.png")}
                    alt="button"
                    className="w-9 h-9 m-1"
                  />
                </TouchableOpacity>
              </Link>
            ) : (
              <TouchableOpacity
                onPress={handleLogout}
                className="flex flex-row justify-center items-center"
              >
                <Text className="text-lg font-Nobile">Logout</Text>
                <Image
                  source={require("@/assets/images/logout1.png")}
                  alt="button"
                  className="w-9 h-9 m-1"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Middle Box 1*/}
      <View className="flex flex-row justify-center items-center">
        <View
          className="flex justify-center items-center relative w-48 h-48 m-2"
          style={styles.shadow}
        >
          <Image
            source={randomPostitImage()}
            className="absolute inset-0 w-full h-full"
          />
          <Text className="text-center text-2xl font-Flux text-slate-700">
            {userInfo.favourites?.length}
          </Text>
          <Image
            source={require("../../assets/images/heart1.png")}
            className="w-10 h-10"
          />
          <Text className="text-center text-lg font-Flux text-slate-700">
            favourite recipes
          </Text>
        </View>

        {/* Middle Box 2 */}
        <View
          className="flex justify-center items-center relative w-48 h-48 m-2"
          style={styles.shadow}
        >
          <Image
            source={randomPostitImage()}
            className="absolute inset-0 w-full h-full"
          />
          <Text className="text-center text-2xl font-Flux text-slate-700">
            {userInfo.ingredients?.length}
          </Text>
          <Image
            source={require("../../assets/images/missingIng.png")}
            className="w-10 h-10"
          />
          <Text className="text-center text-lg font-Flux text-slate-700">
            ingredients in your fridge
          </Text>
        </View>
      </View>

      {/* Bottom Box */}
      <View className="flex justify-center items-center">
        <View className="relative m-1">
          <View
            className="absolute bg-[#b91c1c] rounded-2xl right-0.5 bottom-0.5"
            style={{
              width: screenWidth - 45,
              height: calculatedHeight,
              ...styles.shadow,
            }}
          ></View>
          <View
            className="flex justify-center items-center bg-white rounded-2xl m-2 p-2"
            style={{
              width: screenWidth - 40,
              height: calculatedHeight,
            }}
          >
            <View>
              <Text className="text-xl text-center">Old Ingredients</Text>
              {renderOldIngredients()}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
