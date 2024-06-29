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
      const ingredientNames = selectedIngredients.map(
        (ingredient) => ingredient.name
      );
      console.log("ingredientNames:", ingredientNames);

      const response = await fetch(
        `${BACKEND_URL}/users/addIngredient/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ingredients: ingredientNames }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add ingredients");
      }
      const data = await response.json();
      console.log("Added ingredients:", data);
      alert("Ingredients added successfully");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cyan-800 items-center justify-center ">
      <StatusBar barStyle="light-content" />
      <Background cellSize={25} />
      <View className="flex justify-center items-center m-4">
        {!cameraOpen && (
          <View className="flex justify-center items-center">
            <View className="m-4 flex flex-row justify-center items-center">
              <TouchableOpacity
                onPress={selectImage}
                className="p-2 m-2 bg-white rounded-xl"
              >
                <Entypo name="upload" size={34} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openCamera}
                className="p-2 m-2 bg-white rounded-xl"
              >
                <Entypo name="video-camera" size={34} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="w-72 h-72 p-2 relative justify-center items-center"
              onPress={selectImage}
            >
              {image ? (
                <View
                  className="border-4 border-slate-400 rounded-2xl w-72 h-72 relative flex justify-center items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 4,
                      height: 4,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 8,
                  }}
                >
                  <Image
                    source={{ uri: image }}
                    className="w-64 h-64 absolute justify-center items-center rounded-2xl"
                  />
                </View>
              ) : (
                <Image
                  source={require("../../assets/images/fridge/fridge5.png")}
                  className="w-64 h-64 absolute justify-center items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 4,
                      height: 4,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 8,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="flex justify-center items-center m-4">
        {image && !cameraOpen && (
          <Text className="text-white text-lg">
            Predictions:{" "}
            {isPredictionLoading ? <ActivityIndicator size="small" /> : ""}
          </Text>
        )}
        {!cameraOpen &&
          image &&
          predictions &&
          predictions.slice(0, 5).map((prediction, index) => (
            <View key={index} className="w-[200] p-2">
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
                  color: "white",
                  fontFamily: "Nobile",
                  textDecorationLine: "none",
                }}
                fillColor="#FED400"
                unFillColor={"transparent"}
                innerIconStyle={{ borderColor: "white" }}
                bounceEffectIn={0.6}
              />
              <RNBounceable
                onPress={() => console.log("Pressed")}
              ></RNBounceable>
            </View>
          ))}
      </View>

      {selectedIngredients.length > 0 && (
        <TouchableOpacity
          onPress={addIngredients}
          className="relative flex justify-center items-center top-4"
        >
          <Image
            source={require("../../assets/images/button/button8.png")}
            alt="button"
            className="w-48 h-12"
          />
          <Text
            className="text-lg text-slate-700 absolute"
            style={{
              fontFamily: "Nobile",
            }}
          >
            Add Ingredient(s)
          </Text>
        </TouchableOpacity>
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
