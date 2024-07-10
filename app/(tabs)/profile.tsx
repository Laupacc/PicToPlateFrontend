import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Profile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [userInfo, setUserInfo] = useState({});
  const [oldIngredients, setOldIngredients] = useState([{}]);

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

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Background cellSize={25} />
      {/* <LinearGradient
        colors={["blue", "transparent", "purple", "black"]}
        className="absolute w-full h-full"
      /> */}

      <View className="flex justify-center items-center mb-2 absolute top-16">
        <Image
          source={require("../../assets/images/logo8.png")}
          className="w-60 h-14"
        />
      </View>

      <View className="flex justify-center items-center">
        <View className="flex justify-center items-center m-4">
          <Link href="/">Got to home</Link>
          <Link href="/recipesFromFridge">Got to recipes from fridge</Link>
          <Link href="/recipesCard">Got to recipes card</Link>
          <Link href="/authentication">Got to authentication</Link>
        </View>
        <View className="flex justify-center items-center m-4">
          {user.token && (
            <Text className="text-xl text-cyan-600">
              Welcome back {userInfo.username}
            </Text>
          )}
          {!user.token ? (
            <Link href="/authentication">
              <Text>Please Log in</Text>
            </Link>
          ) : (
            <TouchableOpacity onPress={handleLogout}>
              <Text>Logout</Text>
            </TouchableOpacity>
          )}

          <Text>
            You have {userInfo.favourites?.length} recipes in your favourites
          </Text>
          <Text>
            You have {userInfo.ingredients?.length} ingredients in your fridge.
          </Text>
          <View>
            <Text>
              You have {oldIngredients.length} ingredient(s) older than a week
              in your fridge. You should use them up soon! The ingredients are:
              {oldIngredients
                ? oldIngredients.map((item: any) => (
                    <Text key={item.name}>
                      {item.name} added on{" "}
                      {moment(item.dateAdded).format("MMM Do YY")}
                    </Text>
                  ))
                : null}
            </Text>
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
