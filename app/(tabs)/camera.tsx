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
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { PAT, USER_ID, APP_ID, MODEL_ID, MODEL_VERSION_ID } from "@env";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import Background from "@/components/Background";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
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

  // Classify the image
  // const classifyImage = async () => {
  //   try {
  //     if (!isTfReady || !isModelReady || !image || !model) {
  //       return;
  //     }
  //     setPredictionLoading(true);
  //     setPredictions([]); // Clear previous predictions

  //     // Get the raw image data
  //     const response = await fetch(image);
  //     const rawImageData = await response.arrayBuffer();
  //     const imageTensor = tf.tidy(() => imageToTensor(rawImageData));

  //     // Make a prediction through the model on our image
  //     const predictions = await model.classify(imageTensor);
  //     if (predictions && predictions.length > 0) {
  //       console.log("Predictions:", predictions);
  //       setPredictions(predictions);
  //     } else {
  //       console.log("No predictions available");
  //     }

  //     // Dispose the tensor to free up GPU memory
  //     imageTensor.dispose();
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setPredictionLoading(false);
  //   }
  // };

  // // Helper function to convert an image to a tensor
  // const imageToTensor = (rawImageData: ArrayBuffer) => {
  //   const TO_UINT8ARRAY = true;
  //   const { width, height, data } = jpeg.decode(rawImageData, {
  //     useTArray: TO_UINT8ARRAY,
  //   });

  //   // Drop the alpha channel info
  //   const buffer = new Uint8Array(width * height * 3);
  //   let offset = 0;
  //   for (let i = 0; i < buffer.length; i += 3) {
  //     buffer[i] = data[offset];
  //     buffer[i + 1] = data[offset + 1];
  //     buffer[i + 2] = data[offset + 2];
  //     offset += 4;
  //   }
  //   return tf.tensor3d(buffer, [height, width, 3]);
  // };

  // // Helper function to render a prediction
  // const renderPrediction = (prediction: {
  //   className: string;
  //   probability: number;
  // }) => {
  //   if (!prediction) {
  //     return null;
  //   }
  //   return (
  //     <Text key={prediction.className} className="text-white text-lg">
  //       {prediction.className} ({(prediction.probability * 100).toFixed(2)}%)
  //     </Text>
  //   );
  // };

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

  const renderPrediction = (prediction) => {
    if (!prediction) {
      return null;
    }
    return (
      <Text key={prediction.id} className="text-white text-lg">
        {prediction.name} ({(prediction.value * 100).toFixed(2)}%)
      </Text>
    );
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
                onPress={() => console.log("Pressed")}
                isChecked={false}
                text={
                  prediction.name +
                  " (" +
                  (prediction.value * 100).toFixed(2) +
                  "%)"
                }
                textStyle={{
                  color: "white",
                  fontFamily: "Nobile",
                }}
                iconStyle={{
                  borderColor: "white",
                }}
                fillColor="white"
                bounceEffectIn={0.6}
              />
              <RNBounceable
                onPress={() => console.log("Pressed")}
              ></RNBounceable>
            </View>
          ))}
      </View>
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
