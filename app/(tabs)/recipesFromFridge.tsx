import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "@/components/Background";
import { useRoute } from "@react-navigation/native";
import { randomStickerImage } from "@/apiFunctions";

export default function recipesFromFridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchQuery } = route.params as { searchQuery: string };
  const [recipes, setRecipes] = useState([]);
  const BACKEND_URL = "http://192.168.1.34:3000";

  const cachedRecipes = useRef<any[]>([]);

  useEffect(() => {
    const searchRecipesFromFridge = async () => {
      try {
        if (cachedRecipes.current.length > 0) {
          setRecipes(cachedRecipes.current);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/recipes/complexSearchByIngredients?ingredients=${searchQuery}`
        );
        console.log("Search response:", response);
        if (!response.ok) {
          throw new Error("Failed to search recipes");
        }
        const data = await response.json();
        console.log("Search results:", data);
        setRecipes(data.results);
        cachedRecipes.current = data.results;
      } catch (error) {
        console.error(error);
      }
    };
    searchRecipesFromFridge();
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <Background cellSize={25} />
      <Text
        style={{
          fontFamily: "Flux",
          fontSize: 24,
          textAlign: "center",
          margin: 20,
        }}
      >
        Recipes From my ingredients
      </Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Go Back</Text>
      </TouchableOpacity>

      <ScrollView className="flex-1">
        {recipes &&
          recipes.map((recipe) => (
            <View
              className="flex-1 items-center justify-center relative"
              key={recipe.id}
            >
              <View
                className="absolute bg-[#FF9B50] rounded-2xl right-0.5 bottom-0.5 w-[280] h-[280]"
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 6,
                    height: 6,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 8,
                }}
              ></View>

              <View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("recipeCard", { recipeId: recipe.id })
                  }
                  key={recipe.id}
                  className="bg-white p-4 w-[280] h-[280] m-4 items-center justify-center rounded-br-full rounded-tr-full"
                >
                  <Image
                    source={{ uri: recipe.image }}
                    className="rounded-full w-[200] h-[200]"
                  />

                  <View className="relative w-[280] h-[70] mt-2">
                    <Image
                      source={randomStickerImage()}
                      className="absolute inset-0 w-[280] h-[70] top-0 right-0"
                    />
                    <View className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
                      <Text
                        style={{
                          fontFamily: "Flux",
                          textAlignVertical: "center",
                        }}
                        className="text-center"
                      >
                        {recipe.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
