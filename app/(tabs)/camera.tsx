import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import {
  ScrollView,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Accelerometer } from "expo-sensors";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
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

export default function Camera() {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.user.value);
  const fridgeItems = useSelector(
    (state: RootState) => state.fridge.ingredients
  );

  const [isPredictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [deviceOrientation, setDeviceOrientation] =
    useState<string>("portrait");
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
  const [alreadyInFridge, setAlreadyInFridge] = useState<string[]>([]);
  const [existingIngredientsSelected, setExistingIngredientsSelected] =
    useState(false);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const calculatedHeight = screenWidth * (9 / 16);
  const isSmallScreen = screenWidth < 400;

  // Set the status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  // Select an image from the camera roll
  const selectImage = async () => {
    try {
      // Request permission to access the camera roll for IOS, no need for Android
      if (Platform.OS === "ios") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("We need camera roll permissions to make this work!");
        }
      }

      // Open the image picker
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

  // Get the device orientation using the accelerometer
  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y }) => {
      if (Math.abs(x) > Math.abs(y)) {
        if (x > 0) {
          setDeviceOrientation("landscape-right");
        } else {
          setDeviceOrientation("landscape-left");
        }
      } else {
        if (y > 0) {
          setDeviceOrientation("portrait");
        } else {
          setDeviceOrientation("portrait-upside-down");
        }
      }
    });

    Accelerometer.setUpdateInterval(1000);

    return () => {
      subscription.remove();
    };
  }, []);

  // Take a picture with the camera
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
        });

        if (photo) {
          const fixedPhotoUri = await rotateImageBasedOnDeviceOrientation(
            photo.uri,
            deviceOrientation
          );
          setImage(fixedPhotoUri);
          console.log("Image taken:", fixedPhotoUri);
          classifyImage(fixedPhotoUri);
        } else {
          console.log("Failed to take picture");
        }
      } catch (error) {
        console.log("Error taking picture:", error);
      } finally {
        setCameraOpen(false);
      }
    } else {
      console.log("Camera not ready");
    }
  };

  // Rotate the image based on the device orientation
  const rotateImageBasedOnDeviceOrientation = async (
    uri: string,
    orientation: string
  ) => {
    let rotateAngle = 0;

    if (Platform.OS === "ios") {
      switch (orientation) {
        case "landscape-left":
          rotateAngle = -90;
          break;
        case "landscape-right":
          rotateAngle = 90;
          break;
        case "portrait-upside-down":
          rotateAngle = 0;
          break;
        case "portrait":
          rotateAngle = 180;
          break;
        default:
          rotateAngle = 0;
      }
    } else {
      // Android logic
      switch (orientation) {
        case "landscape-left":
          rotateAngle = 90;
          break;
        case "landscape-right":
          rotateAngle = -90;
          break;
        case "portrait-upside-down":
          rotateAngle = 180;
          break;
        case "portrait":
          rotateAngle = 0;
          break;
        default:
          rotateAngle = 0;
      }
    }

    if (
      rotateAngle !== 0 ||
      (Platform.OS === "ios" && orientation === "portrait")
    ) {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ rotate: rotateAngle }],
        { compress: 1, format: SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    }

    return uri; // Return the original if no rotation is needed
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
      setPredictions([]);
      setPredictionLoading(true);

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];

        // Send the image to the backend for classification
        const responseFromBackend = await fetch(
          `${BACKEND_URL}/classifyImage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageBase64: base64data }),
          }
        );

        // Get the predictions from the backend
        const response = await responseFromBackend.text();
        const predictions = JSON.parse(response);

        if (predictions && predictions.length > 0) {
          console.log("Predictions:", predictions);
          setPredictions(predictions);
        } else {
          console.log("No predictions available");
        }
        setPredictionLoading(false);
      };
    } catch (error: any) {
      console.log("Failed to classify image:", error);
    }
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

  // Random Lottie loading animation
  const randomLoadingAnimation = () => {
    const animations = [
      require("../../assets/images/animations/Animation1722874735851.json"),
      // require("../../assets/images/animations/Animation1720193319067.json"),
      // require("../../assets/images/animations/Animation1720193239255.json"),
    ];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  // Check if the selected ingredients are already in the fridge
  useEffect(() => {
    if (existingIngredientsSelected) {
      setAlreadyInFridge(fridgeItems.map((item) => item.name));
    }
  }, [fridgeItems]);

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

      const existingIngredientsSelected = existingIngredients.filter(
        (name: any) =>
          selectedIngredients
            .map((ingredient) => ingredient.name)
            .includes(name)
      );

      setAlreadyInFridge(existingIngredientsSelected);
      if (existingIngredientsSelected.length > 0) {
        setExistingIngredientsSelected(true);
      }

      const ingredientCount = alreadyInFridgeNames.split(", ").length;

      const message = `${alreadyInFridgeNames} ${
        ingredientCount > 1 ? "are" : "is"
      } already in your kitchen`;

      if (alreadyInFridgeNames.length > 0) {
        toast.show(message, {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning-outline" size={24} color="white" />,
        });
      }
      if (newIngredients.length > 0) {
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

        const newIngredientCount = newIngredientsNames.split(", ").length;
        const newMessage = `${newIngredientsNames} ${
          newIngredientCount > 1 ? "have" : "has"
        } been successfully added to your kitchen`;

        toast.show(newMessage, {
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
      }
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

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-600 pb-16">
      <Background cellSize={25} />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

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
                    source={require("../../assets/images/arrows/curvedArrowDown.png")}
                    className="w-10 h-10"
                  />
                </View>

                <TouchableOpacity
                  onPress={selectImage}
                  className="p-2 m-4 bg-white rounded-xl flex justify-center items-center "
                >
                  <Image
                    source={require("../../assets/images/filmRoll.png")}
                    className={isSmallScreen ? "w-12 h-12" : "w-14 h-14"}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex flex-row items-end">
                <TouchableOpacity
                  onPress={openCamera}
                  className="p-2 m-4 bg-white rounded-xl flex justify-center items-center"
                >
                  <Image
                    source={require("../../assets/images/camera.png")}
                    className={isSmallScreen ? "w-12 h-12" : "w-14 h-14"}
                  />
                </TouchableOpacity>
                <View className="flex justify-center items-start">
                  <Image
                    source={require("../../assets/images/arrows/curvedArrowUp.png")}
                    className="w-10 h-10"
                  />
                  <Text className="text-white text-2xl text-center font-CreamyCookies">
                    Camera
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex justify-center items-center">
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
                      source={require("../../assets/images/recognition.png")}
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
              height: isSmallScreen ? 255 : 295,
              ...styles.shadow,
            }}
          ></View>
          <View
            className="flex justify-center items-center bg-slate-50 rounded-2xl m-2 p-2"
            style={{
              width: screenWidth - 45,
              height: isSmallScreen ? 255 : 295,
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
                  className={
                    isSmallScreen
                      ? "p-0.5 flex justify-center items-center w-[300] mt-0.5"
                      : "p-1 flex justify-center items-center w-[340]"
                  }
                >
                  <BouncyCheckbox
                    onPress={() => toggleIngredient(prediction)}
                    isChecked={
                      selectedIngredients.includes(prediction) ||
                      addedIngredients.includes(prediction.name) ||
                      alreadyInFridge.includes(prediction.name)
                    }
                    disabled={
                      addedIngredients.includes(prediction.name) ||
                      alreadyInFridge.includes(prediction.name)
                    }
                    text={
                      prediction.name.charAt(0).toUpperCase() +
                      prediction.name.slice(1) +
                      " (" +
                      (prediction.value * 100).toFixed(2) +
                      "%)"
                    }
                    textStyle={{
                      fontFamily: "SpaceMono",
                      fontSize: isSmallScreen ? 14 : 16,
                      textDecorationLine:
                        addedIngredients.includes(prediction.name) ||
                        alreadyInFridge.includes(prediction.name)
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
              <TouchableOpacity hitSlop={20} onPress={toggleCameraFacing}>
                {Platform.OS === "ios" ? (
                  <MaterialCommunityIcons
                    name="camera-flip-outline"
                    size={45}
                    color="white"
                  />
                ) : (
                  <MaterialIcons
                    name="flip-camera-android"
                    size={45}
                    color="white"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity hitSlop={20} onPress={toggleFlash}>
                {flash === "on" ? (
                  <MaterialCommunityIcons
                    name="flash"
                    size={45}
                    color="white"
                  />
                ) : flash === "auto" ? (
                  <MaterialCommunityIcons
                    name="flash-auto"
                    size={45}
                    color="white"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="flash-off"
                    size={45}
                    color="white"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                hitSlop={20}
                onPress={() => setCameraOpen(false)}
              >
                <Ionicons name="close-circle-outline" size={45} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 justify-end items-center mb-10">
              <TouchableOpacity onPress={takePicture}>
                <MaterialCommunityIcons
                  name="circle-slice-8"
                  size={80}
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
