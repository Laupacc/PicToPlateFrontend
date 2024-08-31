import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BACKEND_URL } from "@/_recipeUtils";
import { useNavigation } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const SpeechToText = ({ targetScreen }: { targetScreen: string }) => {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [transcription, setTranscription] = useState<string>("");

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
        // navigation.navigate(targetScreen, { transcription: "" });
      } else {
        console.log("Transcription:", data);
        transcription = data || "";
      }
      setTranscription(transcription);
      navigation.navigate(targetScreen, { transcription });
    } catch (error) {
      console.error("Error sending recording to Watson:", error);
      setTranscription("");
      navigation.navigate(targetScreen);
    }
  };

  // const [transcription, setTranscription] = useState("");

  // // Function to request microphone permission
  // const getPermissions = async () => {
  //   try {
  //     const { status } = await Audio.requestPermissionsAsync();
  //     if (status !== "granted") {
  //       Alert.alert(
  //         "Permission Required",
  //         "Permission to access microphone is required for speech recognition."
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error requesting microphone permission:", error);
  //     Alert.alert(
  //       "Error",
  //       "There was an error requesting microphone permission."
  //     );
  //   }
  // };

  // // Use effect to request permission on component mount
  // useEffect(() => {
  //   getPermissions();
  // }, []);

  // const handleWebViewMessage = (event) => {
  //   console.log("Message from WebView:", event.nativeEvent.data);
  //   setTranscription(event.nativeEvent.data);
  // };

  //   const htmlContent = `
  //   <!DOCTYPE html>
  //   <html>
  //     <body>
  //       <h1>Speech to Text</h1>
  //       <button onclick="startRecognition()">Start Recognition</button>
  //       <p id="result"></p>
  //       <script>
  //         console.log("Script loaded");
  //         var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  //         recognition.interimResults = true;
  //         recognition.lang = 'en-US';

  //         recognition.onresult = function(event) {
  //           console.log("Recognition result event");
  //           var transcript = '';
  //           for (var i = event.resultIndex; i < event.results.length; ++i) {
  //             transcript += event.results[i][0].transcript;
  //           }
  //           document.getElementById('result').innerText = transcript;
  //           window.ReactNativeWebView.postMessage(transcript);
  //         };

  //         recognition.onerror = function(event) {
  //           console.error("Recognition error:", event.error);
  //         };

  //         function startRecognition() {
  //           console.log("Start recognition button clicked");
  //           recognition.start();
  //         }
  //       </script>
  //     </body>
  //   </html>
  // `;

  // <View style={{ flex: 1 }}>
  //   <WebView
  //     originWhitelist={["*"]}
  //     source={{ html: htmlContent }}
  //     onMessage={handleWebViewMessage}
  //     style={{
  //       width: 100,
  //       height: 100,
  //       backgroundColor: "transparent",
  //     }}
  //   />
  //   <Text>{transcription}</Text>
  // </View>

  return (
    <View
      className="flex-row items-center justify-center"
      style={styles.shadow}
    >
      <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
        <Image
          source={require("@/assets/images/microphoneOn.png")}
          className="w-10 h-10"
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
