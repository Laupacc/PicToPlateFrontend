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
  ActivityIndicator,
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
import BouncingImage from "@/components/Bounce";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  Entypo,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";
import { FlatList, ScrollView } from "react-native-gesture-handler";

export default function Profile() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [userInfo, setUserInfo] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isUpdateInfoModalVisible, setIsUpdateInfoModalVisible] =
    useState(false);
  const [oldIngredients, setOldIngredients] = useState([{}]);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [joke, setJoke] = useState("");
  const [jokeModalVisible, setJokeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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
        setLoading(true);
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
        setSelectedAvatar(data.avatar);
        setLoading(false);
      }
    };
    fetchUser();
  }, [user.token]);

  //get favourite ingredients older than 7 days from today
  useEffect(() => {
    if (userInfo.ingredients) {
      setLoading(true);
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const oldIngredients = userInfo.ingredients.filter(
        (item: any) => new Date(item.dateAdded) < sevenDaysAgo
      );
      console.log(oldIngredients);
      setOldIngredients(oldIngredients);
      setLoading(false);
    }
  }, [userInfo.ingredients]);

  const updateUsername = async () => {
    if (!newUsername) {
      toast.show("Please enter a new username", {
        type: "warning",
        placement: "center",
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
          text: "Yes",
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
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                });
                return;
              }

              if (data.message) {
                setUserInfo((prevUserInfo) => ({
                  ...prevUserInfo,
                  username: newUsername,
                }));
                setNewUsername("");
                setIsUpdateInfoModalVisible(false);
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                });
              } else {
                toast.show("Failed to update username", {
                  type: "danger",
                  placement: "center",
                });
              }
            } catch (error) {
              console.error("Error updating username:", error);
              toast.show("An error occurred. Please try again.", {
                type: "warning",
                placement: "center",
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
        placement: "center",
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
          text: "Yes",
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
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                });
                setNewPassword("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                });
              }
            } catch (error) {
              console.error("Error updating password:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const updateEmail = async () => {
    if (!newEmail) {
      toast.show("Please enter a new email", {
        type: "warning",
        placement: "center",
      });
      return;
    }
    Alert.alert(
      "Update Email",
      "Are you sure you want to update your email?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/users/updateEmail`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  token: user.token,
                  newEmail,
                }),
              });
              const data = await response.json();
              if (response.ok) {
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                });
                setNewEmail("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                });
              }
            } catch (error) {
              console.error("Error updating email:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
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

  const toggleIsNewPasswordVisible = () => {
    setIsNewPasswordVisible(!isNewPasswordVisible);
  };

  const fetchJoke = async () => {
    const response = await fetch(`${BACKEND_URL}/recipes/joke`);
    const data = await response.json();
    console.log(data);
    setJoke(data.text);
  };

  const avatarImages = {
    friedChicken: require("../../assets/images/avatars/friedChicken.png"),
    hamburger: require("../../assets/images/avatars/hamburger.png"),
    pizza: require("../../assets/images/avatars/pizza.png"),
    ramen: require("../../assets/images/avatars/ramen.png"),
    steak: require("../../assets/images/avatars/steak.png"),
    fruitBowl: require("../../assets/images/avatars/fruitBowl.png"),
    sushi: require("../../assets/images/avatars/sushi.png"),
    poutine: require("../../assets/images/avatars/poutine.png"),
    taco: require("../../assets/images/avatars/taco.png"),
    thaiFood: require("../../assets/images/avatars/thaiFood.png"),
    salad: require("../../assets/images/avatars/salad.png"),
    fish: require("../../assets/images/avatars/fish.png"),
  };

  const handleAvatarSelect = (avatarId) => {
    addAvatar(avatarId);
  };

  // Select avatar
  const addAvatar = async (avatarId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/users/addAvatar/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            avatar: avatarId,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Avatar updated successfully:", data.avatar);
        setSelectedAvatar(avatarId);
      } else {
        console.log("Failed to update avatar:", data.message);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#237CB0"
          className="flex-1 bottom-16"
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          {/* Top Box */}
          <View className="flex justify-center items-center mb-4 -mt-16">
            <View className="flex justify-center items-center relative">
              <View
                className="absolute bg-[#9333ea] rounded-2xl -right-1.5 -bottom-1.5"
                style={{
                  width: screenWidth - 45,
                  height: 250,
                  ...styles.shadow,
                }}
              ></View>
              <View
                className="flex justify-center items-center bg-white rounded-2xl"
                style={{
                  width: screenWidth - 45,
                  height: 250,
                }}
              >
                {/* Edit Info Modal Button */}
                {user.token && (
                  <View className="absolute top-3 right-3 flex-row">
                    <TouchableOpacity
                      onPress={() => setIsUpdateInfoModalVisible(true)}
                    >
                      <FontAwesome5
                        name="user-edit"
                        size={24}
                        color="#4b5563"
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <View className="absolute top-12 right-3 flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setJokeModalVisible(true);
                      fetchJoke();
                    }}
                    className="flex justify-center items-center relative mx-2"
                  >
                    {/* <FontAwesome5 name="laugh-squint" size={26} color="#4b5563" /> */}
                    <Image
                      source={require("../../assets/images/laughingSmiley.png")}
                      className="w-12 h-12"
                    />
                  </TouchableOpacity>
                </View>

                {/* Avatar */}
                <TouchableOpacity
                  onPress={() => setIsAvatarPickerVisible(true)}
                >
                  <Image
                    source={
                      user.token && avatarImages[selectedAvatar]
                        ? avatarImages[selectedAvatar]
                        : require("../../assets/images/avatars/poutine.png")
                    }
                    className="w-20 h-20"
                  />
                </TouchableOpacity>

                {/* User info */}
                {user.token ? (
                  <View className="flex justify-center items-center mt-2">
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
                  <View className="bg-slate-100 border border-slate-200 rounded-lg w-32 h-10 font-Nobile justify-center items-center mt-4">
                    <Text className="text-xl text-cyan-600">Guest</Text>
                  </View>
                )}

                {/* Login, logout*/}
                {!user.token ? (
                  <View className="flex mt-8 items-center justify-center">
                    <Link
                      href="/authentication"
                      className="flex flex-row justify-center items-center"
                    >
                      <View className="flex flex-row justify-center items-center">
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
                    className="flex flex-row justify-center items-center mt-3"
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

          {user.token ? (
            <>
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
                  <View className="relative justify-center items-center mt-4">
                    <Image
                      source={require("../../assets/images/heart4.png")}
                      className="w-14 h-14 absolute"
                    />
                    <Text className="text-center text-xl font-SpaceMono text-black">
                      {userInfo.favourites?.length}
                    </Text>
                  </View>
                  <Text className="text-center text-lg font-SpaceMono text-slate-700 mt-3">
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
                  <View className="relative justify-center items-center mt-4">
                    <Image
                      source={require("../../assets/images/groceryBag.png")}
                      className="w-14 h-14 absolute"
                    />
                    <Text className="text-center text-xl font-SpaceMono text-black top-2">
                      {userInfo.ingredients?.length}
                    </Text>
                  </View>
                  <Text className="text-center text-lg font-SpaceMono text-slate-700 mt-4">
                    ingredients saved
                  </Text>
                </View>
              </View>

              {/* Old ingredients */}
              <View className="flex justify-center items-center">
                <View className="relative m-1">
                  <View
                    className={
                      oldIngredients.length > 0
                        ? "absolute bg-[#d45858] rounded-2xl right-0.5 bottom-0.5"
                        : "absolute bg-[#6deb84] rounded-2xl right-0.5 bottom-0.5"
                    }
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
                    {oldIngredients.length > 0 ? (
                      <>
                        <View className="flex-row justify-center items-center w-full p-2 bg-[#f03838e9] rounded-t-2xl mb-2">
                          <Image
                            source={require("../../assets/images/warning.png")}
                            className="w-8 h-8 mr-1"
                          />
                          <Text className="text-center text-base text-slate-900 font-Maax">
                            {oldIngredients.length} ingredient(s) added over a
                            week ago
                          </Text>
                        </View>
                        <ScrollView className="flex-1">
                          <View className="p-1 flex justify-center items-center w-[370]">
                            {oldIngredients.map((item, index) => (
                              <BouncyCheckbox
                                isChecked={true}
                                disabled={true}
                                key={index}
                                textStyle={{
                                  fontFamily: "SpaceMono",
                                  textDecorationLine: "none",
                                  color: "#334155",
                                  paddingHorizontal: 3,
                                  paddingVertical: 5,
                                }}
                                fillColor="#FED400"
                                unFillColor="#e2e8f0"
                                innerIconStyle={{ borderColor: "#334155" }}
                                bounceEffectIn={0.6}
                                text={
                                  item.name &&
                                  item.name.charAt(0).toUpperCase() +
                                    item.name.slice(1) +
                                    " (added on " +
                                    moment(item.dateAdded).format(
                                      "MMM Do YYYY"
                                    ) +
                                    ")"
                                }
                              />
                            ))}
                          </View>
                        </ScrollView>
                      </>
                    ) : (
                      <>
                        <View className="flex-row justify-center items-center w-full p-2 bg-[#6deb84] rounded-t-2xl mb-2">
                          <Image
                            source={require("../../assets/images/checkGreen.png")}
                            className="w-8 h-8 mr-1"
                          />
                          <Text className="text-center text-base text-slate-900 font-Maax">
                            No ingredients added over a week ago
                          </Text>
                        </View>
                        <View className="flex justify-center items-center flex-1">
                          <Text className="text-xl font-Flux text-slate-700">
                            Well done!
                          </Text>
                          <Text className="text-xl font-Flux text-slate-700 mb-1">
                            Everything is fresh!
                          </Text>
                          <Image
                            source={require("../../assets/images/applause.png")}
                            className="w-20 h-20"
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View className="flex justify-center items-center mt-4">
              <View className="flex justify-center items-center relative">
                <View
                  className="absolute bg-[#f03838] rounded-2xl -right-1.5 -bottom-1.5"
                  style={{
                    width: screenWidth - 65,
                    height: 220,
                    ...styles.shadow,
                  }}
                ></View>
                <View
                  className="flex justify-center items-center bg-white rounded-2xl"
                  style={{
                    width: screenWidth - 65,
                    height: 220,
                  }}
                >
                  <Text className="text-xl text-center font-SpaceMono mx-4">
                    Create an account to save your ingredients and get recipes
                    based on what you have!
                  </Text>
                </View>
              </View>
              <View className="flex justify-center items-center mt-6 mb-10 mx-6">
                <Text className="font-SpaceMono text-xl text-center">
                  Snap a picture of your ingredients and get started!
                </Text>
                <BouncingImage>
                  <Image
                    source={require("../../assets/images/arrowDown.png")}
                    className="w-12 h-12 top-8"
                  />
                </BouncingImage>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Update info modal */}
      <Modal
        visible={isUpdateInfoModalVisible}
        onDismiss={() => setIsUpdateInfoModalVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View className="flex justify-around items-center bg-slate-50 rounded-lg p-8">
            <TouchableOpacity
              onPress={() => {
                setIsUpdateInfoModalVisible(false);
                setNewPassword("");
                setNewUsername("");
                setNewEmail("");
              }}
              className="absolute top-2 right-2 p-1"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <Text className="text-xl text-center font-Nobile mb-4">
              Update Information
            </Text>
            <View className="flex justify-center items-center">
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
                <TextInput
                  placeholder="New Email"
                  value={newEmail}
                  onChangeText={(text) => setNewEmail(text)}
                  autoCapitalize="none"
                  className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2 font-Nobile"
                />
                <View style={styles.shadow}>
                  <TouchableOpacity onPress={updateEmail}>
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
                    <Image
                      source={
                        isNewPasswordVisible
                          ? require("../../assets/images/eyeHide.png")
                          : require("../../assets/images/eyeView.png")
                      }
                      className="w-6 h-6"
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
              {Object.entries(avatarImages).map(([avatarId]) => (
                <TouchableOpacity
                  key={avatarId}
                  onPress={() => {
                    handleAvatarSelect(avatarId);
                    setIsAvatarPickerVisible(false);
                  }}
                  className="flex justify-center items-center"
                >
                  <Image
                    source={avatarImages[avatarId]}
                    className="w-20 h-20 m-2"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Joke */}
      <Modal
        visible={jokeModalVisible}
        onDismiss={() => setJokeModalVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View className="bg-slate-100 rounded-2xl p-2 w-[80%] max-h-[500]">
            <TouchableOpacity
              onPress={() => setJokeModalVisible(false)}
              className="items-end p-1"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <Text className="text-center text-2xl font-Nobile text-[#475569] mb-2">
              Random Joke
            </Text>
            <ScrollView>
              <Text className="text-center font-Nobile text-lg text-[#475569] my-4 mx-6">
                {joke}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
