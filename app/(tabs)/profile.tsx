import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { Modal } from "react-native-paper";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  Entypo,
  FontAwesome,
  AntDesign,
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
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const BACKEND_URL = "http://192.168.114.158:3000";

  const handleLogout = async () => {
    if (!user.token) {
      return;
    }
    await SecureStore.deleteItemAsync("token");
    dispatch(logout());
    toast.show("Logged out successfully", {
      type: "normal",
      placement: "top",
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
    if (!newUsername) {
      toast.show("Please enter a new username", {
        type: "warning",
        placement: "top",
      });
      return;
    }

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
                toast.show(data.message, { type: "success", placement: "top" });
              } else {
                toast.show("Failed to update username", {
                  type: "danger",
                  placement: "top",
                });
              }
            } catch (error) {
              console.error("Error updating username:", error);
              toast.show("An error occurred. Please try again.", {
                type: "warning",
                placement: "top",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const updatePassword = async () => {
    if (!newPassword) {
      toast.show("Please enter a new password", {
        type: "warning",
        placement: "top",
      });
      return;
    }
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
                toast.show(data.message, { type: "success", placement: "top" });
                setNewPassword("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show(data.message, { type: "danger", placement: "top" });
              }
            } catch (error) {
              console.error("Error updating password:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "top",
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

  const avatarImages = [
    require("../../assets/images/avatars/friedChicken.png"),
    require("../../assets/images/avatars/hamburger.png"),
    require("../../assets/images/avatars/pizza.png"),
    require("../../assets/images/avatars/ramen.png"),
    require("../../assets/images/avatars/steak.png"),
    require("../../assets/images/avatars/fruitBowl.png"),
    require("../../assets/images/avatars/sushi.png"),
    require("../../assets/images/avatars/poutine.png"),
    require("../../assets/images/avatars/taco.png"),
    require("../../assets/images/avatars/thaiFood.png"),
    require("../../assets/images/avatars/salad.png"),
    require("../../assets/images/avatars/fish.png"),
  ];

  useEffect(() => {
    const loadAvatar = async () => {
      const savedAvatar = await AsyncStorage.getItem("selectedAvatar");
      if (savedAvatar !== null) {
        setSelectedAvatar(JSON.parse(savedAvatar));
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          avatar: savedAvatar,
        }));
      }
    };
    loadAvatar();
  }, []);

  const handleAvatarSelect = async (avatar) => {
    setSelectedAvatar(avatar);
    setUserInfo((prevUserInfo) => ({
      ...prevUserInfo,
      avatar: avatar,
    }));
    setIsAvatarPickerVisible(false);
    await AsyncStorage.setItem("selectedAvatar", JSON.stringify(avatar));
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      {/* <LinearGradient
        colors={["transparent", "transparent", "#0891b2"]}
        className="absolute top-0 left-0 right-0 bottom-0"
      /> */}
      <Background cellSize={25} />

      <View className="flex justify-center items-center">
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

      <View className="flex-1 justify-center items-center">
        {/* Top Box */}
        <View className="flex justify-center items-center mb-4 -mt-16">
          <View className="flex justify-center items-center relative">
            <View
              className="absolute bg-[#9333ea] rounded-2xl -right-1.5 -bottom-1.5"
              style={{
                width: screenWidth - 45,
                height: 270,
                ...styles.shadow,
              }}
            ></View>
            <View
              className="flex justify-center items-center bg-white rounded-2xl"
              style={{
                width: screenWidth - 45,
                height: 270,
              }}
            >
              {/* Edit Info Modal Button */}
              {user.token && (
                <View className="absolute top-3 right-3 flex-row">
                  <TouchableOpacity
                    onPress={() => setIsUpdateInfoModalVisible(true)}
                  >
                    <FontAwesome5 name="user-edit" size={24} color="#4b5563" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Avatar */}
              <TouchableOpacity onPress={() => setIsAvatarPickerVisible(true)}>
                <Image
                  source={
                    selectedAvatar ||
                    require("../../assets/images/avatars/poutine.png")
                  }
                  className="w-20 h-20"
                />
              </TouchableOpacity>

              {/* User info */}
              {user.token ? (
                <View className="flex justify-center items-center m-2">
                  <View className="bg-slate-100 border border-slate-200 rounded-lg w-60 h-10 font-Nobile justify-center items-center m-1">
                    <Text className="text-xl text-cyan-600">
                      {userInfo.username}
                    </Text>
                  </View>
                  <View className="bg-slate-100 border border-slate-200 rounded-lg w-60 h-10 font-Nobile justify-center items-center m-1">
                    <Text className="text-md text-cyan-600">
                      {userInfo.email}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="bg-slate-100 border border-slate-200 rounded-lg w-32 h-10 font-Nobile justify-center items-center m-2">
                  <Text className="text-xl text-cyan-600">Guest</Text>
                </View>
              )}

              {/* Login, logout*/}
              {!user.token ? (
                <View className="flex mt-10 items-center justify-center">
                  <Link
                    href="/authentication"
                    className="flex flex-row justify-center items-center"
                  >
                    <View className="flex flex-row">
                      <Text className="text-lg font-Nobile mx-1">Login</Text>
                      <AntDesign
                        name="login"
                        size={24}
                        color="black"
                        className="w-9 h-9"
                      ></AntDesign>
                    </View>
                  </Link>
                  <Text> to see your profile</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex flex-row justify-center items-center mt-5"
                >
                  <Text className="text-lg font-Nobile m-1">Logout</Text>
                  <AntDesign
                    name="logout"
                    size={24}
                    color="black"
                    className="w-9 h-9"
                  ></AntDesign>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

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
            <Text className="text-center text-xl font-Flux text-slate-700">
              {userInfo.favourites?.length}
            </Text>
            <Text className="text-center text-md font-Flux text-slate-700">
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
            <Text className="text-center text-xl font-Flux text-slate-700">
              {userInfo.ingredients?.length}
            </Text>
            <Text className="text-center text-md font-Flux text-slate-700">
              ingredients saved
            </Text>
          </View>
        </View>

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
                You have {oldIngredients.length} ingredient(s) older than a week
                :
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
                        (added on {moment(item.dateAdded).format("MMM Do YYYY")}
                        )
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item) => item._id}
                />
              </View>
            </View>
          ) : (
            <View className="flex justify-center items-center mt-4">
              <Text className="text-xl font-Flux text-slate-700">
                Well done!
              </Text>
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
      </View>

      {/* Update info modal */}
      <Modal
        visible={isUpdateInfoModalVisible}
        onDismiss={() => setIsUpdateInfoModalVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View
            className="flex justify-between items-center bg-slate-50 rounded-lg w-80 h-72 p-4"
            style={styles.shadow}
          >
            <Text className="text-xl text-center font-Nobile">
              Update Information
            </Text>
            <View>
              <View className="flex-row justify-center items-center">
                <TextInput
                  placeholder="New Username"
                  value={newUsername}
                  onChangeText={(text) => setNewUsername(text)}
                  autoCapitalize="none"
                  className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2 font-Nobile"
                />
                <View style={styles.shadow}>
                  <TouchableOpacity onPress={updateUsername}>
                    <Image
                      source={require("../../assets/images/yesIcon.png")}
                      className="w-10 h-10 m-1"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row justify-center items-center">
                <View className="relative">
                  <TextInput
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={(text) => setNewPassword(text)}
                    secureTextEntry={!isNewPasswordVisible}
                    autoCapitalize="none"
                    className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2 font-Nobile"
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
                <View style={styles.shadow}>
                  <TouchableOpacity onPress={updatePassword}>
                    <Image
                      source={require("../../assets/images/yesIcon.png")}
                      className="w-10 h-10 m-1"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsUpdateInfoModalVisible(false);
                setNewPassword("");
                setNewUsername("");
              }}
            >
              <Text className="text-lg text-center mt-4 font-Nobile">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        visible={isAvatarPickerVisible}
        onDismiss={() => setIsAvatarPickerVisible(false)}
        contentContainerStyle={{
          margin: 30,
        }}
      >
        <View className="flex justify-center items-center">
          <View className=" bg-slate-100 rounded-lg p-6 items-center justify-center">
            <Text className="font-bold text-gray-600 text-2xl p-2">
              Select Avatar
            </Text>
            <View className="flex-row justify-center items-center flex-wrap">
              {avatarImages.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAvatarSelect(avatar)}
                >
                  <Image source={avatar} className="w-20 h-20 m-2" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
