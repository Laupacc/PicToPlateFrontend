import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  CameraView,
  useCameraPermissions,
  CameraType,
  FlashMode,
} from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import Background from "@/components/Background";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import { useDispatch, useSelector } from "react-redux";
import { useRoute } from "@react-navigation/native";
import { addIngredient, updateIngredients } from "@/store/fridge";
import LottieView from "lottie-react-native";
import { useToast } from "react-native-toast-notifications";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  ImageBackground,
} from "react-native";
import { Line } from "react-native-svg";

const PAT = "83d75a04e4344dc5a05b3c633f6c9613";
const USER_ID = "clarifai";
const APP_ID = "main";
const MODEL_ID = "food-item-recognition";
const MODEL_VERSION_ID = "1d5fd481e0cf4826aa72ec3ff049e044";

export default function Camera() {
  const [isPredictionLoading, setPredictionLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [image, setImage] = useState("");
  const [facing, setFacing] = useState<CameraType | undefined>("back");
  const [flash, setFlash] = useState<FlashMode | undefined>("off");
  const [zoom, setZoom] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const pinchRef = useRef(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const dispatch = useDispatch();
  const route = useRoute();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const BACKEND_URL = "http://192.168.1.34:3000";

  // useEffect to get the camera permissions
  useEffect(() => {
    getPermissionAsync();
  }, []);

  // Request permission to access the camera roll for IOS, no need for Android
  const getPermissionAsync = async () => {
    if (Platform.OS === "ios") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("We need camera roll permissions to make this work!");
      }
    }
  };

  // Select an image from the camera roll
  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        console.log("Image selected:", result.assets[0].uri);
        classifyImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("ImagePicker error", error);
    }
  };

  // Request permission to access the camera when opening the camera
  const openCamera = async () => {
    if (!permission || !permission.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        alert("We need camera permissions to open the camera");
        return;
      }
    }
    setCameraOpen(true);
  };

  // Take a picture with the camera
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setImage(photo.uri);
        console.log("Image taken:", photo.uri);
        classifyImage(photo.uri);
      } else {
        console.log("Failed to take picture");
      }
      setCameraOpen(false);
    } else {
      console.log("Camera not ready");
    }
  };

  // Toggle the camera facing
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // Toggle the camera flash
  function toggleFlash() {
    setFlash((current) =>
      current === "on" ? "off" : current === "off" ? "auto" : "on"
    );
  }

  const handlePinch = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      const newZoom = Math.min(
        Math.max(zoom + (nativeEvent.scale - 1) * 0.1, 0),
        1
      );
      setZoom(newZoom);
    }
  };

  const classifyImage = async (imageUri) => {
    try {
      setPredictionLoading(true);
      setPredictions([]);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Image = await blobToBase64(blob);

      const raw = JSON.stringify({
        user_app_id: {
          user_id: USER_ID,
          app_id: APP_ID,
        },
        inputs: [
          {
            data: {
              image: {
                base64: base64Image,
              },
            },
          },
        ],
      });

      const requestOptions = {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Key " + PAT,
          "Content-Type": "application/json",
        },
        body: raw,
      };

      const result = await fetch(
        `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
        requestOptions
      );
      const resultJson = await result.json();

      const predictions = resultJson.outputs[0].data.concepts;
      if (predictions && predictions.length > 0) {
        console.log("Predictions:", predictions);
        setPredictions(predictions);
      } else {
        console.log("No predictions available");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setPredictionLoading(false);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const toggleIngredient = (prediction) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(prediction)) {
        return prev.filter((item) => item !== prediction);
      } else {
        return [...prev, prediction];
      }
    });
  };

  // Add the selected ingredients to the user.ingredients array
  const addIngredients = async () => {
    try {
      const ingredients = selectedIngredients.map((ingredient) => ({
        name: ingredient.name,
        dateAdded: ingredient.dateAdded || new Date().toISOString(),
      }));
      console.log("ingredients:", ingredients);

      const response = await fetch(
        `${BACKEND_URL}/users/addIngredient/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ingredients }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add ingredients");
      }
      const data = await response.json();
      console.log("Added ingredients:", data);
      toast.show(`${ingredients} added successfully`, {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });

      dispatch(addIngredient(ingredients));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center pb-16">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["transparent", "#0891b2", "#0d6e8c", "#0a4f6c"]}
            className="absolute top-0 left-0 right-0 bottom-0"
      />
      <Background cellSize={25} />

      {/* <View className="flex justify-center items-center">
        <Text
          className="text-white text-2xl text-center"
          style={{
            fontFamily: "Nobile",
          }}
        >
          Upload or take a picture of your ingredients to add them to your
          pantry.
        </Text>
      </View> */}

      <View className="flex justify-center items-center m-4">
        {!cameraOpen && (
          <View className="flex justify-center items-center">
            <View className="m-4 flex flex-row justify-center items-center">
              <View className="flex flex-row items-start">
                <View className="flex justify-center items-end">
                  <Text className="text-white text-2xl text-center font-CreamyCookies">
                    Upload
                  </Text>
                  <Image
                    source={require("../../assets/images/curvedArrowDown.png")}
                    className="w-10 h-10"
                  />
                </View>

                <TouchableOpacity
                  onPress={selectImage}
                  className="p-2 m-4 bg-white rounded-xl flex justify-center items-center "
                >
                  <Image
                    source={require("../../assets/images/uploadPhoto2.png")}
                    className="w-14 h-14"
                  />
                </TouchableOpacity>
              </View>

              <View className="flex flex-row items-end">
                <TouchableOpacity
                  onPress={openCamera}
                  className="p-2 m-4 bg-white rounded-xl flex justify-center items-center"
                >
                  <Image
                    source={require("../../assets/images/takeaphoto.png")}
                    className="w-14 h-14"
                  />
                </TouchableOpacity>
                <View className="flex justify-center items-start">
                  <Image
                    source={require("../../assets/images/curvedArrowUp.png")}
                    className="w-10 h-10"
                  />
                  <Text className="text-white text-2xl text-center font-CreamyCookies">
                    Camera
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="flex justify-center items-center"
              // onPress={selectImage}
            >
              {image ? (
                <View
                  className="border-4 border-[#E56363] rounded-2xl w-64 h-64 relative flex justify-center items-center"
                  style={styles.shadow}
                >
                  <Image
                    source={{ uri: image }}
                    className="w-56 h-56 absolute justify-center items-center rounded-2xl"
                  />
                </View>
              ) : (
                <View className="relative">
                  <View
                    className="absolute bg-[#E56363] rounded-2xl right-0.5 bottom-0.5 w-64 h-64"
                    style={styles.shadow}
                  ></View>
                  <View className="flex justify-center items-center bg-white rounded-2xl m-2 p-2 w-64 h-64">
                    <Image
                      source={require("../../assets/images/uploadPhoto1.png")}
                      className="w-52 h-52 justify-center items-center"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* {isPredictionLoading && (
        <ActivityIndicator size="large" color="#FED400" />
      )} */}

      {isPredictionLoading && (
        <LottieView
          source={require("../../assets/images/animations/Animation1720193319067.json")}
          autoPlay
          loop
          style={{
            width: "60%",
            height: "40%",
            // position: "absolute",
            // top: "55%",
          }}
        />
      )}

      {/* <View className="flex justify-center items-center m-4">
        {!cameraOpen && !isPredictionLoading && !image && (
          <View className="flex justify-center items-center">
            <Text className="text-white text-lg text-center">
              Upload an image or take a picture to get started!
            </Text>
            <Image
              source={require("../../assets/images/missingIng.png")}
              className="w-64 h-64"
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 4,
                  height: 4,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              }}
            />
          </View>
        )}
      </View> */}

      {!cameraOpen && image && !isPredictionLoading && predictions && (
        <View className="flex justify-center items-center relative">
          <Image
            source={require("../../assets/images/recipeBack/recipeBack10.png")}
            className="w-[410] h-[325]"
          />
          <View className="flex justify-center items-center absolute">
            <View className="flex justify-center items-center">
              <>
                <Text className="text-base text-center mb-1 font-Nobile">
                  AI Predictions
                </Text>
                {predictions.slice(0, 5).map((prediction, index) => (
                  <View key={index} className="w-[220] p-1.5">
                    <BouncyCheckbox
                      onPress={() => toggleIngredient(prediction)}
                      isChecked={selectedIngredients.includes(prediction)}
                      text={
                        (
                          prediction.name +
                          " (" +
                          (prediction.value * 100).toFixed(2) +
                          "%)"
                        )
                          .charAt(0)
                          .toUpperCase() +
                        (
                          prediction.name +
                          " (" +
                          (prediction.value * 100).toFixed(2) +
                          "%)"
                        ).slice(1)
                      }
                      textStyle={{
                        fontFamily: "Nobile",
                        textDecorationLine: "none",
                      }}
                      fillColor="#FED400"
                      // unFillColor="#e2e8f0"
                      innerIconStyle={{ borderColor: "grey" }}
                      bounceEffectIn={0.6}
                    />
                    {/* <RNBounceable
                      onPress={() => console.log("Pressed")}
                    ></RNBounceable> */}
                  </View>
                ))}
              </>
            </View>
            {selectedIngredients.length > 0 && (
              <TouchableOpacity
                onPress={addIngredients}
                className="relative flex justify-center items-center top-4"
              >
                <Image
                  source={require("../../assets/images/button/button8.png")}
                  alt="button"
                  className="w-44 h-12"
                />
                <Text className="text-base text-slate-700 absolute font-Nobile">
                  Add Ingredient(s)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {cameraOpen && (
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={handlePinch}
          onHandlerStateChange={handlePinch}
        >
          <CameraView
            ref={cameraRef}
            facing={facing}
            flash={flash}
            zoom={zoom}
            className="flex-1 w-full"
          >
            <View className="absolute top-0 left-0 right-0 flex flex-row justify-between p-4">
              <TouchableOpacity onPress={toggleCameraFacing}>
                {Platform.OS === "ios" ? (
                  <MaterialCommunityIcons
                    name="camera-flip-outline"
                    size={40}
                    color="white"
                  />
                ) : (
                  <MaterialIcons
                    name="flip-camera-android"
                    size={40}
                    color="white"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFlash}>
                {flash === "on" ? (
                  <MaterialCommunityIcons
                    name="flash"
                    size={40}
                    color="white"
                  />
                ) : flash === "auto" ? (
                  <MaterialCommunityIcons
                    name="flash-auto"
                    size={40}
                    color="white"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="flash-off"
                    size={40}
                    color="white"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCameraOpen(false)}>
                <Ionicons name="close-circle-outline" size={40} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 justify-end items-center mb-10">
              <TouchableOpacity onPress={takePicture}>
                <MaterialCommunityIcons
                  name="circle-slice-8"
                  size={70}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </CameraView>
        </PinchGestureHandler>
      )}
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
