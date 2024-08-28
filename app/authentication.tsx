import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigation } from "expo-router";
import { useDispatch } from "react-redux";
import * as SecureStore from "expo-secure-store";
import { Modal } from "react-native-paper";
import { Feather } from "@expo/vector-icons";
import Background from "@/components/Background";
import { login } from "@/store/user";
import { BACKEND_URL } from "@/_recipeUtils";

export default function Authentication() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [signUpUsername, setSignUpUsername] = useState<string>("");
  const [signUpPassword, setSignUpPassword] = useState<string>("");
  const [signUpEmail, setSignUpEmail] = useState<string>("");
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [isloginPasswordHidden, setIsLoginPasswordHidden] =
    useState<boolean>(true);
  const [isSignUpPasswordHidden, setIsSignUpPasswordHidden] =
    useState<boolean>(true);
  const [signUpVisible, setSignUpVisible] = useState<boolean>(false);
  const [signUpUsernameEmpty, setSignUpUsernameEmpty] =
    useState<boolean>(false);
  const [signUpPasswordEmpty, setSignUpPasswordEmpty] =
    useState<boolean>(false);
  const [loginUsernameEmpty, setLoginUsernameEmpty] = useState<boolean>(false);
  const [loginPasswordEmpty, setLoginPasswordEmpty] = useState<boolean>(false);
  const [forgotPasswordModal, setForgotPasswordModal] =
    useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);

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

  // Check if email is in a valid format
  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

  // Sign Up
  const handleSignUp = async () => {
    setSignUpUsernameEmpty(false);
    setSignUpPasswordEmpty(false);

    if (!signUpUsername.trim()) {
      setSignUpUsernameEmpty(true);
      return;
    }
    if (!signUpPassword.trim()) {
      setSignUpPasswordEmpty(true);
      return;
    }
    if (signUpEmail && !validateEmail(signUpEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signUpUsername,
          password: signUpPassword,
          email: signUpEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message);
        return;
      }

      if (data) {
        // Dispatch sign-up action
        dispatch(login(data));
        console.log("User signed up successfully", data);

        setSignUpUsername("");
        setSignUpEmail("");
        setSignUpPassword("");

        // Automatically log in the user after successful sign-up
        const loginResponse = await fetch(`${BACKEND_URL}/users/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: signUpUsername,
            password: signUpPassword,
          }),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) {
          throw new Error(loginData.message || "Login failed");
        }

        if (rememberMe) {
          await SecureStore.setItemAsync("token", data.token);
          console.log("Token stored successfully");
        }

        // Dispatch login action and navigate
        dispatch(login(loginData));
        navigation.navigate("(tabs)", { screen: "profile" });
        alert("Signed up successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occured when signing up");
    }
  };

  // Login
  const handleLogin = async () => {
    setLoginUsernameEmpty(false);
    setLoginPasswordEmpty(false);

    if (!loginUsername.trim()) {
      setLoginUsernameEmpty(true);
      return;
    }
    if (!loginPassword.trim()) {
      setLoginPasswordEmpty(true);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      if (data) {
        // Store the token if rememberMe is checked
        if (rememberMe) {
          await SecureStore.setItemAsync("token", data.token);
          console.log("Token stored successfully");
        }

        // Dispatch login action
        dispatch(login(data));
        console.log("user:", data);

        setLoginUsername("");
        setLoginPassword("");
        navigation.navigate("(tabs)", { screen: "profile" });
        alert("Logged in successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occured when logging in");
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Email cannot be empty");
      return;
    }
    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    Alert.alert(
      "Reset Password",
      "Are you sure you want to reset your password?",
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
                `${BACKEND_URL}/users/forgotPassword`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email,
                  }),
                }
              );
              const data = await response.json();
              console.log(data);
              if (!response.ok) {
                alert(data.message);
                return;
              }
              if (data.result) {
                console.log("Password reset link sent successfully", data);
                alert("Password reset link sent successfully");
                toggleForgotPasswordModal();
                setEmail("");
              }
            } catch (error) {
              console.error("Error:", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Continue as Guest
  const continueAsGuest = () => {
    Alert.alert(
      "Continue as a guest",
      "Heads up: guest mode has limited features. Sign up for full functionality.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("(tabs)", { screen: "search" });
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Eye icon to toggle password visibility Sign Up
  const toggleSignUpPasswordVisibility = () => {
    setIsSignUpPasswordHidden(!isSignUpPasswordHidden);
  };

  // Eye icon to toggle password visibility Login
  const toggleLoginPasswordVisibility = () => {
    setIsLoginPasswordHidden(!isloginPasswordHidden);
  };

  // Open Forgot Password Modal
  const toggleForgotPasswordModal = () => {
    setForgotPasswordModal(!forgotPasswordModal);
  };

  // Hide the logo when keyboard is visible
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <View className="flex-1 justify-center items-center">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Background cellSize={25} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-center items-center">
              {/* Logo */}
              {!isKeyboardVisible && (
                <View className="flex justify-center items-center mb-2 absolute top-16">
                  <Image
                    source={require("../assets/images/logo8.png")}
                    className="w-60 h-14"
                  />
                </View>
              )}

              {/* Login */}
              {!signUpVisible && (
                <View
                  className="relative flex justify-center items-center"
                  style={styles.shadow}
                >
                  <Image
                    className="w-[330] h-[480]"
                    source={require("../assets/images/clipboard/clipboard4.png")}
                    alt="logo"
                  />
                  <View className="flex justify-center items-center absolute">
                    <TextInput
                      placeholder="Username"
                      autoCapitalize="none"
                      value={loginUsername}
                      onChangeText={(text) => {
                        setLoginUsername(text);
                        setLoginUsernameEmpty(false);
                      }}
                      className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                    />
                    {loginUsernameEmpty && (
                      <Text className="text-red-500">
                        Username cannot be empty
                      </Text>
                    )}
                    <View className="relative">
                      <TextInput
                        placeholder="Password"
                        value={loginPassword}
                        secureTextEntry={isloginPasswordHidden}
                        autoCapitalize="none"
                        onChangeText={(text) => {
                          setLoginPassword(text);
                          setLoginPasswordEmpty(false);
                        }}
                        className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                      />
                      <TouchableOpacity
                        onPress={toggleLoginPasswordVisibility}
                        className="absolute right-5 top-5"
                      >
                        <Image
                          source={
                            isloginPasswordHidden
                              ? require("../assets/images/eyeView.png")
                              : require("../assets/images/eyeHide.png")
                          }
                          alt="eye"
                          className="w-6 h-6"
                        />
                      </TouchableOpacity>
                    </View>
                    {loginPasswordEmpty && (
                      <Text className="text-red-500">
                        Password cannot be empty
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={toggleForgotPasswordModal}
                      className="flex justify-center items-center"
                    >
                      <Text>Forgot password?</Text>
                    </TouchableOpacity>

                    <View className="right-6 mt-3">
                      <TouchableOpacity
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        <View className="flex-row justify-center items-center ">
                          {rememberMe ? (
                            <Feather name="check-square" size={20} />
                          ) : (
                            <Feather name="square" size={20} />
                          )}
                          <Text className="ml-1 text-base">Remember me</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={handleLogin}
                      className="relative flex justify-center items-center top-4"
                    >
                      <Image
                        source={require("../assets/images/button/button3.png")}
                        alt="button"
                        className="w-40 h-12"
                      />
                      <Text className="text-xl text-white absolute font-Nobile">
                        Login ✔︎
                      </Text>
                    </TouchableOpacity>

                    <View className="flex justify-center items-center top-12">
                      <Text>Don't have an account yet?</Text>
                      <TouchableOpacity onPress={() => setSignUpVisible(true)}>
                        <Text className="text-lg">Sign Up</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Continue as Guest */}
                    <TouchableOpacity
                      className="flex justify-center items-center top-14"
                      onPress={continueAsGuest}
                    >
                      <Text className="text-sky-600">Continue as a guest</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Sign Up */}
              {signUpVisible && (
                <View
                  className="relative flex justify-center items-center"
                  style={styles.shadow}
                >
                  <Image
                    className="w-[330] h-[480]"
                    source={require("../assets/images/clipboard/clipboard3.png")}
                    alt="logo"
                  />
                  <View className="flex justify-center items-center absolute">
                    <TextInput
                      placeholder="Username"
                      autoCapitalize="none"
                      value={signUpUsername}
                      onChangeText={(text) => {
                        setSignUpUsername(text);
                        setSignUpUsernameEmpty(false);
                      }}
                      className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                    />
                    {signUpUsernameEmpty && (
                      <Text className="text-red-500">
                        Username cannot be empty
                      </Text>
                    )}
                    <TextInput
                      placeholder="Email"
                      autoCapitalize="none"
                      value={signUpEmail}
                      onChangeText={(text) => setSignUpEmail(text)}
                      className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                    />

                    <View className="relative">
                      <TextInput
                        placeholder="Password"
                        value={signUpPassword}
                        secureTextEntry={isSignUpPasswordHidden}
                        autoCapitalize="none"
                        onChangeText={(text) => {
                          setSignUpPassword(text);
                          setSignUpPasswordEmpty(false);
                        }}
                        className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
                      />
                      <TouchableOpacity
                        onPress={toggleSignUpPasswordVisibility}
                        className="absolute right-5 top-5"
                      >
                        <Image
                          source={
                            isSignUpPasswordHidden
                              ? require("../assets/images/eyeView.png")
                              : require("../assets/images/eyeHide.png")
                          }
                          alt="eye"
                          className="w-6 h-6"
                        />
                      </TouchableOpacity>
                    </View>
                    {signUpPasswordEmpty && (
                      <Text className="text-red-500">
                        Password cannot be empty
                      </Text>
                    )}

                    <View className="right-6 mt-3">
                      <TouchableOpacity
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        <View className="flex-row justify-center items-center ">
                          {rememberMe ? (
                            <Feather name="check-square" size={20} />
                          ) : (
                            <Feather name="square" size={20} />
                          )}
                          <Text className="ml-1 text-base">Remember me</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="relative flex justify-center items-center top-4"
                      onPress={handleSignUp}
                    >
                      <Image
                        source={require("../assets/images/button/button1.png")}
                        alt="button"
                        className="w-40 h-12"
                      />
                      <Text className="text-xl text-white absolute font-Nobile">
                        Sign Up ✔︎
                      </Text>
                    </TouchableOpacity>
                    <View className="flex justify-center items-center top-8">
                      <Text>Already have an account?</Text>
                      <TouchableOpacity onPress={() => setSignUpVisible(false)}>
                        <Text className="text-lg">Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Forgot Password Modal */}
              <Modal
                visible={forgotPasswordModal}
                onDismiss={toggleForgotPasswordModal}
              >
                <View className="flex justify-center items-center">
                  <View
                    className="flex justify-around items-center bg-slate-100 rounded-lg p-10"
                    style={styles.shadow}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        toggleForgotPasswordModal();
                        setEmail("");
                      }}
                      className="absolute top-2 right-2 p-1"
                    >
                      <Image
                        source={require("../assets/images/cross.png")}
                        className="w-6 h-6"
                      />
                    </TouchableOpacity>
                    <Text className="text-lg text-center font-Nobile mb-4">
                      Reset Password
                    </Text>
                    <TextInput
                      placeholder="Enter your email"
                      autoCapitalize="none"
                      className="bg-white w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2 font-Nobile"
                      value={email}
                      onChangeText={(text) => setEmail(text)}
                    />
                    <TouchableOpacity
                      onPress={() => handleForgotPassword()}
                      className="relative flex justify-center items-center mt-2"
                    >
                      <Image
                        source={require("../assets/images/button/button1.png")}
                        alt="button"
                        className="w-32 h-10"
                      />
                      <Text className="text-lg text-white absolute font-Nobile">
                        Submit ✔︎
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
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
    elevation: 8,
  },
});
