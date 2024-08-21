import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { DataTable, Modal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { useNavigation } from "expo-router";
import { useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
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
  const cachedIngredientSubstitutes = useRef<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  // fetch favourite recipes lists from user
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
      }
    };
    fetchFavourites();
    console.log("Fetching user favourites: ", userFavourites.length);
  }, [user.token, userFavourites.length]);

  // Fetch full recipe data from API or database
  useEffect(() => {
    const fetchRecipeData = async () => {
      setLoading(true);
      try {
        let currentRecipeId = recipeId;
        let recipeData = null;

        // Check if the recipe was passed so exists in the database
        if (passedRecipe) {
          recipeData = passedRecipe.additionalData;
          currentRecipeId = passedRecipe.id;
          setServings(recipeData.servings);
          console.log("Passed recipe");

          // Fetch the recipe data from the API
        } else {
          const fetchedRecipeData = await fetchRecipeInformation(recipeId);
          const instructions = await fetchAnalyzedInstructions(recipeId);

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

        // Check if the recipe is already in the user's favourites list
        if (userFavourites && currentRecipeId) {
          const isFavourite = userFavourites.some(
            (fav: any) => fav.id === String(currentRecipeId)
          );
          setIsFavourite((prev: any) => ({
            ...prev,
            [currentRecipeId]: isFavourite,
          }));
        } else {
          console.log("User favourites not found or no recipe ID");
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

  const constructImageUrl = (imageFileName: string) => {
    return `https://img.spoonacular.com/ingredients_100x100/${imageFileName}`;
  };

  const incrementServings = () => {
    setServings(servings + 1);
  };

  const decrementServings = () => {
    if (servings >= 1) {
      setServings(servings - 1);
    }
  };

  const randomPostitImage = () => {
    const images = [
      require("../../assets/images/stickers/postit1.png"),
      require("../../assets/images/stickers/postit2.png"),
      require("../../assets/images/stickers/postit3.png"),
      require("../../assets/images/stickers/postit4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const handleFetchRandomRecipe = async () => {
    const randomRecipe = await fetchRandomRecipe();
    navigation.navigate("recipeCard", { recipeId: randomRecipe.id });
  };

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
    await addRecipeToFavourites(recipeId, user, toast, false);
    dispatch(addToFavouriteRecipes(recipeId));
    setIsFavourite((prev: any) => ({ ...prev, [recipeId]: true }));
  };

  // Remove recipe from favourites list
  const handleRemoveFromFavourites = async (recipeId: number) => {
    await removeRecipeFromFavourites(recipeId, user, toast);
    dispatch(removeFromFavouriteRecipes(recipeId));
    setIsFavourite((prev: any) => ({ ...prev, [recipeId]: false }));
  };

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
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <StatusBar barStyle="dark-content" />
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
              {/* Recipe Image and box behind  */}
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
                        ? { uri: recipe.image }
                        : require("../../assets/images/picMissing.png")
                    }
                    className={
                      recipe.image
                        ? "w-full h-full"
                        : "w-44 h-44 top-0 bootom-0 right-0 left-0 m-auto"
                    }
                  />
                </View>
              </View>

              {/* Back Button */}
              <TouchableOpacity
                onPress={() => handleBackButton()}
                className="absolute top-5 left-5"
                style={styles.shadow}
              >
                <Image
                  source={require("../../assets/images/yellowArrow.png")}
                  className="w-10 h-10"
                />
              </TouchableOpacity>

              {/* Random Recipe Button */}
              <TouchableOpacity
                onPress={handleFetchRandomRecipe}
                className="absolute top-44 right-4"
                style={styles.shadow}
              >
                <BouncingImage>
                  <Image
                    source={require("../../assets/images/surprise2.png")}
                    className="w-12 h-12"
                  />
                </BouncingImage>
              </TouchableOpacity>

              {/* Favourite Recipe Button */}
              {user.token && (
                <TouchableOpacity
                  onPress={() => {
                    isFavourite[recipe.id]
                      ? handleRemoveFromFavourites(recipe.id)
                      : handleAddToFavourites(recipe.id);
                  }}
                  className="absolute top-4 right-4"
                >
                  {
                    <Image
                      source={
                        isFavourite[recipe.id]
                          ? require("../../assets/images/heart4.png")
                          : require("../../assets/images/heart5.png")
                      }
                      className="w-10 h-10"
                    />
                  }
                </TouchableOpacity>
              )}

              {/* Recipe Title */}
              <Text className="text-xl font-Flux text-center p-2 mx-2 mt-4">
                {recipe.title}
              </Text>

              {/* Recipe Attributes */}
              <View>
                <View className="flex flex-row mb-1 flex-wrap justify-center items-center">
                  {recipe.veryHealthy && (
                    <View
                      className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                      style={styles.shadow}
                    >
                      <Text className="text-center font-SpaceMono text-md">
                        Very Healthy
                      </Text>
                    </View>
                  )}
                  {recipe.cheap && (
                    <View
                      className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                      style={styles.shadow}
                    >
                      <Text className="text-center font-SpaceMono text-md">
                        Cheap
                      </Text>
                    </View>
                  )}
                  {recipe.veryPopular && (
                    <View
                      className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                      style={styles.shadow}
                    >
                      <Text className="text-center font-SpaceMono text-md">
                        Very Popular
                      </Text>
                    </View>
                  )}
                  {recipe.sustainable && (
                    <View
                      className="bg-[#F4C653] rounded-2xl py-2 px-3 m-1"
                      style={styles.shadow}
                    >
                      <Text className="text-center font-SpaceMono text-md">
                        Sustainable
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Diets */}
              <View>
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
              </View>

              {/* Four Option Buttons */}
              <View className="flex flex-row justify-center items-center">
                {/* Macros Button */}
                <TouchableOpacity
                  onPress={() => setShowMacros(!showMacros)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text className="text-md text-white text-center font-Nobile">
                      Macros
                    </Text>
                    {/* <Image
                    source={require("../../assets/images/macronutrients.png")}
                    className="w-4 h-4"
                  /> */}
                  </View>
                </TouchableOpacity>

                {/* Nutritional Values Button */}
                <TouchableOpacity
                  onPress={() => setShowNutrition(!showNutrition)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text className="text-md text-white text-center font-Nobile">
                      Nutritional values
                    </Text>
                    {/* <Image
                    source={require("../../assets/images/nutriValues.png")}
                    className="w-4 h-4"
                  /> */}
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
                    <Text className="text-md text-white text-center font-Nobile">
                      Wine
                    </Text>
                    {/* <Image
                    source={require("../../assets/images/winePairing.png")}
                    className="w-4 h-4"
                  /> */}
                  </View>
                </TouchableOpacity>

                {/* Food Substitute Button */}
                <TouchableOpacity
                  onPress={() => setShowSubstitutes(!showSubstitutes)}
                  className="flex justify-center items-center m-1 p-3 rounded-lg bg-[#1c79b2]"
                  style={styles.shadow}
                >
                  <View className="flex flex-row justify-center items-center">
                    <Text className="text-md text-white text-center font-Nobile">
                      Substitutes
                    </Text>
                    {/* <Image
                    source={require("../../assets/images/foodSubs3.png")}
                    className="w-4 h-4"
                  /> */}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Macros */}
              {showMacros && (
                <View className="flex flex-row justify-center items-start my-2">
                  <View className="relative mx-1" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/redTape2.png")}
                      className="w-32 h-14"
                    />
                    <View className="absolute top-1 left-10">
                      <Text className="font-bold text-base text-center text-slate-900">
                        {recipe.nutrition.caloricBreakdown.percentProtein}%
                      </Text>
                      <Text className="font-bold text-md text-center text-slate-900">
                        Protein
                      </Text>
                    </View>
                  </View>
                  <View className="relative mx-1" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/greenTape.png")}
                      className="w-28 h-16"
                    />
                    <View className="absolute left-7 top-2">
                      <Text className="font-bold text-base text-center text-slate-900">
                        {recipe.nutrition.caloricBreakdown.percentFat}%
                      </Text>
                      <Text className="font-bold text-md text-center text-slate-900">
                        Fat
                      </Text>
                    </View>
                  </View>
                  <View className="relative mx-1" style={styles.shadow}>
                    <Image
                      source={require("../../assets/images/stickers/yellowTape4.png")}
                      className="w-32 h-14"
                    />
                    <View className="absolute top-2 left-10">
                      <Text className="font-bold text-base text-center text-slate-900">
                        {recipe.nutrition.caloricBreakdown.percentCarbs}%
                      </Text>
                      <Text className="font-bold text-md text-center text-slate-900">
                        Carbs
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Wine Pairing */}
              {showWinePairing &&
                recipe.winePairing &&
                recipe.winePairing.pairedWines &&
                Array.isArray(recipe.winePairing.pairedWines) &&
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

              {/* Wine Pairing When No Wines */}
              {showWinePairing &&
                (!recipe.winePairing ||
                  !recipe.winePairing.pairedWines ||
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

              <View className="flex flex-row justify-around items-center m-2">
                {/* Switch unit */}
                <View className="flex flex-row justify-center items-center mr-4">
                  <Text className="font-SpaceMono text-md m-2">US</Text>
                  <Switch
                    value={unitSystem === "metric"}
                    onValueChange={(value) =>
                      setUnitSystem(value ? "metric" : "us")
                    }
                    trackColor={{ false: "#ffb600", true: "#fb923c" }}
                    thumbColor={"#f94a00"}
                    ios_backgroundColor="#ffb600"
                  ></Switch>
                  <Text className="font-SpaceMono text-md m-2">Metric</Text>
                </View>

                {/* Ready in minutes */}
                <View className="flex justify-center items-center">
                  <Image
                    source={require("../../assets/images/timer2.png")}
                    className="w-10 h-10"
                  />
                  <Text className="font-SpaceMono text-md">
                    {recipe.readyInMinutes} mins
                  </Text>
                </View>

                {/* Servings */}
                <View className="flex justify-center items-center ml-4">
                  <View className="flex flex-row justify-center items-center">
                    <TouchableOpacity onPress={decrementServings}>
                      <Ionicons
                        name="remove-circle"
                        size={40}
                        color={"#075985"}
                      />
                    </TouchableOpacity>
                    <Text className="font-SpaceMono text-md mx-1">
                      {servings}
                    </Text>
                    <TouchableOpacity onPress={incrementServings}>
                      <Ionicons name="add-circle" size={40} color={"#075985"} />
                    </TouchableOpacity>
                  </View>
                  <Text className="font-SpaceMono text-md">Servings</Text>
                </View>
              </View>

              {/* Ingredients list */}
              {(() => {
                const displayedIngredients = new Set();
                return recipe.extendedIngredients?.map(
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
                            height: 100,
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
                                  source={require("../../assets/images/missingIng2.png")}
                                  className="w-full h-full"
                                />
                              )}
                            </TouchableOpacity>

                            <View className="flex justify-center items-center">
                              <ScrollView
                                contentContainerStyle={{
                                  flexGrow: 1,
                                  justifyContent: "center",
                                }}
                              >
                                {/* Ingredient Name */}
                                <View className="flex justify-center items-center mx-2 flex-wrap max-w-[190]">
                                  <Text className="font-SpaceMono text-[16px]">
                                    {ingredient.originalName
                                      .charAt(0)
                                      .toUpperCase() +
                                      ingredient.originalName.slice(1)}
                                  </Text>
                                </View>
                              </ScrollView>
                            </View>
                          </View>

                          <View className="flex flex-row justify-center items-center mx-2">
                            {/* Ingredient amount and unit */}
                            <View className="flex justify-center items-center max-w-[80]">
                              <Text className="font-SpaceMono text-[17px] text-center">
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
                              <Text className="font-SpaceMono text-[12px] text-center">
                                {unitSystem === "metric"
                                  ? ingredient.measures.metric.unitShort
                                  : ingredient.measures.us.unitShort}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  }
                );
              })()}

              {/* Equipment */}
              {recipe.analyzedInstructions &&
                recipe.analyzedInstructions[0] &&
                recipe.analyzedInstructions[0].steps &&
                recipe.analyzedInstructions[0].steps.some(
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
                      <View className="relative justify-center items-center my-3">
                        <Image
                          source={require("../../assets/images/stickers/tape5.png")}
                          className="w-40 h-10 absolute"
                        />
                        <Text className="font-SpaceMono text-lg text-center">
                          Kitchenware
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap justify-center items-center m-2">
                        {(() => {
                          const displayedEquipment = new Set();
                          return recipe.analyzedInstructions[0].steps.map(
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
                                      className="flex justify-center items-center m-1"
                                    >
                                      <Image
                                        source={
                                          equipment.image
                                            ? { uri: equipment.image }
                                            : require("../../assets/images/questionMark.png")
                                        }
                                        className="w-16 h-16"
                                        resizeMode="contain"
                                      />

                                      <Text className="font-SpaceMono text-xs">
                                        {equipment.name
                                          .charAt(0)
                                          .toUpperCase() +
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
              <View className="relative mb-5">
                <View
                  className="absolute bg-[#FF5045] rounded-2xl -right-0 -bottom-0"
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
                  {recipe.analyzedInstructions &&
                    recipe.analyzedInstructions.length > 0 &&
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
                            className="flex justify-center items-center w-20 h-20 relative mb-2"
                            style={styles.shadow}
                          >
                            <Image
                              source={randomPostitImage()}
                              className="absolute inset-0 w-full h-full"
                            />
                            <Text className="text-center text-[15px] font-SpaceMono">
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
          <View className="bg-slate-300 rounded-2xl p-2 w-[90%]">
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
                    style={{
                      maxHeight: 350,
                      width: "100%",
                    }}
                  >
                    {recipe.nutrition.nutrients &&
                      recipe.nutrition.nutrients.map(
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
          <View className="bg-slate-300 rounded-2xl p-2 w-[90%]">
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
                    {selectedIngredientNutrition.nutrients.map(
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
          <View className="bg-slate-200 rounded-2xl p-2 justify-center items-center max-h-[720] w-[90%] bottom-10">
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
              <View className="flex flex-row flex-wrap justify-center items-center my-2">
                {(() => {
                  const displayedIngredients = new Set();
                  return (
                    recipe &&
                    recipe.extendedIngredients?.map(
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
                                  source={require("../../assets/images/missingIng2.png")}
                                  className="w-full h-full"
                                />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      }
                    )
                  );
                })()}
              </View>
              <View className="flex justify-center items-center mb-4">
                {activeIngredientId !== null && (
                  <View className="w-full items-center">
                    {(() => {
                      const displayedTexts = new Set();
                      return recipe.extendedIngredients.map(
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
