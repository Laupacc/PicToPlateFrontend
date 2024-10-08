import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import { DataTable, Modal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { useNavigation } from "expo-router";
import { useRoute } from "@react-navigation/native";
import wineCategories from "../../_dataSets.json";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import {
  BACKEND_URL,
  fetchRandomRecipe,
  fetchRecipeInformation,
  fetchAnalyzedInstructions,
  addRecipeToFavourites,
  removeRecipeFromFavourites,
} from "@/_recipeUtils";
import { RootState } from "@/store/store";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
} from "@/store/recipes";

export default function RecipeCard() {
  const navigation = useNavigation<any>();
  const toast = useToast();
  const route = useRoute();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.value);

  const { fromScreen } = route.params as { fromScreen: string };
  const { recipeId } = route.params as { recipeId: number };
  const { passedRecipe } = route.params as {
    passedRecipe: { id: number; additionalData: any };
  };

  const [recipe, setRecipe] = useState<any>(null);
  const [servings, setServings] = useState<number>(0);
  const [unitSystem, setUnitSystem] = useState<"metric" | "us">("us");
  const [postitImages, setPostitImages] = useState<any>([]);
  const [dynamicHeight, setDynamicHeight] = useState<number>(0);
  const [dynamicHeightWine, setDynamicHeightWine] = useState<number>(0);
  const [dynamicHeightEquipment, setDynamicHeightEquipment] =
    useState<number>(0);
  const [ingredientSubstitutes, setIngredientSubstitutes] = useState<any>([]);
  const [showWinePairing, setShowWinePairing] = useState<boolean>(false);
  const [activeIngredientId, setActiveIngredientId] = useState<null | string>(
    null
  );
  const [ingredientModalVisible, setIngredientModalVisible] =
    useState<boolean>(false);
  const [selectedIngredientNutrition, setSelectedIngredientNutrition] =
    useState<any>(null);
  const [showNutrition, setShowNutrition] = useState<boolean>(false);
  const [showMacros, setShowMacros] = useState<boolean>(false);
  const [showSubstitutes, setShowSubstitutes] = useState<boolean>(false);
  const [isFavourite, setIsFavourite] = useState<any>({});
  const [userFavourites, setUserFavourites] = useState<any>([]);
  const [favouritesFetched, setFavouritesFetched] = useState<boolean>(false);
  const cachedIngredientSubstitutes = useRef<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const calculatedHeight = screenWidth * (9 / 16);
  const isSmallScreen = screenWidth < 400;

  // Set the status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  // Fetch favourite recipes list from user and add recipe to recently viewed
  useEffect(() => {
    const fetchFavourites = async () => {
      if (user.token) {
        try {
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
          setFavouritesFetched(true);
          console.log("User favourites fetched:", data.favourites.length);
        } catch (error: any) {
          console.error("Error fetching user favourites:", error.message);
          setFavouritesFetched(true);
        }
      }
      if (recipe) {
        await addToRecentlyViewed(recipe);
      }
    };
    fetchFavourites();
  }, [user.token, recipe]);

  // Fetch full recipe data from API or database
  useEffect(() => {
    const fetchRecipeData = async () => {
      setLoading(true);

      try {
        let currentRecipeId = recipeId;
        let recipeData = null;

        // Check if the recipe was passed and exists in the database
        if (passedRecipe) {
          recipeData = passedRecipe.additionalData;
          currentRecipeId = passedRecipe.id;
          setServings(recipeData.servings);
          console.log("Passed recipe");
        } else {
          // Fetch the recipe data from the API if it doesn't exist in the database
          const [fetchedRecipeData, instructions] = await Promise.all([
            fetchRecipeInformation(recipeId),
            fetchAnalyzedInstructions(recipeId),
          ]);

          if (fetchedRecipeData && instructions) {
            recipeData = {
              ...fetchedRecipeData,
              analyzedInstructions: instructions,
            };
            setServings(fetchedRecipeData.servings);
            console.log("New recipe fetched");

            // Add the recipe to the Recipe collection
            await addRecipeToCollection(recipeData);
          }
        }

        if (recipeData) {
          setRecipe(recipeData);
        }

        setLoading(false);
      } catch (error: any) {
        console.log("Error fetching recipe data:", error.message);
      }
    };

    // Function to add the recipe to the Recipe collection
    const addRecipeToCollection = async (recipe: object) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/users/addRecipeToCollection`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipe }),
          }
        );
        const data = await response.json();
        console.log(data.message);
      } catch (error: any) {
        console.log("Error adding recipe to collection:", error.message);
      }
    };

    fetchRecipeData();
  }, [recipeId, passedRecipe]);

  // Check if the recipe is already in the user's favourites list
  useEffect(() => {
    if (favouritesFetched && recipe) {
      const isFavourite = userFavourites.some(
        (fav: { id: string }) => fav.id === String(recipe.id)
      );
      setIsFavourite((prev: any) => ({
        ...prev,
        [recipe.id]: isFavourite,
      }));
      console.log(
        "Checked favourite status for recipe:",
        recipe.id,
        isFavourite
      );
    } else if (!recipe) {
      console.log("No recipe provided for favourite check.");
    }
  }, [favouritesFetched, userFavourites]);

  // Function to add a recipe to the recently viewed list
  const addToRecentlyViewed = async (recipe: { id: any }) => {
    try {
      const recentlyViewed = await AsyncStorage.getItem(
        "recentlyViewedRecipes"
      );
      let updatedViewedRecipes = recentlyViewed
        ? JSON.parse(recentlyViewed)
        : [];

      // Check if the recipe is already in the list, remove it to avoid duplication
      updatedViewedRecipes = updatedViewedRecipes.filter(
        (item: { id: any }) => item.id !== recipe.id
      );

      // Add the new recipe to the beginning of the list
      updatedViewedRecipes.unshift(recipe);

      // Limit the list to the last 10 viewed recipes
      if (updatedViewedRecipes.length > 15) {
        updatedViewedRecipes.pop();
      }

      // Save the updated list back to local storage
      await AsyncStorage.setItem(
        "recentlyViewedRecipes",
        JSON.stringify(updatedViewedRecipes)
      );
      // console.log("Recently viewed recipes updated");
      console.log("Saving recipe:", recipe.id, "to recently viewed");
    } catch (error: any) {
      console.error("Error updating recently viewed recipes:", error.message);
    }
  };

  // Fetch similar recipes
  const fetchSimilarRecipes = async () => {
    const recipeId = recipe.id;
    try {
      if (!recipe) {
        return;
      }
      const response = await fetch(
        `${BACKEND_URL}/recipes/similarRecipes/${recipeId}?number=20`
      );
      console.log(
        "URL:",
        `${BACKEND_URL}/recipes/similarRecipes/${recipeId}?number=20`
      );
      console.log("Fetching similar recipes for recipe ID:", recipeId);
      const data = await response.json();
      navigation.navigate("search", { data });
    } catch (error: any) {
      console.log("Error fetching similar recipes:", error.message);
    }
  };

  // Handle fetching a random recipe
  const handleFetchRandomRecipe = async () => {
    try {
      const randomRecipe = await fetchRandomRecipe();

      // Check if recipe exists in the database
      const response = await fetch(
        `${BACKEND_URL}/users/fetchRecipe/${randomRecipe.id}`
      );
      if (response.status === 404) {
        navigation.navigate("recipeCard", { recipeId: randomRecipe.id });
      } else {
        const existingRecipe = await response.json();

        navigation.navigate("recipeCard", { passedRecipe: existingRecipe });
      }
    } catch (error: any) {
      console.log("Error fetching random recipe:", error.message);
    }
  };

  // Fetch ingredient substitutes
  const fetchIngredientSubstitution = async (id: number) => {
    if (
      cachedIngredientSubstitutes.current &&
      cachedIngredientSubstitutes.current.id === id
    ) {
      setIngredientSubstitutes(cachedIngredientSubstitutes.current.substitutes);
      return;
    }
    try {
      console.log("Fetching substitutes for ingredient ID:", id);
      const response = await fetch(
        `${BACKEND_URL}/recipes/ingredientSubstitutes/${id}`
      );
      const data = await response.json();

      // Check if the response contains substitutes
      if (data.substitutes && data.substitutes.length > 0) {
        setIngredientSubstitutes(data.substitutes);
        cachedIngredientSubstitutes.current = {
          id,
          substitutes: data.substitutes,
        };
        console.log("Ingredient substitutes:", data.substitutes);
      } else {
        setIngredientSubstitutes([]);
        cachedIngredientSubstitutes.current = {
          id,
          substitutes: [],
        };
        console.log("Ingredient substitutes:", data.message);
      }
    } catch (error: any) {
      console.log("Error fetching ingredient substitutes:", error.message);
    }
  };

  // Construct image URL for ingredient
  const constructImageUrl = (imageFileName: string) => {
    return `https://img.spoonacular.com/ingredients_100x100/${imageFileName}`;
  };

  // Construct image URL for main recipe image
  const constructMainImageUrl = (id: number) => {
    return `https://img.spoonacular.com/recipes/${id}-480x360.jpg`;
  };

  const incrementServings = () => {
    setServings(servings + 1);
  };

  const decrementServings = () => {
    if (servings >= 1) {
      setServings(servings - 1);
    }
  };

  // Postit images for steps
  const getRandomPostitImage = () => {
    const images = [
      require("../../assets/images/stickers/postit1.png"),
      require("../../assets/images/stickers/postit2.png"),
      require("../../assets/images/stickers/postit3.png"),
      require("../../assets/images/stickers/postit4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  // Generate post-it images for each step when the component mounts
  useEffect(() => {
    if (
      recipe?.analyzedInstructions &&
      recipe.analyzedInstructions.length > 0
    ) {
      const images = recipe.analyzedInstructions[0].steps.map(() =>
        getRandomPostitImage()
      );
      setPostitImages(images);
    }
  }, [recipe]);

  // Handle back button press
  const handleBackButton = () => {
    const navigationMap: Record<string, string> = {
      favourites: "favourites",
      search: "search",
      recipesFromFridge: "recipesFromFridge",
    };

    if (navigationMap[fromScreen as keyof typeof navigationMap]) {
      navigation.navigate(
        navigationMap[fromScreen as keyof typeof navigationMap],
        { fromScreen }
      );
      console.log(`Navigating back to ${fromScreen}`);
    } else {
      navigation.goBack();
      console.log("Navigating back");
    }
  };

  // Wine images
  const imageForWine = (wine: string) => {
    const wineImages = {
      white_wine: require("../../assets/images/wines/whitewine.png"),
      red_wine: require("../../assets/images/wines/redwine.png"),
      rose_wine: require("../../assets/images/wines/rosewine.png"),
      dessert_wine: require("../../assets/images/wines/dessertwine.png"),
      sparkling_wine: require("../../assets/images/wines/sparklingwine.png"),
      default: require("../../assets/images/wines/defaultwine.png"),
    };
    const category =
      (wineCategories.wineCategories as Record<string, string>)[wine] ||
      "default";
    if (category) {
      return wineImages[category as keyof typeof wineImages];
    } else {
      return wineImages.default;
    }
  };

  // Fetch nutrition data for clicked ingredient
  const handleIngredientClick = (ingredientId: number) => {
    // Find the ingredient in the recipe data
    const ingredient = recipe.extendedIngredients.find(
      (ing: { id: number }) => ing.id === ingredientId
    );
    if (ingredient && recipe.nutrition && recipe.nutrition.ingredients) {
      // Find the nutrition data for the clicked ingredient
      const nutritionInfo = recipe.nutrition.ingredients.find(
        (nutri: { id: number }) => nutri.id === ingredientId
      );
      setSelectedIngredientNutrition(nutritionInfo);
    }
  };

  // Show nutrition modal when nutrition data is available
  useEffect(() => {
    if (selectedIngredientNutrition) {
      setIngredientModalVisible(true);
    }
  }, [selectedIngredientNutrition]);

  // Add recipe to favourites list
  const handleAddToFavourites = async (recipeId: number) => {
    setIsFavourite((prev: any) => ({ ...prev, [recipeId]: true }));
    await addRecipeToFavourites(recipeId, user, toast);

    // Refetch favourites after adding
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
    console.log("User favourites updated:", data.favourites.length);

    dispatch(addToFavouriteRecipes(recipeId));
  };

  // Remove recipe from favourites list
  const handleRemoveFromFavourites = async (recipeId: number) => {
    setIsFavourite((prev: any) => ({ ...prev, [recipeId]: false }));
    await removeRecipeFromFavourites(recipeId, user, toast);

    // Refetch favourites after adding
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
    console.log("User favourites updated:", data.favourites.length);

    dispatch(removeFromFavouriteRecipes(recipeId));
  };

  // Diet images
  const dietImages = {
    "fodmap friendly": require("../../assets/images/diets/fodmap.png"),
    paleo: require("../../assets/images/diets/paleo.png"),
    paleolithic: require("../../assets/images/diets/paleo.png"),
    "whole 30": require("../../assets/images/diets/whole30.png"),
    vegan: require("../../assets/images/diets/vegan.png"),
    vegetarian: require("../../assets/images/diets/vegetarian.png"),
    "gluten free": require("../../assets/images/diets/glutenfree.png"),
    ketogenic: require("../../assets/images/diets/keto.png"),
    "lacto vegetarian": require("../../assets/images/diets/lacto.png"),
    "ovo vegetarian": require("../../assets/images/diets/ovo.png"),
    "lacto ovo vegetarian": require("../../assets/images/diets/lactoOvo.png"),
    "dairy free": require("../../assets/images/diets/dairyfree.png"),
    primal: require("../../assets/images/diets/primal.png"),
    pescatarian: require("../../assets/images/diets/pescatarian.png"),
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-10">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Background cellSize={25} />
      {loading ? (
        <ActivityIndicator size="large" color="#237CB0" className="flex-1" />
      ) : (
        <ScrollView
          contentContainerStyle={{
            width: screenWidth,
          }}
        >
          {recipe && (
            <View className="flex-1 justify-center items-center">
              <View className="relative">
                {/* Recipe Image and purple box behind  */}
                <View className="relative">
                  <View
                    className="absolute bg-[#B5A8FF] rounded-2xl -right-2 -bottom-2 rounded-br-[130px] rounded-tr-[130px]"
                    style={{
                      width: screenWidth,
                      height: calculatedHeight,
                      ...styles.shadow,
                    }}
                  ></View>
                  <View
                    style={{
                      width: Math.min(screenWidth, calculatedHeight),
                      height: Math.min(screenWidth, calculatedHeight),
                      borderRadius: recipe.image ? 120 : 0,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={
                        recipe.image
                          ? { uri: constructMainImageUrl(recipe.id) }
                          : require("../../assets/images/picMissing.png")
                      }
                      className={
                        recipe.image
                          ? "w-full h-full"
                          : "w-44 h-44 top-0 bootom-0 right-0 left-0 m-auto"
                      }
                      onError={() =>
                        setRecipe((prev: any) => ({
                          ...prev,
                          image: null,
                        }))
                      }
                    />
                  </View>
                </View>

                {/* Back Button, Money and Kcal Icons */}
                <View
                  className={
                    isSmallScreen
                      ? "flex justify-center items-center absolute top-4 -left-[70]"
                      : "flex justify-center items-center absolute top-5 -left-[75]"
                  }
                >
                  {/* Back Button */}
                  <View className="" style={styles.shadow}>
                    <TouchableOpacity onPress={() => handleBackButton()}>
                      <Image
                        source={require("../../assets/images/arrows/yellowArrowLeft.png")}
                        className={isSmallScreen ? "w-10 h-8" : "w-12 h-10"}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Money and Kcal Icons */}
                  <View
                    className={
                      isSmallScreen
                        ? "flex justify-center items-center absolute top-[70]"
                        : "flex justify-center items-center absolute top-16"
                    }
                  >
                    <View className="flex justify-center items-center my-1">
                      <Image
                        source={require("../../assets/images/money.png")}
                        className={isSmallScreen ? "w-8 h-8" : "w-10 h-10"}
                      />
                      <Text className="text-md">
                        ${(recipe.pricePerServing / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex justify-center items-center my-1">
                      <Image
                        source={require("../../assets/images/fire.png")}
                        className={isSmallScreen ? "w-8 h-8" : "w-10 h-10"}
                      />
                      <Text className="text-md">
                        {Math.round(recipe.nutrition?.nutrients[0]?.amount)}
                      </Text>
                      <Text className="text-md">kcal</Text>
                    </View>
                  </View>
                </View>

                {/* Favourite Recipe Button */}
                {user.token && (
                  <TouchableOpacity
                    onPress={() => {
                      isFavourite[recipe.id]
                        ? handleRemoveFromFavourites(recipe.id)
                        : handleAddToFavourites(recipe.id);
                    }}
                    className={
                      isSmallScreen
                        ? "absolute top-4 -right-16"
                        : "absolute top-5 -right-[72]"
                    }
                  >
                    {
                      <Image
                        source={
                          isFavourite[recipe.id]
                            ? require("../../assets/images/heartFull.png")
                            : require("../../assets/images/heartEmpty.png")
                        }
                        className={isSmallScreen ? "w-10 h-10" : "w-12 h-12"}
                      />
                    }
                  </TouchableOpacity>
                )}

                {/* Similar Recipe Button */}
                <TouchableOpacity
                  onPress={fetchSimilarRecipes}
                  className={
                    isSmallScreen
                      ? "absolute top-[170] -right-16"
                      : "absolute top-44 -right-[72]"
                  }
                  style={styles.shadow}
                >
                  <Image
                    source={require("../../assets/images/similarRecipe.png")}
                    className={isSmallScreen ? "w-10 h-10" : "w-12 h-12"}
                  />
                </TouchableOpacity>

                {/* Random Recipe Button */}
                <TouchableOpacity
                  onPress={handleFetchRandomRecipe}
                  className={
                    isSmallScreen
                      ? "absolute top-28 -right-16"
                      : "absolute top-28 -right-[72]"
                  }
                  style={styles.shadow}
                >
                  <BouncingImage>
                    <Image
                      source={require("../../assets/images/surprise.png")}
                      className={isSmallScreen ? "w-10 h-10" : "w-12 h-12"}
                    />
                  </BouncingImage>
                </TouchableOpacity>
              </View>

              {/* Recipe Title */}
              <Text
                className={
                  isSmallScreen
                    ? "text-lg font-Flux text-center p-2 mx-2 mt-4"
                    : "text-xl font-Flux text-center p-2 mx-2 mt-4"
                }
              >
                {recipe.title}
              </Text>

              {/* Recipe Attributes */}
              <View className="flex flex-row mb-1 flex-wrap justify-center items-center">
                {recipe.veryHealthy && (
                  <View
                    className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                    // style={styles.shadow}
                  >
                    <Text className="text-center font-SpaceMono text-md">
                      Very Healthy
                    </Text>
                  </View>
                )}
                {recipe.cheap && (
                  <View
                    className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                    // style={styles.shadow}
                  >
                    <Text className="text-center font-SpaceMono text-md">
                      Cheap
                    </Text>
                  </View>
                )}
                {recipe.veryPopular && (
                  <View
                    className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                    // style={styles.shadow}
                  >
                    <Text className="text-center font-SpaceMono text-md">
                      Very Popular
                    </Text>
                  </View>
                )}
                {recipe.sustainable && (
                  <View
                    className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                    // style={styles.shadow}
                  >
                    <Text className="text-center font-SpaceMono text-md">
                      Sustainable
                    </Text>
                  </View>
                )}
              </View>

              {/* Diet Images */}
              <View className="flex flex-row mb-2 flex-wrap justify-center items-center mx-4">
                {recipe.diets.map((diet: any) => {
                  const imageSource =
                    dietImages[diet as keyof typeof dietImages];
                  if (imageSource) {
                    let imageStyle = "w-16 h-16 m-1";
                    if (diet === "dairy free" || diet === "whole 30") {
                      imageStyle = "w-14 h-14 m-1";
                    }
                    return (
                      <Image
                        key={diet}
                        source={imageSource}
                        className={imageStyle}
                      />
                    );
                  }
                  return null;
                })}
              </View>

              {/* Four Option Buttons */}
              <View
                className="flex flex-row justify-center items-center mb-1"
                style={{ width: screenWidth - 30 }}
              >
                {/* Macros Button */}
                <TouchableOpacity
                  onPress={() => setShowMacros(!showMacros)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text
                      className={
                        isSmallScreen
                          ? "text-xs text-white text-center font-Nobile"
                          : "text-md text-white text-center font-Nobile"
                      }
                    >
                      Nutrition
                    </Text>
                    <Image
                      source={require("../../assets/images/macronutrients.png")}
                      className="w-4 h-4 ml-1"
                    />
                  </View>
                </TouchableOpacity>

                {/* Nutritional Values Button */}
                <TouchableOpacity
                  onPress={() => setShowNutrition(!showNutrition)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text
                      className={
                        isSmallScreen
                          ? "text-xs text-white text-center font-Nobile"
                          : "text-md text-white text-center font-Nobile"
                      }
                    >
                      Details
                    </Text>
                    <Image
                      source={require("../../assets/images/nutriValues.png")}
                      className="w-4 h-4 ml-1"
                    />
                  </View>
                </TouchableOpacity>

                {/* Wine Pairing Button */}
                <TouchableOpacity
                  onPress={() => {
                    setShowWinePairing(!showWinePairing);
                  }}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text
                      className={
                        isSmallScreen
                          ? "text-xs text-white text-center font-Nobile"
                          : "text-md text-white text-center font-Nobile"
                      }
                    >
                      Wine
                    </Text>
                    <Image
                      source={require("../../assets/images/winePairing.png")}
                      className="w-4 h-4 ml-1"
                    />
                  </View>
                </TouchableOpacity>
                {/* Food Substitute Button */}
                <TouchableOpacity
                  onPress={() => setShowSubstitutes(!showSubstitutes)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text
                      className={
                        isSmallScreen
                          ? "text-xs text-white text-center font-Nobile"
                          : "text-md text-white text-center font-Nobile"
                      }
                    >
                      Subs
                    </Text>
                    <Image
                      source={require("../../assets/images/foodSubs.png")}
                      className="w-4 h-4 ml-1"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Macros */}
              {showMacros && (
                <View className="flex flex-row justify-center items-start my-2">
                  <View className="relative mx-3" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/postitRed.png")}
                      className="w-24 h-24"
                    />
                    <View className="absolute top-7 left-0 right-0">
                      <Text className="text-base text-center text-slate-800">
                        Protein
                      </Text>
                      <Text className="font-medium text-lg text-center text-slate-800">
                        {Math.round(recipe.nutrition.nutrients[10].amount)} g
                      </Text>
                    </View>
                  </View>
                  <View className="relative mx-3" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/postitGreen.png")}
                      className="w-24 h-24"
                    />
                    <View className="absolute top-7 left-0 right-0">
                      <Text className="text-base text-center text-slate-800">
                        Fat
                      </Text>
                      <Text className="font-medium text-lg text-center text-slate-800">
                        {Math.round(recipe.nutrition.nutrients[1].amount)} g
                      </Text>
                    </View>
                  </View>
                  <View className="relative mx-3" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/postitYellow.png")}
                      className="w-24 h-24"
                    />
                    <View className="absolute top-7 left-0 right-0">
                      <Text className="text-base text-center text-slate-800">
                        Carbs
                      </Text>
                      <Text className="font-medium text-lg text-center text-slate-800">
                        {Math.round(recipe.nutrition.nutrients[3].amount)} g
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Wine Pairing */}
              {showWinePairing &&
                Array.isArray(recipe.winePairing?.pairedWines) &&
                recipe.winePairing.pairedWines.length > 0 && (
                  <View className="relative m-2">
                    <View
                      className="absolute bg-[#0098a3] rounded-2xl right-0.5 bottom-0.5"
                      style={{
                        width: screenWidth - 40,
                        height: dynamicHeightWine,
                        ...styles.shadow,
                      }}
                    ></View>
                    <View
                      className="flex justify-center items-center bg-slate-300 rounded-2xl m-2 p-2"
                      style={{
                        width: screenWidth - 40,
                      }}
                      onLayout={(event) => {
                        const { height } = event.nativeEvent.layout;
                        setDynamicHeightWine(height);
                      }}
                    >
                      <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                      >
                        <View className="flex flex-row justify-center items-center flex-wrap">
                          {recipe.winePairing.pairedWines.map(
                            (wine: any, index: number) => (
                              <View
                                key={index}
                                className="flex flex-row justify-center items-center m-2 w-20 h-80"
                              >
                                <Image
                                  source={imageForWine(wine)}
                                  className="absolute inset-0 w-full h-full"
                                />
                                <Text
                                  style={styles.shadow}
                                  className="font-Nobile text-2xl text-center text-red-600 w-48 top-10 -rotate-90"
                                >
                                  {wine
                                    .split(" ")
                                    .map(
                                      (word: string) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </ScrollView>
                      <Text className="text-lg my-2 mx-3 text-center font-SpaceMono">
                        {recipe.winePairing.pairingText}
                      </Text>
                    </View>
                  </View>
                )}

              {/* No Wine Pairing Available */}
              {showWinePairing &&
                (!recipe.winePairing?.pairedWines ||
                  !Array.isArray(recipe.winePairing.pairedWines) ||
                  recipe.winePairing.pairedWines.length === 0) && (
                  <View className="relative m-2">
                    <View
                      className="absolute bg-[#0098a3] rounded-2xl right-0.5 bottom-0.5"
                      style={{
                        width: screenWidth - 40,
                        height: 100,
                        ...styles.shadow,
                      }}
                    ></View>
                    <View
                      className="flex justify-center items-center bg-slate-300 rounded-2xl m-2 p-2"
                      style={{
                        width: screenWidth - 40,
                        height: 100,
                      }}
                    >
                      <Text className="text-lg m-2 text-center font-SpaceMono">
                        There are no wine pairing suggestions for this recipe
                      </Text>
                    </View>
                  </View>
                )}

              {/* Switch unit, Ready in minutes, Servings */}
              <View className="flex flex-row justify-around items-center my-2">
                {/* Switch unit */}
                <View className="flex flex-row justify-center items-center ml-4">
                  <Text className="font-SpaceMono text-md mr-2">US</Text>
                  <Switch
                    value={unitSystem === "metric"}
                    onValueChange={(value) =>
                      setUnitSystem(value ? "metric" : "us")
                    }
                    trackColor={{ false: "#ffb600", true: "#fb923c" }}
                    thumbColor={"#f94a00"}
                    ios_backgroundColor="#ffb600"
                  ></Switch>
                  <Text className="font-SpaceMono text-md ml-2">Metric</Text>
                </View>

                {/* Ready in minutes */}
                <View className="flex justify-center items-center mx-6">
                  <Image
                    source={require("../../assets/images/timer.png")}
                    className="w-10 h-10"
                  />
                  <Text className="font-SpaceMono text-md">
                    {recipe.readyInMinutes} mins
                  </Text>
                </View>

                {/* Servings */}
                <View className="flex justify-center items-center mr-4">
                  <View className="flex flex-row justify-center items-center">
                    <TouchableOpacity onPress={decrementServings}>
                      <Image
                        source={require("../../assets/images/minusSign.png")}
                        className="w-11 h-11"
                      />
                    </TouchableOpacity>
                    <Text className="font-SpaceMono text-md mx-1">
                      {servings}
                    </Text>
                    <TouchableOpacity onPress={incrementServings}>
                      <Image
                        source={require("../../assets/images/addSign.png")}
                        className="w-11 h-11"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="font-SpaceMono text-md">Servings</Text>
                </View>
              </View>

              {/* Ingredients list */}
              {(() => {
                const displayedIngredients = new Set();
                return recipe?.extendedIngredients?.map(
                  (ingredient: any, index: number) => {
                    if (displayedIngredients.has(ingredient.id)) {
                      return null;
                    }
                    displayedIngredients.add(ingredient.id);
                    return (
                      <View key={index} className="relative">
                        <View
                          className="absolute bg-[#64E6A6] rounded-2xl right-0.5 bottom-0.5"
                          style={{
                            width: screenWidth - 40,
                            height: 90,
                            ...styles.shadow,
                          }}
                        ></View>
                        <View
                          className="flex flex-row justify-between items-center bg-white rounded-2xl m-2 p-2"
                          style={{
                            width: screenWidth - 40,
                            height: 90,
                          }}
                        >
                          <View className="flex flex-row justify-center items-center mx-2">
                            {/* Ingredient Image */}
                            <TouchableOpacity
                              className="flex justify-center items-center w-16 h-16"
                              onPress={() => {
                                handleIngredientClick(ingredient.id);
                              }}
                            >
                              <Image
                                source={
                                  ingredient.image
                                    ? {
                                        uri: constructImageUrl(
                                          ingredient.image
                                        ),
                                      }
                                    : require("../../assets/images/picMissing.png")
                                }
                                className="w-full h-full"
                                resizeMode="contain"
                                onError={() => {
                                  setRecipe((prev: any) => ({
                                    ...prev,
                                    image: null,
                                  }));
                                }}
                              />
                            </TouchableOpacity>

                            <View className="flex justify-center items-center">
                              <ScrollView
                                contentContainerStyle={{
                                  flexGrow: 1,
                                  justifyContent: "center",
                                }}
                              >
                                {/* Ingredient Name */}
                                <View
                                  className={
                                    isSmallScreen
                                      ? "flex justify-center items-center mx-2 flex-wrap w-[160]"
                                      : "flex justify-center items-center mx-2 flex-wrap w-[190]"
                                  }
                                >
                                  <Text
                                    className={
                                      isSmallScreen
                                        ? "font-SpaceMono text-sm"
                                        : "font-SpaceMono text-base"
                                    }
                                  >
                                    {ingredient.originalName
                                      .charAt(0)
                                      .toUpperCase() +
                                      ingredient.originalName.slice(1)}
                                  </Text>
                                </View>
                              </ScrollView>
                            </View>
                          </View>

                          <View className="flex flex-row justify-center items-center ml-2 -mr-1">
                            {/* Ingredient amount and unit */}
                            <View
                              className={
                                isSmallScreen
                                  ? "flex justify-center items-center w-[60] mr-1"
                                  : "flex justify-center items-center w-[70]"
                              }
                            >
                              <Text
                                className={
                                  isSmallScreen
                                    ? "font-SpaceMono text-base text-center"
                                    : "font-SpaceMono text-lg text-center"
                                }
                              >
                                {unitSystem === "metric"
                                  ? parseFloat(
                                      (
                                        ingredient.measures.metric.amount *
                                        (servings / recipe.servings)
                                      ).toFixed(2)
                                    )
                                  : parseFloat(
                                      (
                                        ingredient.measures.us.amount *
                                        (servings / recipe.servings)
                                      ).toFixed(2)
                                    )}
                              </Text>
                              {(unitSystem === "metric" &&
                                ingredient.measures.metric.unitShort) ||
                              (unitSystem !== "metric" &&
                                ingredient.measures.us.unitShort) ? (
                                <Text className="font-SpaceMono text-xs text-center">
                                  {unitSystem === "metric"
                                    ? ingredient.measures.metric.unitShort
                                    : ingredient.measures.us.unitShort}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  }
                );
              })()}

              {/* Equipment */}
              {recipe.analyzedInstructions?.[0]?.steps?.some(
                (step: any) => step.equipment.length > 0
              ) && (
                <View className="relative">
                  <View
                    className="absolute bg-[#f9f927] rounded-2xl right-0.5 bottom-0.5"
                    style={{
                      width: screenWidth - 40,
                      height: dynamicHeightEquipment,
                      ...styles.shadow,
                    }}
                  ></View>
                  <View
                    className="flex justify-center items-center bg-white rounded-2xl m-2 p-3"
                    style={{
                      width: screenWidth - 40,
                    }}
                    onLayout={(event) => {
                      const { height } = event.nativeEvent.layout;
                      setDynamicHeightEquipment(height);
                    }}
                  >
                    <View className="relative justify-center items-center mt-3 mb-2">
                      <Image
                        source={require("../../assets/images/stickers/silverTape.png")}
                        className="w-40 h-10 absolute"
                      />
                      <Text className="font-SpaceMono text-lg text-center">
                        Kitchenware
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap justify-center items-center m-2">
                      {(() => {
                        const displayedEquipment = new Set();
                        return recipe.analyzedInstructions?.[0]?.steps?.map(
                          (step: any, stepIndex: number) =>
                            step.equipment.map(
                              (equipment: any, index: number) => {
                                if (displayedEquipment.has(equipment.name)) {
                                  return null;
                                }
                                displayedEquipment.add(equipment.name);
                                return (
                                  <View
                                    key={`${stepIndex}-${index}`}
                                    className="flex justify-center items-center mx-2 my-1 basis-1/4"
                                  >
                                    <Image
                                      source={
                                        equipment.image
                                          ? { uri: equipment.image }
                                          : require("../../assets/images/questionMark.png")
                                      }
                                      className="w-20 h-20"
                                      resizeMode="contain"
                                    />

                                    <Text className="font-SpaceMono text-sm text-center mt-1">
                                      {equipment.name.charAt(0).toUpperCase() +
                                        equipment.name.slice(1)}
                                    </Text>
                                  </View>
                                );
                              }
                            )
                        );
                      })()}
                    </View>
                  </View>
                </View>
              )}

              {/* Instructions */}
              <View className="relative mb-12">
                <View
                  className="absolute bg-[#FF5045] rounded-2xl right-0.5 bottom-0.5"
                  style={{
                    width: screenWidth - 40,
                    height: dynamicHeight,
                    ...styles.shadow,
                  }}
                ></View>
                <View
                  className="flex justify-center items-center bg-white rounded-2xl m-2 p-2"
                  style={{
                    width: screenWidth - 40,
                  }}
                  onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setDynamicHeight(height);
                  }}
                >
                  {/* Instructions, steps */}
                  {recipe.analyzedInstructions?.length > 0 ? (
                    recipe.analyzedInstructions[0].steps.map(
                      (instruction: any, index: number) => (
                        <View
                          key={index}
                          className="flex justify-between items-center rounded-2xl m-2 p-3 border"
                          style={{
                            width: screenWidth - 70,
                          }}
                        >
                          {/* Steps Image */}
                          <View
                            className="flex justify-center items-center w-20 h-24 relative mb-2"
                            style={styles.shadow}
                          >
                            <Image
                              source={postitImages[index]}
                              className="absolute inset-0 w-full h-full"
                            />
                            <Text className="text-center text-base font-SpaceMono">
                              Step {instruction.number}
                            </Text>
                          </View>

                          {/* Steps Text */}
                          <Text
                            className="text-justify p-1 mx-2"
                            style={{
                              fontFamily: "SpaceMono",
                              fontSize: 15,
                            }}
                          >
                            {instruction.step}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text className="text-center font-SpaceMono text-lg my-4">
                      There are no instructions available for this recipe
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Nutritional Value Modal */}
      <Modal visible={showNutrition} onDismiss={() => setShowNutrition(false)}>
        <View className="flex justify-center items-center">
          <View
            className={
              isSmallScreen
                ? "bg-slate-300 rounded-2xl p-2 w-[90%] max-h-[540] bottom-10"
                : "bg-slate-300 rounded-2xl p-2 w-[90%] bottom-10"
            }
          >
            {recipe && (
              <>
                <TouchableOpacity
                  onPress={() => setShowNutrition(false)}
                  className="items-end p-1"
                >
                  <Image
                    source={require("../../assets/images/cross.png")}
                    className="w-6 h-6"
                  />
                </TouchableOpacity>
                <View className="items-center mx-4 mt-2">
                  <Text className="font-SpaceMono text-lg text-center">
                    Nutritional Values for {recipe.title} recipe
                  </Text>
                </View>

                <DataTable className="w-max my-3">
                  <DataTable.Header>
                    <DataTable.Title className="justify-center">
                      <Text>Nutrient</Text>
                    </DataTable.Title>
                    <DataTable.Title className="justify-center">
                      Amount
                    </DataTable.Title>
                    <DataTable.Title className="justify-center">
                      Daily needs
                    </DataTable.Title>
                  </DataTable.Header>

                  <ScrollView
                    style={
                      isSmallScreen
                        ? { maxHeight: 300, width: "100%" }
                        : { maxHeight: 350, width: "100%" }
                    }
                  >
                    {recipe.nutrition.nutrients?.map(
                      (nutrient: any, index: number) => (
                        <DataTable.Row
                          key={index}
                          style={
                            index % 2 === 0
                              ? { backgroundColor: "#f1f5f9" }
                              : { backgroundColor: "#e2e8f0" }
                          }
                        >
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={2} className="text-center">
                              {nutrient.name}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={1}>
                              {nutrient.amount} {nutrient.unit}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={1}>
                              {nutrient.percentOfDailyNeeds}%
                            </Text>
                          </DataTable.Cell>
                        </DataTable.Row>
                      )
                    )}
                  </ScrollView>
                </DataTable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Nutrition per Ingredient Modal */}
      <Modal
        visible={ingredientModalVisible}
        onDismiss={() => setIngredientModalVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View className="bg-slate-300 rounded-2xl p-2 w-[90%] bottom-10">
            {selectedIngredientNutrition && (
              <>
                <TouchableOpacity
                  onPress={() => setIngredientModalVisible(false)}
                  className="items-end p-1"
                >
                  <Image
                    source={require("../../assets/images/cross.png")}
                    className="w-6 h-6"
                  />
                </TouchableOpacity>

                <View className="items-center mx-4 mt-2">
                  <Text className="font-SpaceMono text-lg text-center">
                    {`Nutritional Values for ${
                      selectedIngredientNutrition.amount
                    } ${
                      selectedIngredientNutrition.unit
                    } of ${selectedIngredientNutrition.name
                      .charAt(0)
                      .toUpperCase()}${selectedIngredientNutrition.name.slice(
                      1
                    )}`}
                  </Text>
                </View>

                <DataTable className="w-max my-3">
                  <DataTable.Header>
                    <DataTable.Title className="justify-center">
                      <Text>Nutrient</Text>
                    </DataTable.Title>
                    <DataTable.Title className="justify-center">
                      Amount
                    </DataTable.Title>
                    <DataTable.Title className="justify-center">
                      Daily needs
                    </DataTable.Title>
                  </DataTable.Header>

                  <ScrollView
                    style={{
                      maxHeight: 350,
                      width: "100%",
                    }}
                  >
                    {selectedIngredientNutrition.nutrients?.map(
                      (nutrient: any, index: number) => (
                        <DataTable.Row
                          key={index}
                          style={
                            index % 2 === 0
                              ? { backgroundColor: "#f1f5f9" }
                              : { backgroundColor: "#e2e8f0" }
                          }
                        >
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={2} className="text-center">
                              {nutrient.name}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={1}>
                              {nutrient.amount} {nutrient.unit}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell className="justify-center">
                            <Text numberOfLines={1}>
                              {nutrient.percentOfDailyNeeds}%
                            </Text>
                          </DataTable.Cell>
                        </DataTable.Row>
                      )
                    )}
                  </ScrollView>
                </DataTable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Subsitutes Modal */}
      <Modal
        visible={showSubstitutes}
        onDismiss={() => setShowSubstitutes(false)}
      >
        <View className="flex justify-center items-center">
          <View
            className={
              isSmallScreen
                ? "bg-slate-200 rounded-2xl p-2 justify-center items-center max-h-[540] w-[90%] bottom-10"
                : "bg-slate-200 rounded-2xl p-2 justify-center items-center max-h-[720] w-[90%] bottom-10"
            }
          >
            <ScrollView>
              <TouchableOpacity
                onPress={() => setShowSubstitutes(false)}
                className="items-end p-1"
              >
                <Image
                  source={require("../../assets/images/cross.png")}
                  className="w-6 h-6"
                />
              </TouchableOpacity>
              <View className="flex justify-center items-center mb-4">
                {activeIngredientId !== null && (
                  <View className="w-full items-center">
                    {(() => {
                      const displayedTexts = new Set();
                      return recipe?.extendedIngredients?.map(
                        (ingredient: any, index: number) => {
                          if (
                            activeIngredientId === ingredient.id &&
                            !displayedTexts.has(ingredient.id)
                          ) {
                            displayedTexts.add(ingredient.id);
                            return (
                              <View key={index}>
                                <Text className="font-SpaceMono text-lg text-center mb-2">
                                  {ingredient.originalName
                                    .charAt(0)
                                    .toUpperCase() +
                                    ingredient.originalName.slice(1)}
                                </Text>
                                {ingredientSubstitutes.length > 0 ? (
                                  ingredientSubstitutes.map(
                                    (substitute: any, subIndex: number) => (
                                      <Text
                                        key={subIndex}
                                        className="font-SpaceMono text-md text-center"
                                      >
                                        {substitute}
                                      </Text>
                                    )
                                  )
                                ) : (
                                  <Text className="font-SpaceMono text-md text-center">
                                    No substitutes found
                                  </Text>
                                )}
                              </View>
                            );
                          }
                          return null;
                        }
                      );
                    })()}
                  </View>
                )}
              </View>
              <View className="flex flex-row flex-wrap justify-center items-center my-2">
                {(() => {
                  const displayedIngredients = new Set();
                  return recipe?.extendedIngredients?.map(
                    (ingredient: any, index: number) => {
                      if (displayedIngredients.has(ingredient.id)) {
                        return null;
                      }
                      displayedIngredients.add(ingredient.id);
                      return (
                        <View key={index} className="m-2 p-1">
                          <TouchableOpacity
                            className="flex justify-center items-center w-20 h-20 p-1 rounded-2xl bg-white"
                            style={styles.shadow}
                            onPress={() => {
                              fetchIngredientSubstitution(ingredient.id);
                              if (activeIngredientId === ingredient.id) {
                                setActiveIngredientId(null);
                              } else {
                                setActiveIngredientId(ingredient.id);
                              }
                            }}
                          >
                            {ingredient.image ? (
                              <Image
                                source={{
                                  uri: constructImageUrl(ingredient.image),
                                }}
                                className="w-full h-full"
                                resizeMode="contain"
                              />
                            ) : (
                              <Image
                                source={require("../../assets/images/missingIng.png")}
                                className="w-full h-full"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    }
                  );
                })()}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
