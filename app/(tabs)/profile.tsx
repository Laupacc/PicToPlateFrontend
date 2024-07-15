import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  Alert,
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
import {
  Feather,
  FontAwesome5,
  Ionicons,
  Entypo,
  FontAwesome,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, ScrollView } from "react-native-gesture-handler";

export default function Profile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [userInfo, setUserInfo] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isUpdateInfoModalVisible, setIsUpdateInfoModalVisible] =
    useState(false);
  const [oldIngredients, setOldIngredients] = useState([{}]);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const BACKEND_URL = "http://192.168.1.42:3000";

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

  const updateUsername = async () => {
    Alert.alert(
      "Update Username",
      "Are you sure you want to update your username?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await fetch(
                `${BACKEND_URL}/users/updateUsername`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: user.token,
                    newUsername,
                  }),
                }
              );

              const data = await response.json();
              if (!response.ok) {
                toast.show(data.message, { type: "danger" });
                return;
              }

              if (data.message) {
                setUserInfo((prevUserInfo) => ({
                  ...prevUserInfo,
                  username: newUsername,
                }));
                setNewUsername("");
                setIsUpdateInfoModalVisible(false);
                toast.show(data.message, { type: "success" });
              } else {
                toast.show("Failed to update username", { type: "danger" });
              }
            } catch (error) {
              console.error("Error updating username:", error);
              toast.show("An error occurred. Please try again.", {
                type: "warning",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const updatePassword = async () => {
    Alert.alert(
      "Update Password",
      "Are you sure you want to update your password?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await fetch(
                `${BACKEND_URL}/users/updatePassword`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: user.token,
                    newPassword,
                  }),
                }
              );
              const data = await response.json();
              if (response.ok) {
                toast.show(data.message, { type: "success" });
                setNewPassword("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show(data.message, { type: "danger" });
              }
            } catch (error) {
              console.error("Error updating password:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

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

  const randomPostitImage = () => {
    const images = [
      require("../../assets/images/stickers/postit1.png"),
      require("../../assets/images/stickers/postit2.png"),
      require("../../assets/images/stickers/postit3.png"),
      require("../../assets/images/stickers/postit4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const toggleIsNewPasswordVisible = () => {
    setIsNewPasswordVisible(!isNewPasswordVisible);
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
            {user.token ? (
              <View className="absolute top-3 right-3">
                <TouchableOpacity
                  onPress={() => setIsUpdateInfoModalVisible(true)}
                >
                  <FontAwesome5 name="user-cog" size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>
            ) : null}
            <Image
              source={require("../../assets/images/avatar.png")}
              className="w-20 h-20 rounded-full"
            />
            {/* User info */}
            {user.token ? (
              <View>
                <View className="border border-slate-300 px-2 rounded-lg">
                  <Text className="text-xl text-cyan-600">
                    {userInfo.username}
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="text-xl text-cyan-600">Guest</Text>
            )}

            {/* Login, logout*/}
            {!user.token ? (
              <TouchableOpacity className="flex flex-row justify-center items-center">
                <Link href="/authentication">
                  <Text className="text-lg font-Nobile">Login</Text>
                  <Image
                    source={require("@/assets/images/login.png")}
                    alt="button"
                    className="w-9 h-9 m-1"
                  />
                </Link>
              </TouchableOpacity>
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

      {/* Update info modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isUpdateInfoModalVisible}
        onRequestClose={() => {
          setIsUpdateInfoModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className=" bg-slate-50 rounded-lg p-8" style={styles.shadow}>
            <Text className="text-xl text-center">Update Information</Text>
            <View className="flex-row justify-center items-center">
              <TextInput
                placeholder="New Username"
                value={newUsername}
                onChangeText={(text) => setNewUsername(text)}
                autoCapitalize="none"
                className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
              />
              <TouchableOpacity
                onPress={updateUsername}
                className="bg-[#51A0FF] rounded-lg p-2 m-2"
              >
                <Entypo name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-center items-center">
              <View className="relative">
                <TextInput
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={(text) => setNewPassword(text)}
                  secureTextEntry={!isNewPasswordVisible}
                  autoCapitalize="none"
                  className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                />
                <TouchableOpacity
                  onPress={toggleIsNewPasswordVisible}
                  className="absolute right-5 top-5"
                >
                  <FontAwesome
                    name={!isNewPasswordVisible ? "eye" : "eye-slash"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={updateUsername}
                className="bg-[#51A0FF] rounded-lg p-2 m-2"
              >
                <Entypo name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsUpdateInfoModalVisible(false);
                setNewPassword("");
                setNewUsername("");
              }}
            >
              <Text className="text-lg text-center mt-4">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Postits*/}
      <View className="flex flex-row justify-center items-center">
        {/* Middle Postit 1*/}
        <View
          className="flex justify-center items-center relative w-40 h-40 m-1"
          style={styles.shadow}
        >
          <Image
            source={randomPostitImage()}
            className="absolute inset-0 w-full h-full"
          />
          <Image
            source={require("../../assets/images/heart1.png")}
            className="w-10 h-10"
          />
          <Text className="text-center text-2xl font-Flux text-slate-700">
            {userInfo.favourites?.length}
          </Text>
          <Text className="text-center text-lg font-Flux text-slate-700">
            favourite recipes
          </Text>
        </View>

        {/* Middle Postit 2 */}
        <View
          className="flex justify-center items-center relative w-40 h-40 m-1"
          style={styles.shadow}
        >
          <Image
            source={randomPostitImage()}
            className="absolute inset-0 w-full h-full"
          />
          <Image
            source={require("../../assets/images/missingIng.png")}
            className="w-10 h-10"
          />
          <Text className="text-center text-2xl font-Flux text-slate-700">
            {userInfo.ingredients?.length}
          </Text>
          <Text className="text-center text-lg font-Flux text-slate-700">
            ingredients saved
          </Text>
        </View>
      </View>

      {/* Bottom Box */}
      {/* <View className="flex justify-center items-center">
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
      </View> */}

      {/* Old ingredients */}
      <View
        className="flex justify-center items-center relative w-96 h-56 m-1"
        style={styles.shadow}
      >
        <Image
          source={require("../../assets/images/recipeBack/recipeBack19.png")}
          className="absolute inset-0 w-full h-full"
        />
        {oldIngredients.length > 0 ? (
          <View className="flex justify-center items-center m-2 p-2 top-4">
            <Text className="text-base font-Flux text-slate-700 text-center">
              You have {oldIngredients.length} ingredient(s) older than a week :
            </Text>
            <View className="h-24 overflow-y-auto">
              <FlatList
                contentContainerStyle={{
                  marginTop: 10,
                }}
                data={oldIngredients}
                renderItem={({ item }) => (
                  <View className="flex flex-row justify-center items-center">
                    <Text
                      className="text-lg font-Nobile text-red-600 text-center"
                      key={item._id}
                    >
                      - {item.name}{" "}
                    </Text>
                    <Text className="text-md font-Nobile text-red-600 text-center">
                      (added on {moment(item.dateAdded).format("MMM Do YYYY")})
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item._id}
              />
            </View>
          </View>
        ) : (
          <View className="flex justify-center items-center mt-4">
            <Text className="text-xl font-Flux text-slate-700">Well done!</Text>
            <Text className="text-xl font-Flux text-slate-700">
              Everything is fresh!
            </Text>
            <Image
              source={require("../../assets/images/applause.png")}
              className="w-20 h-20"
            />
          </View>
        )}
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
