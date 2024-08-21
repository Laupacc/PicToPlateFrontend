import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import { useDispatch, useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import Background from "@/components/Background";
import {
  BACKEND_URL,
  addRecipeToFavourites,
  removeRecipeFromFavourites,
  goToRecipeCard,
} from "@/_recipeUtils";
import { RootState } from "@/store/store";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
} from "@/store/recipes";

export default function recipesFromFridge() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const toast = useToast();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.value);
  const favourites = useSelector(
    (state: RootState) => state.recipes.favourites
  );
  const { searchQuery } = route.params as { searchQuery: string };

  const isInitialMount = useRef<boolean>(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [numberOfRecipes, setNumberOfRecipes] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [isFavourite, setIsFavourite] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [userFavourites, setUserFavourites] = useState<any[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [individualSearchMode, setIndividualSearchMode] =
    useState<boolean>(false);
  const [exhaustedIngredients, setExhaustedIngredients] = useState<Set<string>>(
    new Set()
  );

  // Fetch favourite recipes from user
  useEffect(() => {
    const fetchFavourites = async () => {
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
        setUserFavourites(data.favourites);
        setIsFavourite(
          data.favourites.reduce((acc: any, fav: any) => {
            acc[fav.id] = true;
            return acc;
          }, {})
        );
      }
    };
    fetchFavourites();
  }, [user.token, favourites]);

  // Search for recipes from kitchen ingredients
  useEffect(() => {
    const searchRecipesFromFridge = async (individualSearchMode = false) => {
      if (!searchQuery) {
        return;
      }

      // Clear previous search results
      setRecipes([]);
      setExhaustedIngredients(new Set());
      setIndividualSearchMode(false);

      if (isInitialMount.current || offset === 0) {
        setLoading(true);
      }

      // Function to fetch recipes
      const fetchRecipes = async (
        ingredients: string,
        number: number,
        offset = 0
      ) => {
        const response = await fetch(
          `${BACKEND_URL}/recipes/complexSearchByIngredients?ingredients=${ingredients}&number=${number}&offset=${offset}`
        );
        console.log(response.url);

        if (!response.ok) {
          throw new Error("Failed to search recipes");
        }
        const data = await response.json();
        return data;
      };

      try {
        const search = searchQuery
          .toLowerCase()
          .replace(/\band\b/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .join(",");

        let results: any[] = [];
        let totalResults = 0;

        // Fetch recipes with combined ingredients
        if (!individualSearchMode) {
          let data = await fetchRecipes(search, numberOfRecipes, offset);
          results = data.results;
          totalResults = data.totalResults;
          console.log("Search results for combined search:", totalResults);

          // If no results found, try searching each ingredient individually
          if (results.length === 0) {
            console.log(
              "No results found for combined search. Trying individual searches..."
            );
            individualSearchMode = true;
            setIndividualSearchMode(true);
          }
        }

        // Fetch recipes with individual ingredients
        if (individualSearchMode) {
          const individualSearches = search.split(",");
          results = [];
          totalResults = 0;
          for (const ingredient of individualSearches) {
            // Skip exhausted ingredients
            if (exhaustedIngredients.has(ingredient)) {
              continue;
            }
            const individualResults = await fetchRecipes(
              ingredient,
              numberOfRecipes,
              offset
            );
            console.log(
              `Search results for ${ingredient}:`,
              individualResults.totalResults
            );

            // If no results found for an ingredient, add it to the exhausted list
            if (individualResults.results.length === 0) {
              exhaustedIngredients.add(ingredient);
              toast.show(`No more results for ${ingredient}`, {
                type: "info",
                placement: "center",
                duration: 1000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: (
                  <Ionicons name="information-circle" size={24} color="white" />
                ),
              });
            } else {
              // Combine results from individual searches
              results = results.concat(individualResults.results);
              totalResults += individualResults.totalResults;
            }
          }
          setExhaustedIngredients(new Set(exhaustedIngredients)); // Update state
        }

        // Check if the recipes are in the user favourites
        if (userFavourites.length > 0 && results.length > 0) {
          const recipeIds = userFavourites.map((fav) => fav.id);
          results = results.map((recipe) => {
            const recipeIdString = String(recipe.id);
            if (recipeIds.includes(recipeIdString)) {
              setIsFavourite((prev) => ({ ...prev, [recipe.id]: true }));
            }
            return recipe;
          });
        }
        // Update the recipes state
        if (offset === 0) {
          setRecipes(results);
        } else {
          setRecipes((prevRecipes) => [...prevRecipes, ...results]);
        }

        // Determine if there are more results to load
        if (totalResults && totalResults > numberOfRecipes + offset) {
          setHasMoreResults(true);
        } else {
          setHasMoreResults(false);
        }

        if (isInitialMount.current || offset === 0) {
          setLoading(false);
          isInitialMount.current = false;
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
        toast.show("Error fetching recipes", {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });

        if (isInitialMount.current || offset === 0) {
          setLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    console.log("Effect triggered");

    searchRecipesFromFridge();
  }, [searchQuery, numberOfRecipes, offset]);

  const loadMoreRecipes = () => {
    setOffset((prevOffset) => prevOffset + numberOfRecipes);
  };

  // Add recipe to favourites list
  const handleAddToFavourites = async (recipeId: number) => {
    await addRecipeToFavourites(recipeId, user, toast, true);
    dispatch(addToFavouriteRecipes(recipeId));
    setIsFavourite((prev) => ({ ...prev, [recipeId]: true }));
  };

  // Remove recipe from favourites list
  const handleRemoveFromFavourites = async (recipeId: number) => {
    await removeRecipeFromFavourites(recipeId, user, toast);
    dispatch(removeFromFavouriteRecipes(recipeId));
    setIsFavourite((prev) => ({ ...prev, [recipeId]: false }));
  };

  // Go to recipe card
  const handleGoToRecipeCard = async (recipeId: number) => {
    const fromScreen = "recipesFromFridge";
    await goToRecipeCard(recipeId, navigation, fromScreen);
  };

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

      {loading ? (
        <ActivityIndicator size="large" color="#237CB0" className="flex-1" />
      ) : (
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
                          ? handleRemoveFromFavourites(recipe.id)
                          : handleAddToFavourites(recipe.id);
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
                        onPress={() => handleGoToRecipeCard(recipe.id)}
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
              {hasMoreResults && (
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
              )}
            </ScrollView>
          )}
        </View>
      )}
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
