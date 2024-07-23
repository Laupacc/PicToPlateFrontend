import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import React from "react";
import { Link } from "expo-router";
import { useState, useEffect } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Background from "@/components/Background";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/store/user";
import { useToast } from "react-native-toast-notifications";
import { Modal } from "react-native-paper";

export default function Authentication() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isloginPasswordHidden, setIsLoginPasswordHidden] = useState(true);
  const [isSignUpPasswordHidden, setIsSignUpPasswordHidden] = useState(true);
  const [signUpVisible, setSignUpVisible] = useState(false);
  const [signUpUsernameEmpty, setSignUpUsernameEmpty] = useState(false);
  const [signUpPasswordEmpty, setSignUpPasswordEmpty] = useState(false);
  const [loginUsernameEmpty, setLoginUsernameEmpty] = useState(false);
  const [loginPasswordEmpty, setLoginPasswordEmpty] = useState(false);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState("");

  const BACKEND_URL = "http://192.168.114.158:3000";

  // Check if token exists
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          dispatch(login({ token }));
          console.log("Token found, navigating to search screen");
          navigation.navigate("(tabs)", { screen: "search" });
        } else {
          console.log("No token found");
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };
    checkToken();
  }, []);

  const validateEmail = (email) => {
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
      console.log(data);
      if (!response.ok) {
        alert(data.message);
        return;
      }
      if (data.result) {
        // await SecureStore.setItemAsync("token", data.token);
        // console.log("Token stored successfully");

        console.log("User signed up successfully", data);
        dispatch(login(data));

        navigation.navigate("(tabs)", { screen: "profile" });
        setSignUpUsername("");
        setSignUpEmail("");
        setSignUpPassword("");
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

      if (data.result) {
        console.log("Logged in successfully", data);
        dispatch(login(data));

        await SecureStore.setItemAsync("token", data.token);
        console.log("Token stored successfully");

        navigation.navigate("(tabs)", { screen: "profile" });
        setLoginUsername("");
        setLoginPassword("");
        alert("Logged in successfully");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/users/forgotPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });
      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        alert(data.message);
        return;
      }
      if (data.result) {
        console.log("Password reset link sent successfully", data);
        alert("Password reset link sent successfully");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // async function getValueFor(key) {
  //   const result = await SecureStore.getItemAsync(key);
  //   if (result) {
  //     alert("🔐 Here's your value 🔐 \n" + result);
  //   } else {
  //     alert("No values stored under that key.");
  //   }
  // }

  const toggleSignUpPasswordVisibility = () => {
    setIsSignUpPasswordHidden(!isSignUpPasswordHidden);
  };
  const toggleLoginPasswordVisibility = () => {
    setIsLoginPasswordHidden(!isloginPasswordHidden);
  };

  const toggleForgotPasswordModal = () => {
    setForgotPasswordModal(!forgotPasswordModal);
  };

  return (
    <View className="flex-1 justify-center items-center">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      <View className="flex justify-center items-center mb-2 absolute top-16">
        <Image
          source={require("../assets/images/logo8.png")}
          className="w-60 h-14"
        />
      </View>

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
              <Text className="text-red-500">Username cannot be empty</Text>
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
                <FontAwesome
                  name={isloginPasswordHidden ? "eye" : "eye-slash"}
                  size={20}
                />
              </TouchableOpacity>
            </View>
            {loginPasswordEmpty && (
              <Text className="text-red-500">Password cannot be empty</Text>
            )}

            <TouchableOpacity
              onPress={toggleForgotPasswordModal}
              className="flex justify-center items-center top-2"
            >
              <Text>Forgot password?</Text>
            </TouchableOpacity>

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
            <View className="flex justify-center items-center top-20">
              <Text>Don't have an account yet?</Text>
              <TouchableOpacity onPress={() => setSignUpVisible(true)}>
                <Text className="text-lg">Sign Up</Text>
              </TouchableOpacity>
            </View>
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
              <Text className="text-red-500">Username cannot be empty</Text>
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
                <FontAwesome
                  name={isSignUpPasswordHidden ? "eye" : "eye-slash"}
                  size={20}
                />
              </TouchableOpacity>
            </View>
            {signUpPasswordEmpty && (
              <Text className="text-red-500">Password cannot be empty</Text>
            )}
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
            <View className="flex justify-center items-center top-12">
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
        contentContainerStyle={{
          backgroundColor: "white",
          paddingHorizontal: 40,
          paddingVertical: 60,
          margin: 40,
          borderRadius: 20,
        }}
      >
        <View className="flex justify-center items-center">
          <Text>Reset Password</Text>
          <TextInput
            placeholder="Enter your email"
            autoCapitalize="none"
            className="bg-slate-100 w-48 h-12 rounded-xl border border-slate-400 pl-4 m-2"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <TouchableOpacity
            onPress={() => {
              handleForgotPassword();
              toggleForgotPasswordModal();
            }}
            className="relative flex justify-center items-center top-4"
          >
            <Image
              source={require("../assets/images/button/button1.png")}
              alt="button"
              className="w-40 h-12"
            />
            <Text className="text-xl text-white absolute font-Nobile">
              Submit ✔︎
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* <TouchableOpacity onPress={() => getValueFor("token")}>
        <Text className="text-lg text-red-500">Get Token</Text>
      </TouchableOpacity> */}
      {/* </ImageBackground> */}
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
