import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useNavigation } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BACKEND_URL } from "@/_recipeUtils";

const SpeechToText = ({ targetScreen }: { targetScreen: string }) => {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [transcription, setTranscription] = useState<string>("");

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

  // Function to start recording audio
  const startRecording = async () => {
    try {
      if (permissionResponse && permissionResponse.status !== "granted") {
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".wav",
          // @ts-ignore
          outputFormat: Audio.RECORDING_OPTION_OUTPUT_FORMAT_PCM,
          // @ts-ignore
          audioEncoder: Audio.RECORDING_OPTION_AUDIO_ENCODER_PCM,
          sampleRate: 16000,
        },
        // @ts-ignore
        ios: {
          extension: ".wav",
          // @ts-ignore
          audioQuality: Audio.IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
        },
      });

      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  // Function to stop recording and send to Watson
  const stopRecording = async () => {
    console.log("Stopping recording");
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      if (uri) {
        await sendRecordingToWatson(uri, targetScreen);
      }
    }
    setRecording(undefined);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  };

  // Function to send recording to Watson for transcription
  const sendRecordingToWatson = async (uri: string, targetScreen: string) => {
    try {
      // Read file from URI and convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${BACKEND_URL}/transcribeAudio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audioBase64: base64 }),
      });

      const data = await response.json();

      let transcription = "";

      if (data.error) {
        console.log("Error from Watson: no transcription results found");
        transcription = "No transcription results found";
      } else {
        transcription = data;
        console.log("Transcription:", data);
      }
      if (
        transcription === "No transcription results found" ||
        transcription.startsWith("%HESITATION")
      ) {
        toast.show("No transcription found", {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
      }

      setTranscription(transcription);
      navigation.navigate(targetScreen, { transcription });
    } catch (error) {
      console.log("Error sending recording to Watson:", error);
    }
  };

  return (
    <View
      className="flex-row items-center justify-center"
      style={styles.shadow}
    >
      <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
        <Image
          source={require("@/assets/images/microphoneOn.png")}
          className={isSmallScreen ? "w-9 h-9" : "w-10 h-10"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
});

export default SpeechToText;
