import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as jpeg from "jpeg-js";
import * as ImagePicker from "expo-image-picker";

export default function Camera() {
  // State variables
  const [isTfReady, setTfReady] = useState(false);
  const [isModelReady, setModelReady] = useState(false);
  const [predictions, setPredictions] = useState<
    { className: string; probability: number }[]
  >([]);
  const [image, setImage] = useState("");
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);

  // Load the TensorFlow.js model and request camera roll permissions
  useEffect(() => {
    const prepareModel = async () => {
      try {
        // Ensure that the TensorFlow.js environment is properly initialized
        await tf.ready();
        setTfReady(true);
        console.log("TensorFlow.js ready.");

        // Load mobilenet model
        const loadedModel = await mobilenet.load();
        console.log("Model loaded.");
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
      let result = await ImagePicker.launchImageLibraryAsync({
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

  // Classify the image
  const classifyImage = async () => {
    try {
      if (!isTfReady || !isModelReady || !image || !model) {
        return;
      }

      // Get the raw image data
      const response = await fetch(image);
      const rawImageData = await response.arrayBuffer();
      const imageTensor = imageToTensor(rawImageData);

      // Make a prediction through the model on our image
      const predictions = await model.classify(imageTensor);
      if (predictions && predictions.length > 0) {
        console.log("Predictions:", predictions);
        setPredictions(predictions);
      } else {
        console.log("No predictions available");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Request permission to access the camera roll
  const getPermissionAsync = async () => {
    if (Platform.OS === "ios") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    }
  };

  // Helper function to convert an image to a tensor
  const imageToTensor = (rawImageData: ArrayBuffer) => {
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, {
      useTArray: TO_UINT8ARRAY,
    });

    // Drop the alpha channel info for mobilenet
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
      <Text key={prediction.className} style={styles.text}>
        {prediction.className} ({(prediction.probability * 100).toFixed(2)}%)
      </Text>
    );
  };

  // Main effect to run the classification
  useEffect(() => {
    classifyImage();
  }, [isTfReady, isModelReady, image]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingContainer}>
        <Text style={styles.text}>
          TFJS ready? {isTfReady ? <Text>✅</Text> : ""}
        </Text>

        <View style={styles.loadingModelContainer}>
          <Text style={styles.text}>Model ready? </Text>
          {isModelReady ? (
            <Text style={styles.text}>✅</Text>
          ) : (
            <ActivityIndicator size="small" />
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={isModelReady ? selectImage : undefined}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.imageContainer} />
        ) : (
          <Text style={styles.transparentText}>No image selected</Text>
        )}

        {isModelReady && !image && (
          <Text style={styles.transparentText}>Tap to choose image</Text>
        )}
      </TouchableOpacity>
      <View style={styles.predictionWrapper}>
        {isModelReady && image && (
          <Text style={styles.text}>
            Predictions:{" "}
            {predictions ? (
              ""
            ) : (
              <ActivityIndicator size="large" color="#00ff00" />
            )}
          </Text>
        )}
        {isModelReady && predictions && renderPrediction(predictions[0])}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171f24",
    alignItems: "center",
  },
  loadingContainer: {
    marginTop: 80,
    justifyContent: "center",
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
  },
  loadingModelContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: "#cf667f",
    borderWidth: 5,
    borderStyle: "dashed",
    marginTop: 40,
    marginBottom: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: "absolute",
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  predictionWrapper: {
    height: 100,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  transparentText: {
    color: "#ffffff",
    opacity: 0.7,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
});
