import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function RecipeSearch() {
  const navigation = useNavigation();
  const [trivia, setTrivia] = useState("");
  const [joke, setJoke] = useState("");
  const [randomRecipe, setRandomRecipe] = useState<any[]>([]);

  const fetchTrivia = async () => {
    const response = await fetch(`http://192.168.1.34:3000/recipes/trivia`);
    const data = await response.json();
    console.log(data);
    setTrivia(data.text);
  };

  const fetchJoke = async () => {
    const response = await fetch(`http://192.168.1.34:3000/recipes/joke`);
    const data = await response.json();
    console.log(data);
    setJoke(data.text);
  };

  const fetchRandomRecipe = async () => {
    const response = await fetch(
      `http://192.168.1.34:3000/recipes/randomRecipe`
    );
    const data = await response.json();
    console.log(data);
    const recipe = data.recipes[0];
    setRandomRecipe(recipe);
    navigation.navigate("insideRecipe", { recipe });
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-sharp" size={30} />
      </TouchableOpacity>

      <Text className="text-cyan-800">Recipe Search</Text>

      <TouchableOpacity onPress={fetchTrivia}>
        <Text>Fetch Trivia</Text>
      </TouchableOpacity>
      <Text className="items-center justify-center">{trivia}</Text>

      <TouchableOpacity onPress={fetchJoke}>
        <Text>Fetch Joke</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={fetchRandomRecipe}>
        <Text>Fetch Random Recipe</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TextInput
          placeholder="Search for a recipe"
          className="border-2 border-gray-300 rounded-lg p-2 w-64"
        />
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={joke !== ""}
        onRequestClose={() => {
          setJoke("");
        }}
      >
        <ScrollView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <View className="bg-white p-4 rounded-lg">
              <Text>{joke}</Text>
              <TouchableOpacity onPress={() => setJoke("")}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}
