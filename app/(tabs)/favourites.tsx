import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Background from "@/components/Background";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecipeInformation, randomStickerImage } from "@/apiFunctions";
import { useRoute } from "@react-navigation/native";
import {
  removeFromFavouriteRecipes,
  updateFavouriteRecipes,
} from "@/store/recipes";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";

export default function Favourites() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const user = useSelector((state) => state.user.value);
  const favourites = useSelector((state) => state.recipes.favourites);

  const [favouriteRecipes, setFavouriteRecipes] = useState([]);

  const BACKEND_URL = "http://192.168.201.158:3000";

  const cachedFavorites = useRef<any[]>([]);
  useEffect(() => {
    const fetchFavouriteRecipes = async () => {
      try {
        // Check if favorites are already cached
        // if (cachedFavorites.current.length > 0) {
        //   setFavouriteRecipes(cachedFavorites.current);
        //   return;
        // }

        const response = await fetch(
          `${BACKEND_URL}/users/fetchFavourites/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch favourite recipes");
        }
        const data = await response.json();

        const recipes = await Promise.all(
          data.favourites.map((recipeId) => fetchRecipeInformation(recipeId))
        );
        console.log("Favourite recipes:", recipes.length);

        dispatch(updateFavouriteRecipes(recipes));
        setFavouriteRecipes(recipes);

        cachedFavorites.current = recipes;
      } catch (error) {
        console.error(error);
      }
    };

    fetchFavouriteRecipes();
  }, [user.token, favourites.length]);

  const removeRecipeFromFavourites = async (recipeId) => {
    try {
      const token = user.token;
      const response = await fetch(
        `${BACKEND_URL}/users/removeFavourite/${recipeId}/${token}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        console.log("Error removing recipe from favourites");
      }

      dispatch(removeFromFavouriteRecipes(recipeId));
      setFavouriteRecipes(favouriteRecipes.filter((r) => r.id !== recipeId));
      console.log("Recipe removed from favourites:", recipeId);
      alert("Recipe removed from favourites");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <Background cellSize={25} />
      <StatusBar barStyle="dark-content" />

      <View
        className="flex justify-center items-center relative m-2 w-[330] h-[60]"
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 4,
            height: 4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 15,
        }}
      >
        <Image
          source={require("../../assets/images/stickers/redTape.png")}
          className="absolute inset-0 w-full h-full"
        />
        <Text
          style={{
            fontFamily: "Flux",
            fontSize: 20,
            textAlign: "center",
          }}
        >
          My favourite recipes
        </Text>
      </View>

      <ScrollView className="flex-1">
        {favouriteRecipes &&
          favouriteRecipes.map((recipe) => (
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
                onPress={() => removeRecipeFromFavourites(recipe.id)}
              >
                <Entypo name="trash" size={28} color="gray" />
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
