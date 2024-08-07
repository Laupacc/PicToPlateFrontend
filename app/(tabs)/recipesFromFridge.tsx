import { Image, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import React, { useEffect, useState, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "@/components/Background";
import { useDispatch, useSelector } from "react-redux";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
} from "@/store/recipes";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useToast } from "react-native-toast-notifications";

export default function recipesFromFridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const { searchQuery } = route.params as { searchQuery: string };
  const [recipes, setRecipes] = useState([]);
  const [numberOfRecipes, setNumberOfRecipes] = useState(10);
  const [offset, setOffset] = useState(0);
  const [isFavourite, setIsFavourite] = useState({});
  const [userInfo, setUserInfo] = useState({});

  const BACKEND_URL = "http://192.168.1.34:3000";

  // Search for recipes from kitchen ingredients
  useEffect(() => {
    const searchRecipesFromFridge = async () => {
      try {
        const search = searchQuery
          .toLowerCase()
          .replace(/\band\b/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .join(",");

        const fetchRecipes = async (ingredients, number, offset = 0) => {
          const response = await fetch(
            `${BACKEND_URL}/recipes/complexSearchByIngredients?ingredients=${ingredients}&number=${number}&offset=${offset}`
          );
          console.log("Search response:", response);
          if (!response.ok) {
            throw new Error("Failed to search recipes");
          }
          const data = await response.json();
          console.log("Search results:", data);
          return data.results;
        };

        let results = await fetchRecipes(search, numberOfRecipes, offset);

        if (results.length === 0) {
          const individualSearches = search.split(",");
          results = [];
          for (const ingredient of individualSearches) {
            const individualResults = await fetchRecipes(
              ingredient,
              numberOfRecipes,
              offset
            );
            results = results.concat(individualResults);
          }
        }

        // If offset is 0, replace the recipes, otherwise append to the existing ones
        if (offset === 0) {
          setRecipes(results);
        } else {
          setRecipes((prevRecipes) => [...prevRecipes, ...results]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    searchRecipesFromFridge();
  }, [searchQuery, numberOfRecipes, offset]);

  const loadMoreRecipes = () => {
    setOffset((prevOffset) => prevOffset + 10);
  };

  // Add recipe to favourites list
  const addRecipeToFavourites = async (recipeId) => {
    try {
      const token = user.token;
      const response = await fetch(
        `${BACKEND_URL}/users/addFavourite/${recipeId}/${token}`,
        { method: "POST" }
      );

      if (!response.ok) {
        console.log("Error adding recipe to favourites");
        toast.show("Error adding recipe to favourites", {
          type: "warning",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
      }

      const data = await response.json();
      console.log(data);
      console.log("Recipe added to favourites:", recipes);
      dispatch(addToFavouriteRecipes(recipeId));
      setIsFavourite((prev) => ({ ...prev, [recipeId]: true }));

      toast.show("Recipe added to favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error("Error adding recipe to favourites:", error.message);
    }
  };

  // Remove recipe from favourites list
  const removeRecipeFromFavourites = async (recipeId) => {
    try {
      const token = user.token;
      const response = await fetch(
        `${BACKEND_URL}/users/removeFavourite/${recipeId}/${token}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        toast.show("Error removing recipe from favourites", {
          type: "warning",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
        console.log("Error removing recipe from favourites");
      }

      const data = await response.json();
      console.log(data);
      dispatch(removeFromFavouriteRecipes(recipeId));
      setIsFavourite((prev) => ({ ...prev, [recipeId]: false }));

      toast.show("Recipe removed from favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error("Error removing recipe from favourites:", error.message);
    }
  };

  // fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      if (user.token) {
        const response = await fetch(
          `${BACKEND_URL}/users/userInformation/${user.token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const data = await response.json();
        setUserInfo(data);
      }
    };
    fetchUser();
  }, [user.token]);

  // update favourites state
  useEffect(() => {
    if (userInfo.favourites) {
      const favourites = userInfo.favourites;
      const favouritesObj = {};
      for (const id of favourites) {
        favouritesObj[id] = true;
      }
      setIsFavourite(favouritesObj);
    }
  }, [userInfo.favourites]);
  
  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <Background cellSize={25} />

      {/* Arrow to go back to fridge and title */}
      <View className="flex flex-row justify-center items-center">
        <TouchableOpacity onPress={() => navigation.navigate("fridge")}>
          <Image
            source={require("../../assets/images/yellowArrow.png")}
            className="w-10 h-10"
          />
        </TouchableOpacity>
        <Text className="text-center font-Flux text-[24px] m-5">
          Recipes From my ingredients
        </Text>
      </View>

      <View className="flex flex-1 items-center justify-center">
        {recipes.length === 0 ? (
          <View className="flex items-center justify-center relative rounded-2xl w-[360] h-[460]">
            <Image
              source={require("../../assets/images/recipeBack/recipeBack4.png")}
              className="absolute inset-0 w-full h-full"
              style={styles.shadow}
            />
            <View className="flex items-center justify-center max-w-[180]">
              <Text className="font-CreamyCookies text-center text-3xl">
                No recipes found with these ingredients
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView>
            {recipes &&
              recipes.map((recipe) => (
                <View
                  className="flex-1 items-center justify-center relative rounded-2xl w-[360] h-[460]"
                  key={recipe.id}
                >
                  <Image
                    source={require("../../assets/images/recipeBack/recipeBack4.png")}
                    className="absolute inset-0 w-full h-full"
                    style={styles.shadow}
                  />
                  <TouchableOpacity
                    className="absolute top-20 right-4"
                    onPress={() => {
                      isFavourite[recipe.id]
                        ? removeRecipeFromFavourites(recipe.id)
                        : addRecipeToFavourites(recipe.id);
                    }}
                  >
                    <Image
                      source={
                        isFavourite[recipe.id]
                          ? require("../../assets/images/heart4.png")
                          : require("../../assets/images/heart5.png")
                      }
                      className="w-8 h-8"
                    />
                  </TouchableOpacity>
                  <View className="flex items-center justify-center">
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("recipeCard", {
                          recipeId: recipe.id,
                        })
                      }
                      key={recipe.id}
                      className="flex items-center justify-center"
                    >
                      <Image
                        source={
                          recipe.image
                            ? { uri: recipe.image }
                            : require("../../assets/images/picMissing.png")
                        }
                        className="rounded-xl w-[200] h-[200] right-4"
                      />
                      <View className="flex items-center justify-center max-w-[200] mt-4">
                        <Text className="text-center font-Flux text-[15px]">
                          {recipe.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            <View className="flex justify-center items-center mb-4">
              <TouchableOpacity
                onPress={loadMoreRecipes}
                className="relative flex justify-center items-center"
              >
                <Image
                  source={require("@/assets/images/button/button9.png")}
                  alt="button"
                  className="w-40 h-12"
                />
                <Text
                  className="text-lg text-white absolute font-Nobile"
                  style={styles.shadow}
                >
                  Load more
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
});
