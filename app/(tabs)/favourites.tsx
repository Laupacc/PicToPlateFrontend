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
import { updateFavouriteRecipes } from "@/store/user";

export default function Favourites() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const user = useSelector((state) => state.user.value);

  const [favourites, setFavourites] = useState([]);

  const BACKEND_URL = "http://192.168.1.34:3000";

  const cachedFavorites = useRef<any[]>([]);
  useEffect(() => {
    const fetchFavouriteRecipes = async () => {
      try {
        // Check if favorites are already cached
        if (cachedFavorites.current.length > 0) {
          setFavourites(cachedFavorites.current);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/users/fetchFavourites/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch favourite recipes");
        }
        const data = await response.json();
        console.log("Favourite recipes:", data.favourites);

        const recipes = await Promise.all(
          data.favourites.map((recipeId) => fetchRecipeInformation(recipeId))
        );
        console.log("Favourite recipes:", recipes);

        setFavourites(recipes);
        // dispatch(updateFavouriteRecipes(recipes));
        cachedFavorites.current = recipes;
      } catch (error) {
        console.error(error);
      }
    };

    fetchFavouriteRecipes();
  }, [user.token]);

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Background cellSize={25} />
      <StatusBar barStyle="dark-content" />

      <Text
        style={{
          fontFamily: "Flux",
          fontSize: 24,
          textAlign: "center",
          margin: 20,
        }}
      >
        My saved recipes
      </Text>

      <ScrollView className="flex-1">
        {favourites &&
          favourites.map((recipe) => (
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

              <View key={recipe.id}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("recipeCard", { recipeId: recipe.id })
                  }
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
