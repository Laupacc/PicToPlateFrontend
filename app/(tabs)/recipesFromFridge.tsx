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
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "@/components/Background";
import { useDispatch, useSelector } from "react-redux";
import { addToFavouriteRecipes } from "@/store/recipes";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function recipesFromFridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const { searchQuery } = route.params as { searchQuery: string };
  const [recipes, setRecipes] = useState([]);
  const [isFavourite, setIsFavourite] = useState(false);

  const BACKEND_URL = "http://192.168.1.34:3000";

  const cachedRecipes = useRef<any[]>([]);

  useEffect(() => {
    const searchRecipesFromFridge = async () => {
      try {
        // if (cachedRecipes.current.length > 0) {
        //   setRecipes(cachedRecipes.current);
        //   return;
        // }

        const search = searchQuery
          .toLowerCase()
          .replace(/\band\b/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .join(",");

        const response = await fetch(
          `${BACKEND_URL}/recipes/complexSearchByIngredients?ingredients=${search}`
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

  const addRecipeToFavourites = async (recipeId) => {
    try {
      const token = user.token;
      const response = await fetch(
        `${BACKEND_URL}/users/addFavourite/${recipeId}/${token}`,
        { method: "POST" }
      );

      if (!response.ok) {
        console.log("Error adding recipe to favourites");
      }

      dispatch(addToFavouriteRecipes(recipes));
      setIsFavourite(true);
      console.log("Recipe added to favourites:", recipes.id);
      alert("Recipe added to favourites");
    } catch (error) {
      console.error(error);
    }
  };

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
      <TouchableOpacity onPress={() => navigation.navigate("fridge")}>
        <Text>Go Back</Text>
      </TouchableOpacity>

      <ScrollView className="flex-1">
        {recipes &&
          recipes.map((recipe) => (
            <View
              className="flex-1 items-center justify-center relative rounded-2xl w-[360] h-[460]"
              key={recipe.id}
            >
              <Image
                source={require("../../assets/images/recipeBack/recipeBack4.png")}
                className="absolute inset-0 w-full h-full"
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
              />

              <TouchableOpacity
                className="absolute top-20 right-5"
                onPress={() => addRecipeToFavourites(recipe.id)}
              >
                <Ionicons
                  name={isFavourite ? "heart" : "heart-outline"}
                  size={30}
                  color="red"
                />
              </TouchableOpacity>

              <View className="flex items-center justify-center">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("recipeCard", { recipeId: recipe.id })
                  }
                  key={recipe.id}
                  className="flex items-center justify-center"
                >
                  <Image
                    source={{ uri: recipe.image }}
                    className="rounded-xl w-[200] h-[200] right-4"
                  />

                  <View className="flex items-center justify-center max-w-[200] mt-4">
                    <Text
                      style={{
                        fontFamily: "Flux",
                        textAlign: "center",
                        fontSize: 15,
                      }}
                    >
                      {recipe.title}
                    </Text>
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
