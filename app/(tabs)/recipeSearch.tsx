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
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

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
    setRandomRecipe(recipe); // Update state, but don't rely on it for immediate navigation
    navigation.navigate("insideRecipe", { recipe });
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <StatusBar barStyle="dark-content" />
      <Text className="text-cyan-800">Recipe Search</Text>
      <Link href="/recipeResults">Recipe Results</Link>
      <Link href="/insideRecipe">Inside Recipe</Link>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Go Back</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={fetchTrivia}>
        <Text>Fetch Trivia</Text>
      </TouchableOpacity>
      <Text className="items-center justify-center">{trivia}</Text>

      <TouchableOpacity onPress={fetchJoke}>
        <Text>Fetch Joke</Text>
      </TouchableOpacity>
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

      <TouchableOpacity onPress={fetchRandomRecipe}>
        <Text>Fetch Random Recipe</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
