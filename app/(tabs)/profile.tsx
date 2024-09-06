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
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { Link } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { Modal } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import moment from "moment";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import { RootState } from "@/store/store";
import { logout } from "@/store/user";
import { BACKEND_URL } from "@/_recipeUtils";

export default function Profile() {
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state: RootState) => state.user.value);
  const favourites = useSelector(
    (state: RootState) => state.recipes.favourites
  );
  const ingredients = useSelector(
    (state: RootState) => state.fridge.ingredients
  );

  const [dynamicHeight, setDynamicHeight] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<any>({});
  const [newPassword, setNewPassword] = useState<string>("");
  const [newUsername, setNewUsername] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] =
    useState<boolean>(false);
  const [isUpdateInfoModalVisible, setIsUpdateInfoModalVisible] =
    useState<boolean>(false);
  const [oldIngredients, setOldIngredients] = useState<any[]>([{}]);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] =
    useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("poutine");
  const [joke, setJoke] = useState<string>("");
  const [jokeModalVisible, setJokeModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [jokeLoading, setJokeLoading] = useState<boolean>(false);
  const [postitImages, setPostitImages] = useState<any[]>([]);
  const [dangerZoneOpen, setDangerZoneOpen] = useState<boolean>(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState<string>("");

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const calculatedHeight = screenWidth * (9 / 16);
  const isSmallScreen = screenWidth < 400;

  // Set status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  // fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
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
    fetchUserInfo();
  }, [user.token, favourites, ingredients]);

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
      console.log("Old ingredients:", oldIngredients.length);
      setOldIngredients(oldIngredients);
      setLoading(false);
    }
  }, [userInfo.ingredients]);

  // Logout function
  const handleLogout = async () => {
    if (!user.token) {
      return;
    }
    await SecureStore.deleteItemAsync("token");
    dispatch(logout());
    toast.show("Logged out successfully", {
      type: "success",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
    console.log(user);
  };

  // Delete account function
  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure you want to delete your account?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes I'm sure",
          onPress: async () => {
            try {
              const response = await fetch(
                `${BACKEND_URL}/users/deleteAccount/${user.token}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: user.token,
                  }),
                }
              );
              const data = await response.json();
              if (!response.ok) {
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
                return;
              }
              if (data.message) {
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  ),
                });
                await SecureStore.deleteItemAsync("token");
                dispatch(logout());
                setIsUpdateInfoModalVisible(false);
                setDangerZoneOpen(false);
                setDeleteAccountInput("");
                setOpenMenu(false);
              } else {
                toast.show("Failed to delete account", {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
              }
            } catch (error) {
              console.error("Error deleting account:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
                duration: 1000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: <Ionicons name="close-circle" size={24} color="white" />,
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Update username function
  const updateUsername = async () => {
    if (!newUsername) {
      toast.show("Please enter a new username", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }
    if (newUsername.length < 6) {
      toast.show("Username must be at least 6 characters long", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
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
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
                return;
              }

              if (data.message) {
                setUserInfo((prevUserInfo: any) => ({
                  ...prevUserInfo,
                  username: newUsername,
                }));
                setNewUsername("");
                setIsUpdateInfoModalVisible(false);
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  ),
                });
              } else {
                toast.show("Failed to update username", {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
              }
            } catch (error) {
              console.error("Error updating username:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
                duration: 1000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: <Ionicons name="close-circle" size={24} color="white" />,
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Update password function
  const updatePassword = async () => {
    if (!newPassword) {
      toast.show("Please enter a new password", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }
    if (newPassword.length < 6) {
      toast.show("Password must be at least 6 characters long", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
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
              if (!response.ok) {
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
                return;
              }
              if (data.message) {
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  ),
                });
                setUserInfo((prevUserInfo: any) => ({
                  ...prevUserInfo,
                  password: newPassword,
                }));
                setNewPassword("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show("Failed to update password", {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
              }
            } catch (error) {
              console.error("Error updating password:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
                duration: 1000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: <Ionicons name="close-circle" size={24} color="white" />,
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Check if email is in a valid format
  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

  // Update email function
  const updateEmail = async () => {
    if (!newEmail) {
      toast.show("Please enter a new email", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }
    if (!validateEmail(newEmail)) {
      toast.show("Please enter a valid email address", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
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
              if (!response.ok) {
                toast.show(data.message, {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
                return;
              }
              if (data.message) {
                toast.show(data.message, {
                  type: "success",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  ),
                });
                setUserInfo((prevUserInfo: any) => ({
                  ...prevUserInfo,
                  email: newEmail,
                }));
                setNewEmail("");
                setIsUpdateInfoModalVisible(false);
              } else {
                toast.show("Failed to update email", {
                  type: "danger",
                  placement: "center",
                  duration: 1000,
                  animationType: "zoom-in",
                  swipeEnabled: true,
                  icon: (
                    <Ionicons name="close-circle" size={24} color="white" />
                  ),
                });
              }
            } catch (error) {
              console.error("Error updating email:", error);
              toast.show("An error occurred. Please try again.", {
                type: "danger",
                placement: "center",
                duration: 1000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: <Ionicons name="close-circle" size={24} color="white" />,
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Close update info modal
  const closeUpdateInfoModal = () => {
    setIsUpdateInfoModalVisible(false);
    setNewPassword("");
    setNewUsername("");
    setNewEmail("");
    setDeleteAccountInput("");
    setDangerZoneOpen(false);
  };

  // Function to get random postit images
  const getRandomPostitImages = (count = 1) => {
    const images = [
      require("../../assets/images/stickers/postit1.png"),
      require("../../assets/images/stickers/postit2.png"),
      require("../../assets/images/stickers/postit3.png"),
      require("../../assets/images/stickers/postit4.png"),
    ];

    // Shuffle the images array
    const shuffledImages = images.sort(() => 0.5 - Math.random());

    // Return the first 'count' images
    return shuffledImages.slice(0, count);
  };

  // Set post-it images on component mount
  useEffect(() => {
    // Get 2 unique images
    const images = getRandomPostitImages(2);
    setPostitImages(images);
  }, []);

  // Toggle visibility of new password
  const toggleIsNewPasswordVisible = () => {
    setIsNewPasswordVisible(!isNewPasswordVisible);
  };

  // Fetch a random joke
  const fetchJoke = async () => {
    setJokeLoading(true);
    const response = await fetch(`${BACKEND_URL}/recipes/joke`);
    const data = await response.json();
    console.log(data);
    setJoke(data.text);
    setJokeLoading(false);
  };

  // Avatar images
  const avatarImages = {
    salad: require("../../assets/images/avatars/salad.png"),
    hamburger: require("../../assets/images/avatars/hamburger.png"),
    ramen: require("../../assets/images/avatars/ramen.png"),
    taco: require("../../assets/images/avatars/taco.png"),
    friedChicken: require("../../assets/images/avatars/friedChicken.png"),
    sushi: require("../../assets/images/avatars/sushi.png"),
    coffee: require("../../assets/images/avatars/coffee.png"),
    donut: require("../../assets/images/avatars/donut.png"),
    poutine: require("../../assets/images/avatars/poutine.png"),
    pizza: require("../../assets/images/avatars/pizza.png"),
    steak: require("../../assets/images/avatars/steak.png"),
    fruitBowl: require("../../assets/images/avatars/fruitBowl.png"),
    thaiFood: require("../../assets/images/avatars/thaiFood.png"),
    iceCream: require("../../assets/images/avatars/iceCream.png"),
    fish: require("../../assets/images/avatars/fish.png"),
  };

  // Select avatar
  const handleAvatarSelect = (avatarId: string) => {
    addAvatar(avatarId);
  };

  // Update avatar
  const addAvatar = async (avatarId: string) => {
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Background cellSize={25} />

      {/* Logo */}
      <View className="flex justify-center items-center">
        <Image
          source={require("../../assets/images/logo.png")}
          className="w-60 h-14"
        />
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#237CB0"
          className="flex-1 top-1/2 absolute"
        />
      )}

      {!loading && (
        <View className="flex-1 justify-center items-center">
          {/* Top Box */}
          <View className="flex justify-center items-center mb-4">
            <View className="flex justify-center items-center relative">
              <View
                className="absolute bg-[#9333ea] rounded-2xl -right-1.5 -bottom-1.5"
                style={{
                  width: screenWidth - 55,
                  height: isSmallScreen
                    ? screenHeight * 0.3
                    : screenHeight * 0.3,
                  ...styles.shadow,
                }}
              ></View>
              <View
                className="flex justify-center items-center bg-white rounded-2xl"
                style={{
                  width: screenWidth - 55,
                  height: isSmallScreen
                    ? screenHeight * 0.3
                    : screenHeight * 0.3,
                }}
              >
                {/* Menu Button */}
                {user.token && (
                  <View className="absolute top-3 right-1">
                    <TouchableOpacity
                      onPress={() => setOpenMenu(!openMenu)}
                      className="flex justify-center items-center relative mx-2"
                    >
                      <Image
                        source={require("../../assets/images/menuIcon.png")}
                        className="w-10 h-10"
                      />
                    </TouchableOpacity>
                    {openMenu && (
                      <View className="flex justify-center items-center mt-3 -mr-1">
                        <TouchableOpacity
                          onPress={() => setIsAvatarPickerVisible(true)}
                          className=""
                        >
                          <Image
                            source={require("../../assets/images/changeImage.png")}
                            className="w-10 h-10"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setIsUpdateInfoModalVisible(true)}
                          className="mt-2"
                        >
                          <Image
                            source={require("../../assets/images/updateInfo.png")}
                            className="w-10 h-10"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setJokeModalVisible(true);
                            fetchJoke();
                          }}
                          className="mt-3 mr-1"
                        >
                          <Image
                            source={require("../../assets/images/clown.png")}
                            className="w-10 h-10"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Avatar */}
                <View>
                  <Image
                    source={
                      user.token &&
                      avatarImages[selectedAvatar as keyof typeof avatarImages]
                        ? avatarImages[
                            selectedAvatar as keyof typeof avatarImages
                          ]
                        : require("../../assets/images/avatars/poutine.png")
                    }
                    className={
                      isSmallScreen ? "w-16 h-16 mb-1" : "w-20 h-20 mb-2"
                    }
                  />
                </View>

                {/* User info */}
                {user.token ? (
                  <View className="flex justify-center items-center mt-2">
                    <View className="bg-slate-100 border border-slate-200 rounded-lg w-52 h-10 font-Nobile justify-center items-center m-1">
                      <ScrollView
                        horizontal={true}
                        contentContainerStyle={{
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text className="text-xl text-cyan-600">
                          {userInfo.username}
                        </Text>
                      </ScrollView>
                    </View>
                    <View className="bg-slate-100 border border-slate-200 rounded-lg w-52 h-10 justify-center items-center m-1">
                      <ScrollView
                        horizontal={true}
                        contentContainerStyle={{
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text className="text-md font-Nobile text-center text-cyan-600">
                          {userInfo.email}
                        </Text>
                      </ScrollView>
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
                        <Text
                          className={
                            isSmallScreen
                              ? "text-base font-Nobile mx-1"
                              : "text-lg font-Nobile mx-1"
                          }
                        >
                          Login
                        </Text>
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
                    className="flex flex-row justify-center items-center mt-2"
                  >
                    <Text
                      className={
                        isSmallScreen
                          ? "text-base font-Nobile mx-1"
                          : "text-lg font-Nobile mx-1"
                      }
                    >
                      Logout
                    </Text>
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

          {/* User not logged in, guest message */}
          {!user.token && (
            <View className="flex justify-center items-center mt-4">
              <View className="flex justify-center items-center relative">
                <View
                  className="absolute bg-[#f03838] rounded-2xl -right-1.5 -bottom-1.5"
                  style={{
                    width: screenWidth - 65,
                    height: isSmallScreen ? 160 : 220,
                    ...styles.shadow,
                  }}
                ></View>
                <View
                  className="flex justify-center items-center bg-white rounded-2xl"
                  style={{
                    width: screenWidth - 65,
                    height: isSmallScreen ? 160 : 220,
                  }}
                >
                  <Text
                    className={
                      isSmallScreen
                        ? "text-base text-center font-SpaceMono mx-5"
                        : "text-xl text-center font-SpaceMono mx-4"
                    }
                  >
                    Create an account to save your ingredients and get recipes
                    based on what you have!
                  </Text>
                </View>
              </View>
              <View className="flex justify-center items-center mt-6 mb-10 mx-6">
                <Text
                  className={
                    isSmallScreen
                      ? "font-SpaceMono text-lg text-center"
                      : "font-SpaceMono text-xl text-center"
                  }
                >
                  Snap a picture of your ingredients and get started!
                </Text>
                <BouncingImage>
                  <Image
                    source={require("../../assets/images/arrows/arrowDown.png")}
                    className="w-12 h-12 top-8"
                  />
                </BouncingImage>
              </View>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {user.token && (
              <View>
                {/* Postits*/}
                <View className="flex flex-row justify-center items-center">
                  {/* Middle Postit 1*/}
                  <View
                    className={
                      isSmallScreen
                        ? "flex justify-center items-center relative w-36 h-40 mx-2"
                        : "flex justify-center items-center relative w-40 h-44 mx-2"
                    }
                    style={styles.shadow}
                  >
                    <Image
                      source={postitImages[0]}
                      className="absolute inset-0 w-full h-full"
                    />
                    <View className="relative justify-center items-center mt-4">
                      <Image
                        source={require("../../assets/images/heartFull.png")}
                        className="w-14 h-14 absolute"
                      />
                      <Text className="text-center text-xl font-SpaceMono text-black">
                        {userInfo.favourites?.length}
                      </Text>
                    </View>
                    <Text className="text-center text-base font-SpaceMono text-slate-700 mt-2">
                      favourite recipes
                    </Text>
                  </View>

                  {/* Middle Postit 2 */}
                  <View
                    className={
                      isSmallScreen
                        ? "flex justify-center items-center relative w-36 h-40 mx-2"
                        : "flex justify-center items-center relative w-40 h-44 mx-2"
                    }
                    style={styles.shadow}
                  >
                    <Image
                      source={postitImages[1]}
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
                    <Text className="text-center text-base font-SpaceMono text-slate-700 mt-4">
                      ingredients saved
                    </Text>
                  </View>
                </View>

                {/* <View className="flex justify-center items-center mb-20">
                  <View className="relative m-1">
                    <View
                      className={
                        oldIngredients.length > 0
                          ? "absolute bg-[#d45858] rounded-2xl right-0.5 bottom-0.5"
                          : "absolute bg-[#6deb84] rounded-2xl right-0.5 bottom-0.5"
                      }
                      style={{
                        width: screenWidth - 45,
                        height: dynamicHeight,
                        ...styles.shadow,
                      }}
                    ></View>
                    <View
                      className="flex justify-center items-center bg-white rounded-2xl m-2 p-2"
                      style={{
                        width: screenWidth - 40,
                      }}
                      onLayout={(event) => {
                        const { height } = event.nativeEvent.layout;
                        setDynamicHeight(height);
                      }}
                    >
                      {oldIngredients.length > 0 ? (
                        <>
                          <View className="flex-row justify-center items-center w-full p-2 bg-[#f03838e9] rounded-t-2xl mb-2">
                            <Image
                              source={require("../../assets/images/warning.png")}
                              className={
                                isSmallScreen ? "w-6 h-6 mr-1" : "w-8 h-8 mr-1"
                              }
                            />
                            <Text className="text-center text-base text-slate-900 font-Maax">
                              {oldIngredients.length} ingredient(s) added over a
                              week ago
                            </Text>
                          </View>

                          <View className="p-1 flex justify-center items-center">
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
                                  fontSize: isSmallScreen ? 14 : 16,
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
                        </>
                      ) : (
                        <>
                          <View className="flex-row justify-center items-center w-full p-2 bg-[#6deb84] rounded-t-2xl mb-2">
                            <Image
                              source={require("../../assets/images/checkGreen.png")}
                              className={
                                isSmallScreen ? "w-6 h-6 mr-1" : "w-8 h-8 mr-1"
                              }
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
                </View> */}

                {/* Old ingredients */}
                {oldIngredients.length > 0 ? (
                  <View
                    className={
                      isSmallScreen
                        ? "flex justify-center items-center mt-9 mb-[110] relative"
                        : "flex justify-center items-center mt-10 mb-24 relative"
                    }
                  >
                    <Image
                      source={require("../../assets/images/whiteboard.png")}
                      className="absolute"
                      style={{
                        width: isSmallScreen
                          ? screenWidth - 25
                          : screenWidth - 35,
                        height: isSmallScreen ? 400 : 440,
                        ...styles.shadow,
                      }}
                    />

                    <View
                      className={
                        isSmallScreen
                          ? "flex justify-center items-center h-[330] w-full"
                          : "flex justify-center items-center h-[360] w-full"
                      }
                    >
                      <View className="flex-row justify-center items-center w-full my-2">
                        <Image
                          source={require("../../assets/images/warning.png")}
                          className={
                            isSmallScreen ? "w-8 h-8 mr-1" : "w-8 h-8 mr-1"
                          }
                        />
                        <Text
                          className={
                            isSmallScreen
                              ? "text-[20px] text-slate-900 font-HappyWork text-center"
                              : "text-[22px] text-slate-900 font-HappyWork text-center"
                          }
                        >
                          {oldIngredients.length} ingredient(s) added over a
                          week ago
                        </Text>
                      </View>

                      <ScrollView className="flex-1">
                        {oldIngredients.map((item, index) => (
                          <View
                            key={index}
                            className={
                              isSmallScreen
                                ? "p-1 flex justify-center items-start w-[310]"
                                : "p-1 flex justify-center items-start w-[340]"
                            }
                          >
                            <BouncyCheckbox
                              isChecked={true}
                              disabled={true}
                              fillColor="#FED400"
                              unFillColor="#e2e8f0"
                              innerIconStyle={{ borderColor: "#334155" }}
                              bounceEffectIn={0.6}
                              textComponent={
                                <ScrollView
                                  horizontal={true}
                                  showsHorizontalScrollIndicator={false}
                                >
                                  <View className="flex-row justify-center items-center ml-2">
                                    <Text className="text-slate-700 text-2xl font-HappyWork">
                                      {item.name &&
                                        item.name.charAt(0).toUpperCase() +
                                          item.name.slice(1)}
                                    </Text>
                                    <Text className="text-slate-600 text-lg font-HappyWork">
                                      {" (added on " +
                                        moment(item.dateAdded).format(
                                          "MMM Do YYYY"
                                        ) +
                                        ")"}
                                    </Text>
                                  </View>
                                </ScrollView>
                              }
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                ) : (
                  <View
                    className={
                      isSmallScreen
                        ? "flex justify-center items-center mt-8 relative mb-10"
                        : "flex justify-center items-center mt-8 relative"
                    }
                  >
                    <Image
                      source={require("../../assets/images/whiteboard2.png")}
                      className="absolute w-full"
                      style={{
                        height: isSmallScreen ? 240 : 250,
                        ...styles.shadow,
                      }}
                    />
                    <View className="flex justify-center items-center w-full">
                      <View className="flex-row justify-center items-center w-full px-4 mb-1">
                        <Image
                          source={require("../../assets/images/checkGreen.png")}
                          className={
                            isSmallScreen ? "w-6 h-6 mr-1" : "w-8 h-8 mr-1"
                          }
                        />
                        <Text className="text-center text-xl text-slate-900 font-HappyWork">
                          No ingredients added over a week ago
                        </Text>
                      </View>
                      <View className="flex justify-center items-center">
                        <Text className="text-2xl font-HappyWork text-slate-700">
                          Well done!
                        </Text>
                        <Text className="text-2xl font-HappyWork text-slate-700 mb-1">
                          Everything is fresh!
                        </Text>
                        <Image
                          source={require("../../assets/images/applause2.png")}
                          className="w-20 h-20"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Update info modal */}
      <Modal
        visible={isUpdateInfoModalVisible}
        onDismiss={() => closeUpdateInfoModal()}
      >
        <TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                className={
                  isSmallScreen
                    ? "flex justify-center items-center bottom-8 p-10"
                    : "flex justify-center items-center bottom-4 p-10"
                }
              >
                <View className="flex justify-around items-center bg-slate-50 rounded-lg p-10">
                  <TouchableOpacity
                    onPress={() => closeUpdateInfoModal()}
                    className="absolute top-3 right-3 p-1"
                  >
                    <Image
                      source={require("../../assets/images/cross.png")}
                      className="w-6 h-6"
                    />
                  </TouchableOpacity>
                  <Text className="text-center text-2xl font-Nobile text-slate-600 mb-2 p-4">
                    Update Information
                  </Text>
                  <View className="flex justify-center items-center mb-6">
                    <View className="flex-row justify-center items-center">
                      <TextInput
                        placeholder="New Username"
                        value={newUsername}
                        onChangeText={(text) => setNewUsername(text)}
                        autoCapitalize="none"
                        autoFocus={true}
                        autoCorrect={false}
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
                        autoCorrect={false}
                        keyboardType="email-address"
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
                          autoCorrect={false}
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
                  <View className="flex justify-center items-center">
                    <TouchableOpacity
                      onPress={() => setDangerZoneOpen(!dangerZoneOpen)}
                      className="flex-row justify-center items-center mb-4"
                    >
                      <Text className="text-center text-base font-Nobile text-red-600 mx-2">
                        Danger Zone
                      </Text>
                      <Image
                        source={require("../../assets/images/dangerZone.png")}
                        className="w-10 h-10"
                      />
                    </TouchableOpacity>

                    {dangerZoneOpen && (
                      <View className="flex justify-center items-center w-64">
                        <View className="flex justify-center items-center border-2 rounded-xl border-red-500 p-4">
                          <Text className="text-center text-base font-NobileBold text-red-600 mb-2">
                            Delete Account
                          </Text>
                          <Text className="text-justify text-md font-Nobile text-red-600 mb-2 w-64">
                            Are you sure you want to delete your account. This
                            action cannot be undone. If you wish to proceed,
                            please type "DELETEACCOUNT" in the box below.
                          </Text>
                          <View className="flex-row justify-center items-center my-2">
                            <TextInput
                              placeholder="DELETEACCOUNT"
                              value={deleteAccountInput}
                              onChangeText={(text) =>
                                setDeleteAccountInput(text)
                              }
                              autoCapitalize="none"
                              className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 mx-3 font-Nobile"
                            />
                            <View style={styles.shadow}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (deleteAccountInput === "DELETEACCOUNT") {
                                    deleteAccount();
                                  } else {
                                    toast.show("Please type DELETEACCOUNT", {
                                      type: "danger",
                                      placement: "center",
                                      duration: 1000,
                                      animationType: "zoom-in",
                                      swipeEnabled: true,
                                      icon: (
                                        <Ionicons
                                          name="warning"
                                          size={24}
                                          color="white"
                                        />
                                      ),
                                    });
                                  }
                                }}
                              >
                                <Image
                                  source={require("../../assets/images/redCross.png")}
                                  className="w-10 h-10"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        visible={isAvatarPickerVisible}
        onDismiss={() => setIsAvatarPickerVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View className="bg-slate-100 rounded-lg p-4 w-[85%] bottom-6">
            <TouchableOpacity
              onPress={() => setIsAvatarPickerVisible(false)}
              className="items-end p-1"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <Text className="text-center text-2xl font-Nobile text-slate-600 p-2">
              Select an avatar
            </Text>
            <View className="flex-row justify-center items-center flex-wrap p-2 mb-6">
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
                    source={avatarImages[avatarId as keyof typeof avatarImages]}
                    className={
                      isSmallScreen ? "w-16 h-16 m-2" : "w-20 h-20 m-2"
                    }
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
        onDismiss={() => {
          setJokeModalVisible(false);
          setJoke("");
        }}
      >
        <View className="flex justify-center items-center">
          <View className="bg-slate-100 rounded-2xl p-2 w-[80%] max-h-[500]">
            <TouchableOpacity
              onPress={() => {
                setJokeModalVisible(false);
                setJoke("");
              }}
              className="items-end p-1"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <Text className="text-center text-2xl font-Nobile text-slate-600 mb-2">
              Random Joke
            </Text>
            {jokeLoading ? (
              <ActivityIndicator
                size="large"
                color="#237CB0"
                className="my-12 bottom-4"
              />
            ) : (
              <ScrollView>
                <Text className="text-center font-Nobile text-lg text-slate-600 my-4 mx-6">
                  {joke}
                </Text>
              </ScrollView>
            )}
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
    elevation: 8,
  },
});
