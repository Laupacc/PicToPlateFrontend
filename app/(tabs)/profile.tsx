import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/user";
import * as SecureStore from "expo-secure-store";
import Background from "@/components/Background";

export default function Profile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const handleLogout = async () => {
    if (!user.token) {
      return;
    }
    await SecureStore.deleteItemAsync("token");
    dispatch(logout());
    alert("Logged out");
  };
  console.log(user);
  return (
    <SafeAreaView style={styles.container}>
      <Background cellSize={25} />

      <View className="flex justify-center items-center mb-2 absolute top-16">
        <Image
          source={require("../../assets/images/logo8.png")}
          className="w-60 h-14"
        />
      </View>

      <View className="flex justify-center items-center">
        <Text className="text-cyan-800">Profile</Text>
        <Link href="/">Got to home</Link>
        <Link href="/recipesFromFridge">Got to recipes from fridge</Link>
        <Link href="/recipesCard">Got to recipes card</Link>
        <Link href="/authentication">Got to authentication</Link>
        {user.token && (
          <Text className="text-xl text-cyan-600">
            Welcome back {user.username}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
