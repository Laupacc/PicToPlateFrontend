import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ImageBackground,
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

export default function Authentication() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isloginPasswordHidden, setIsLoginPasswordHidden] = useState(true);
  const [isSignUpPasswordHidden, setIsSignUpPasswordHidden] = useState(true);
  const [signUpVisible, setSignUpVisible] = useState(false);
  const [signUpUsernameEmpty, setSignUpUsernameEmpty] = useState(false);
  const [signUpPasswordEmpty, setSignUpPasswordEmpty] = useState(false);
  const [loginUsernameEmpty, setLoginUsernameEmpty] = useState(false);
  const [loginPasswordEmpty, setLoginPasswordEmpty] = useState(false);

  const BACKEND_URL = "http://192.168.1.34:3000";

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          dispatch(login({ token }));
          console.log("Token found, navigating to profile");
          navigation.navigate("(tabs)", { screen: "profile" });
        } else {
          console.log("No token found");
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };
    checkToken();
  }, []);

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

    try {
      const response = await fetch(`${BACKEND_URL}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signUpUsername,
          password: signUpPassword,
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
        setSignUpPassword("");
        alert("User signed up successfully");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
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
        console.log("User logged in successfully", data);
        dispatch(login(data));

        await SecureStore.setItemAsync("token", data.token);
        console.log("Token stored successfully");

        navigation.navigate("(tabs)", { screen: "profile" });
        setLoginUsername("");
        setLoginPassword("");
        alert("Signed in successfully");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  async function getValueFor(key) {
    const result = await SecureStore.getItemAsync(key);
    if (result) {
      alert("🔐 Here's your value 🔐 \n" + result);
    } else {
      alert("No values stored under that key.");
    }
  }

  const toggleSignUpPasswordVisibility = () => {
    setIsSignUpPasswordHidden(!isSignUpPasswordHidden);
  };
  const toggleLoginPasswordVisibility = () => {
    setIsLoginPasswordHidden(!isloginPasswordHidden);
  };

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

  return (
    <View className="flex-1 justify-center items-center">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      {/* <ImageBackground
        source={randomBackgroundImages()}
        className="w-full h-full flex justify-center items-center"
      >
        <LinearGradient
          colors={["transparent", "black"]}
          className="absolute w-full h-full"
        /> */}

      <View className="absolute top-16">
        <Image
          source={require("../assets/images/logo7.png")}
          className="w-60 h-14"
        />
      </View>

      {/* Login */}
      {!signUpVisible && (
        <View
          className="relative flex justify-center items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 2,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
          }}
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
              onPress={handleLogin}
              className="relative flex justify-center items-center top-4"
            >
              <Image
                source={require("../assets/images/button/button3.png")}
                alt="button"
                className="w-40 h-12"
              />
              <Text
                className="text-xl text-white absolute"
                style={{ fontFamily: "Nobile" }}
              >
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
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 2,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
          }}
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
            <View className="relative">
              <TextInput
                placeholder="Password"
                value={signUpPassword}
                secureTextEntry={isSignUpPasswordHidden}
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
              <Text
                className="text-xl text-white absolute"
                style={{ fontFamily: "Nobile" }}
              >
                Sign Up ✔︎
              </Text>
            </TouchableOpacity>
            <View className="flex justify-center items-center top-20">
              <Text>Already have an account?</Text>
              <TouchableOpacity onPress={() => setSignUpVisible(false)}>
                <Text className="text-lg">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* <TouchableOpacity onPress={() => getValueFor("token")}>
        <Text className="text-lg text-red-500">Get Token</Text>
      </TouchableOpacity> */}
      {/* </ImageBackground> */}
    </View>
  );
}
