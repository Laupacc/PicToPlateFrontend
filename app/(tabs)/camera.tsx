import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as jpeg from "jpeg-js";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "react-native-vector-icons/Entypo";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  Button,
} from "react-native";

export default function Camera() {
  // TensorFlow.js and model state
  const [isTfReady, setTfReady] = useState(false);
  const [isModelReady, setModelReady] = useState(false);
  const [isPredictionLoading, setPredictionLoading] = useState(false);
  const [predictions, setPredictions] = useState<
    { className: string; probability: number }[]
  >([]);
  const [image, setImage] = useState("");
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  // Camera state
  const [facing, setFacing] = useState<CameraType | undefined>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [show, setShow] = useState(false);

  // Load the TensorFlow.js model and request camera roll permissions
  useEffect(() => {
    const prepareModel = async () => {
      try {
        // Ensure that the TensorFlow.js environment is properly initialized
        await tf.ready();
        setTfReady(true);
        console.log("TensorFlow.js ready");

        // Load mobilenet model
        const loadedModel = await mobilenet.load();
        console.log("Model loaded");
        setModel(loadedModel);

        setModelReady(true);
        getPermissionAsync();
      } catch (error) {
        console.log(error);
      }
    };

    prepareModel();
  }, []);

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
      }
    } catch (error) {
      console.log("ImagePicker error", error);
    }
  };

  // Request permission to access the camera roll
  const getPermissionAsync = async () => {
    if (Platform.OS === "ios") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("We need camera roll permissions to make this work!");
      }
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

  // Toggle the camera facing
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // Take a picture with the camera
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setImage(photo.uri);
        console.log("Image taken:", photo.uri);
      } else {
        console.log("Failed to take picture");
      }
      setCameraOpen(false);
    } else {
      console.log("Camera not ready");
    }
  };

  // Classify the image
  const classifyImage = async () => {
    try {
      if (!isTfReady || !isModelReady || !image || !model) {
        return;
      }
      setPredictionLoading(true);
      setPredictions([]); // Clear previous predictions

      // Get the raw image data
      const response = await fetch(image);
      const rawImageData = await response.arrayBuffer();
      const imageTensor = tf.tidy(() => imageToTensor(rawImageData));

      // Make a prediction through the model on our image
      const predictions = await model.classify(imageTensor);
      if (predictions && predictions.length > 0) {
        console.log("Predictions:", predictions);
        setPredictions(predictions);
      } else {
        console.log("No predictions available");
      }

      // Dispose the tensor to free up GPU memory
      imageTensor.dispose();
    } catch (error) {
      console.log(error);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Helper function to convert an image to a tensor
  const imageToTensor = (rawImageData: ArrayBuffer) => {
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, {
      useTArray: TO_UINT8ARRAY,
    });

    // Drop the alpha channel info
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0;
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  };

  // Helper function to render a prediction
  const renderPrediction = (prediction: {
    className: string;
    probability: number;
  }) => {
    if (!prediction) {
      return null;
    }
    return (
      <Text key={prediction.className} className="text-white text-lg">
        {prediction.className} ({(prediction.probability * 100).toFixed(2)}%)
      </Text>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-800 items-center justify-center ">
      <StatusBar barStyle="light-content" />
      <View className="flex justify-center items-center m-4">
        {show && !cameraOpen && isTfReady && isModelReady && (
          <View className="flex flex-row justify-center items-center">
            <Text className="text-white text-xl m-2">You're all set</Text>
            <Image
              source={require("../../assets/images/handOkEmoji.png")}
              className="w-10 h-10"
            />
          </View>
        )}

        {!show && !cameraOpen && isTfReady && isModelReady ? (
          <View className="flex justify-center items-center">
            <View className="m-4 flex justify-center items-center">
              <Text className="text-white text-lg">You can</Text>
              <TouchableOpacity
                onPress={selectImage}
                className="p-2 m-2 bg-white rounded-xl"
              >
                <Entypo name="upload" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-white text-lg">Or</Text>
              <TouchableOpacity
                onPress={openCamera}
                className="p-2 m-2 bg-white rounded-xl"
              >
                <Entypo name="video-camera" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-white text-lg">
                And scan what's in your fridge or pantry
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex flex-row justify-center items-center">
            <Text className="text-white text-xl m-2">
              Preparing AI detection
            </Text>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      {image && !cameraOpen && (
        <TouchableOpacity
          className="w-72 h-72 p-2 border-4 border-dashed border-red-500 relative justify-center items-center"
          onPress={isModelReady ? selectImage : undefined}
        >
          <Image
            source={{ uri: image }}
            className="w-64 h-64 absolute justify-center items-center"
          />
          {isModelReady && !image && (
            <Text className="text-lg text-white">Tap to choose image</Text>
          )}
        </TouchableOpacity>
      )}
      <View className="flex justify-center items-center m-4">
        {isModelReady && image && !cameraOpen && (
          <Text className="text-white text-lg">
            Predictions:{" "}
            {isPredictionLoading ? (
              <ActivityIndicator size="small" color="#00ff00" />
            ) : (
              ""
            )}
          </Text>
        )}
        {isModelReady &&
          !cameraOpen &&
          predictions &&
          renderPrediction(predictions[0])}
      </View>
      {cameraOpen && (
        <CameraView ref={cameraRef} facing={facing} className="flex-1 w-full">
          <View className="absolute bottom-0 left-0 right-0 flex flex-row justify-between p-4">
            <TouchableOpacity onPress={takePicture}>
              <Text className="text-white text-lg">Take Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing}>
              <Text className="text-white text-lg">Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCameraOpen(false)}>
              <Text className="text-white text-lg">Close Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </SafeAreaView>
  );
}
