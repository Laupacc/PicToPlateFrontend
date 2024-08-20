import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import {
  ScrollView,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import * as ImagePicker from "expo-image-picker";
import {
  CameraView,
  useCameraPermissions,
  CameraType,
  FlashMode,
} from "expo-camera";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LottieView from "lottie-react-native";
import { RootState } from "@/store/store";
import { updateIngredients } from "@/store/fridge";
import Background from "@/components/Background";
import { BACKEND_URL } from "@/_recipeUtils";

const PAT = "83d75a04e4344dc5a05b3c633f6c9613";
const USER_ID = "clarifai";
const APP_ID = "main";
const MODEL_ID = "food-item-recognition";
const MODEL_VERSION_ID = "1d5fd481e0cf4826aa72ec3ff049e044";

export default function Camera() {
  const [isPredictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType | undefined>("back");
  const [flash, setFlash] = useState<FlashMode | undefined>("off");
  const [zoom, setZoom] = useState<number>(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const [addedIngredients, setAddedIngredients] = useState<string[]>([]);

  const dispatch = useDispatch();
  const toast = useToast();
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.user.value);

  const screenWidth = Dimensions.get("window").width;

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

  // Handle pinch gesture to zoom in/out
  const handlePinch = ({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.state === State.ACTIVE) {
      const newZoom = Math.min(
        Math.max(zoom + (nativeEvent.scale - 1) * 0.1, 0),
        1
      );
      setZoom(newZoom);
    }
  };

  // Classify the image using the Clarifai API
  const classifyImage = async (imageUri: string) => {
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

  // Convert a blob to base64
  const blobToBase64 = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Toggle the selected ingredient
  const toggleIngredient = (prediction: any) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(prediction)) {
        return prev.filter((item) => item !== prediction);
      } else {
        return [...prev, prediction];
      }
    });
  };

  // Add the selected ingredients to the user's kitchen
  const addIngredients = async () => {
    if (!user.token) {
      Alert.alert(
        "Login Required",
        "Please log in to add ingredients to your kitchen",
        [
          {
            text: "No thanks",
            style: "cancel",
          },
          {
            text: "Login",
            onPress: () => {
              navigation.navigate("authentication");
            },
          },
        ]
      );
      return;
    }

    if (selectedIngredients.length === 0) {
      toast.show("Please select at least one ingredient to add", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning-outline" size={24} color="white" />,
      });
      return;
    }

    try {
      // Fetch existing ingredients from the fridge
      const existingIngredientsResponse = await fetch(
        `${BACKEND_URL}/users/fetchIngredients/${user.token}`
      );
      const existingIngredientsData = await existingIngredientsResponse.json();
      const existingIngredients = existingIngredientsData.ingredients.map(
        (ingredient: { name: string }) => ingredient.name.toLowerCase()
      );

      // Filter out the ingredients that are already in the fridge
      const newIngredients = selectedIngredients
        .filter((ingredient) => !existingIngredients.includes(ingredient.name))
        .map((ingredient) => ({
          name: ingredient.name,
          dateAdded: ingredient.dateAdded,
        }));

      const alreadyInFridgeNames = selectedIngredients
        .map((ingredient) => ingredient.name)
        .filter((name) => existingIngredients.includes(name))
        .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
        .join(", ");

      const ingredientCount = alreadyInFridgeNames.split(", ").length;

      const message = `${alreadyInFridgeNames} ${
        ingredientCount > 1 ? "are" : "is"
      } already in your fridge`;

      if (newIngredients.length === 0) {
        toast.show(message, {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning-outline" size={24} color="white" />,
        });
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/users/addIngredient/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ingredients: newIngredients }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add ingredients");
      }
      const responseData = await response.json();
      console.log("Ingredients added:", responseData);

      dispatch(updateIngredients(newIngredients));
      setAddedIngredients((prev) => [
        ...prev,
        ...newIngredients.map((i) => i.name),
      ]);
      setSelectedIngredients([]);

      const newIngredientsNames = newIngredients
        .map(
          (ingredient) =>
            ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)
        )
        .join(", ");

      toast.show(`${newIngredientsNames} have been added successfully`, {
        type: "success",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: (
          <Ionicons name="checkmark-circle-outline" size={24} color="white" />
        ),
      });
      setTimeout(() => {
        navigation.navigate("fridge");
      }, 2000);
    } catch (error) {
      console.error("Failed to add ingredients:", error);
      toast.show("Failed to add ingredients. Please try again.", {
        type: "danger",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="close-circle-outline" size={24} color="white" />,
      });
    }
  };

  // Random Lottie loading animation
  const randomLoadingAnimation = () => {
    const animations = [
      require("../../assets/images/animations/Animation1723027836457.json"),
      require("../../assets/images/animations/Animation1722874735851.json"),
      require("../../assets/images/animations/Animation1720193319067.json"),
      require("../../assets/images/animations/Animation1720193239255.json"),
    ];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-600 pb-16">
      <Background cellSize={25} />
      <StatusBar barStyle="light-content" />

      <View className="flex justify-center items-center m-2">
        {/* Main screen */}
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

      {/* Loading animation while predicting */}
      {isPredictionLoading && (
        <LottieView
          source={randomLoadingAnimation()}
          autoPlay
          loop
          style={{
            width: "60%",
            height: "40%",
          }}
        />
      )}

      {/* Prediction results */}
      {!cameraOpen && image && !isPredictionLoading && predictions && (
        <View className="relative">
          <View
            className="absolute bg-[#E56363] rounded-2xl right-0.5 bottom-0.5"
            style={{
              width: screenWidth - 45,
              height: 295,
              ...styles.shadow,
            }}
          ></View>
          <View
            className="flex justify-center items-center bg-slate-50 rounded-2xl m-2 p-2"
            style={{
              width: screenWidth - 45,
              height: 295,
            }}
          >
            <View className="flex justify-center items-center w-full p-2 bg-[#E56363] rounded-t-2xl mb-1">
              <Text className="text-xl text-center text-slate-900 font-Maax">
                Prediction Results:
              </Text>
            </View>
            <ScrollView className="flex-1">
              {predictions.slice(0, 10).map((prediction, index) => (
                <View
                  key={index}
                  className="p-1 flex justify-center items-center w-[340]"
                >
                  <BouncyCheckbox
                    onPress={() => toggleIngredient(prediction)}
                    isChecked={
                      addedIngredients.includes(prediction.name) ||
                      selectedIngredients.includes(prediction)
                    }
                    disabled={addedIngredients.includes(prediction.name)}
                    text={
                      prediction.name.charAt(0).toUpperCase() +
                      prediction.name.slice(1) +
                      " (" +
                      (prediction.value * 100).toFixed(2) +
                      "%)"
                    }
                    textStyle={{
                      fontFamily: "SpaceMono",
                      textDecorationLine: addedIngredients.includes(
                        prediction.name
                      )
                        ? "line-through"
                        : "none",
                    }}
                    fillColor="#FED400"
                    unFillColor="#e2e8f0"
                    innerIconStyle={{ borderColor: "#334155" }}
                    bounceEffectIn={0.6}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Add ingredients button */}
            <View className="w-full flex items-center ">
              <TouchableOpacity
                onPress={addIngredients}
                className="relative flex justify-center items-center"
                style={styles.shadow}
              >
                <Image
                  source={require("../../assets/images/button/button7.png")}
                  alt="button"
                  className="w-28 h-9"
                />
                <Text className="text-base text-slate-700 absolute font-Nobile">
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Camera view */}
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
            className="w-full h-full"
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
