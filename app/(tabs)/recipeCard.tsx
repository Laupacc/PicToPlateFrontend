import React from "react";
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
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { DataTable } from "react-native-paper";
import { ScrollView } from "react-native-gesture-handler";
import { useState, useEffect, useRef } from "react";
import { useNavigation } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome5";
import Entypo from "react-native-vector-icons/Entypo";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import Background from "@/components/Background";
import wineCategories from "../../_dataSets.json";
import {
  fetchRandomRecipe,
  fetchRecipeInformation,
  fetchAnalyzedInstructions,
} from "@/apiFunctions";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
  updateFavouriteRecipes,
} from "@/store/recipes";

export default function RecipeCard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);
  const token = useSelector((state) => state.user.value.token);
  const favourites = useSelector((state) => state.recipes.favourites);

  const route = useRoute();
  const { recipeId } = route.params as { recipeId: number };
  const [recipe, setRecipe] = useState<any>(null);
  const [servings, setServings] = useState(0);
  const [unitSystem, setUnitSystem] = useState("us");
  const [dynamicHeight, setDynamicHeight] = useState(0);
  const [dynamicHeightWine, setDynamicHeightWine] = useState(0);
  const [ingredientSubstitutes, setIngredientSubstitutes] = useState([]);
  const [showWinePairing, setShowWinePairing] = useState(false);
  // const [wineDescription, setWineDescription] = useState({});
  const [activeIngredientId, setActiveIngredientId] = useState(null);
  const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
  const [selectedIngredientNutrition, setSelectedIngredientNutrition] =
    useState(null);
  const [showNutrition, setShowNutrition] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  const BACKEND_URL = "http://192.168.1.34:3000";

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  // Fetch full recipe data
  const cachedRecipe = useRef<any>(null);
  useEffect(() => {
    const fetchRecipeData = async () => {
      if (cachedRecipe.current && cachedRecipe.current.id === recipeId) {
        setRecipe(cachedRecipe.current);
        setServings(cachedRecipe.current.servings);
        return;
      }

      try {
        const recipeData = await fetchRecipeInformation(recipeId);
        const instructions = await fetchAnalyzedInstructions(recipeId);
        if (recipeData && instructions) {
          const fullRecipeData = {
            ...recipeData,
            analyzedInstructions: instructions,
          };
          setRecipe(fullRecipeData);
          setServings(recipeData.servings);

          cachedRecipe.current = fullRecipeData;

          console.log("recipe data", recipeData);
          console.log("instruction data", instructions);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchRecipeData();
  }, [recipeId]);

  // Fetch ingredient substitutes
  const cachedIngredientSubstitutes = useRef<any>({});
  const fetchIngredientSubstitution = async (id) => {
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
    } catch (error) {
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
    const isFav = user?.favourites?.includes(randomRecipe.recipeId) || false;
    setIsFavourite(isFav);
    navigation.navigate("recipeCard", { recipeId: randomRecipe.id });
  };

  // const fetchWineDescription = async (pairedWines) => {
  //   const descriptions = await Promise.all(
  //     pairedWines.map(async (wine) => {
  //       const response = await fetch(
  //         `http://192.168.1.34:3000/recipes/wineDescription/${wine}`
  //       );
  //       const data = await response.json();
  //       console.log("Wine description data:", [wine], data.wineDescription);
  //       return { [wine]: data.wineDescription };
  //     })
  //   );

  //   setWineDescription(Object.assign({}, ...descriptions));
  // };

  const imageForWine = (wine) => {
    const wineImages = {
      white_wine: require("../../assets/images/wines/whitewine.png"),
      red_wine: require("../../assets/images/wines/redwine.png"),
      rose_wine: require("../../assets/images/wines/rosewine.png"),
      dessert_wine: require("../../assets/images/wines/dessertwine.png"),
      sparkling_wine: require("../../assets/images/wines/sparklingwine.png"),
      default: require("../../assets/images/wines/defaultwine.png"),
    };
    const category = wineCategories.wineCategories[wine] || "default";
    if (category) {
      return wineImages[category];
    } else {
      return wineImages.default;
    }
  };

  // Fetch nutrition data for clicked ingredient
  const handleIngredientClick = (ingredientId) => {
    // Find the ingredient in the recipe data
    const ingredient = recipe.extendedIngredients.find(
      (ing) => ing.id === ingredientId
    );
    if (ingredient && recipe.nutrition && recipe.nutrition.ingredients) {
      // Find the nutrition data for the clicked ingredient
      const nutritionInfo = recipe.nutrition.ingredients.find(
        (nutri) => nutri.id === ingredientId
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

  // Add or remove recipe from favourites
  const addRecipeToFavourites = async () => {
    try {
      const recipeId = recipe.id;
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
      dispatch(addToFavouriteRecipes(recipe));
      setIsFavourite(true);

      toast.show("Recipe added to favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const removeRecipeFromFavourites = async () => {
    try {
      const recipeId = recipe.id;
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
      dispatch(removeFromFavouriteRecipes(recipe));
      setIsFavourite(false);

      toast.show("Recipe removed from favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error(error.message);
    }
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

  const randomMissingMainImage = () => {
    const images = [
      require("../../assets/images/waiterTray/waiterTray1.png"),
      require("../../assets/images/waiterTray/waiterTray2.png"),
      require("../../assets/images/waiterTray/waiterTray3.png"),
      require("../../assets/images/waiterTray/waiterTray4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      <ScrollView>
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
                  borderRadius: 120,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={
                    recipe.image
                      ? { uri: recipe.image }
                      : randomMissingMainImage()
                  }
                  className="w-full h-full"
                />
              </View>
            </View>

            {/* Back Button and Random Recipe Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-5 left-5"
            >
              <Image
                source={require("../../assets/images/yellowArrow.png")}
                className="w-10 h-10"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFetchRandomRecipe}
              className="absolute top-4 right-2"
            >
              <Image
                source={require("../../assets/images/surprise.png")}
                className="w-11 h-11"
              />
            </TouchableOpacity>

            {/* Favourite Button */}
            {user.token && (
              <TouchableOpacity
                onPress={
                  isFavourite
                    ? removeRecipeFromFavourites
                    : addRecipeToFavourites
                }
                className="absolute top-4 right-16"
              >
                <Image
                  source={
                    isFavourite
                      ? require("../../assets/images/heart1.png")
                      : require("../../assets/images/heart3.png")
                  }
                  className="w-10 h-10"
                />
              </TouchableOpacity>
            )}

            {/* Recipe Title */}
            <Text className="text-xl font-Flux text-center p-2 mx-2 mt-4">
              {recipe.title}
            </Text>

            {/* Recipe Attributes */}
            <ScrollView>
              <View className="flex flex-row m-1 flex-wrap justify-center items-center">
                {recipe.veryHealthy && (
                  <Text
                    className="text-center font-SpaceMono text-md bg-[#F4C653] rounded-2xl p-2 m-1"
                    style={styles.shadow}
                  >
                    Very Healthy
                  </Text>
                )}
                {recipe.cheap && (
                  <Text
                    className="text-center font-SpaceMono text-md bg-[#F4C653] rounded-2xl p-2 m-1"
                    style={styles.shadow}
                  >
                    Cheap
                  </Text>
                )}
                {recipe.veryPopular && (
                  <Text
                    className="text-center font-SpaceMono text-md bg-[#F4C653] rounded-2xl p-2 m-1"
                    style={styles.shadow}
                  >
                    Very Popular
                  </Text>
                )}
                {recipe.sustainable && (
                  <Text
                    className="text-center font-SpaceMono text-md bg-[#F4C653] rounded-2xl p-2 m-1"
                    style={styles.shadow}
                  >
                    Sustainable
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Diets */}
            <ScrollView>
              <View className="flex flex-row m-2 flex-wrap justify-center items-center">
                {recipe.diets.map((diet) => {
                  const imageSource = dietImages[diet.toLowerCase()];
                  if (imageSource) {
                    const imageStyle =
                      screenWidth > 320 ? "w-14 h-14 m-1" : "w-12 h-12 m-1";

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
            </ScrollView>

            {/* Switch, time and servings */}
            <View>
              <View className="flex flex-row justify-around items-center m-2">
                <View className="flex flex-row justify-center items-center mr-4">
                  <Text className="font-SpaceMono text-md m-2">US</Text>
                  <Switch
                    value={unitSystem === "us"}
                    onValueChange={(value) =>
                      setUnitSystem(value ? "us" : "metric")
                    }
                    trackColor={{ false: "#ffb600", true: "#ffb600" }}
                    thumbColor={"#f94a00"}
                  ></Switch>
                  <Text className="font-SpaceMono text-md m-2">Metric</Text>
                </View>
                <View className="flex justify-center items-center">
                  <Ionicons name="timer" size={40} color={"#149575"} />
                  <Text className="font-SpaceMono text-md">
                    {recipe.readyInMinutes} mins
                  </Text>
                </View>
                <View className="flex justify-center items-center ml-4">
                  <View className="flex flex-row justify-center items-center">
                    <TouchableOpacity onPress={decrementServings}>
                      <Ionicons
                        name="remove-circle"
                        size={40}
                        color={"#149575"}
                      />
                    </TouchableOpacity>
                    <Text className="font-SpaceMono text-md mx-1">
                      {servings}
                    </Text>
                    <TouchableOpacity onPress={incrementServings}>
                      <Ionicons name="add-circle" size={40} color={"#149575"} />
                    </TouchableOpacity>
                  </View>
                  <Text className="font-SpaceMono text-md">Servings</Text>
                </View>
              </View>

              <View>
                <Text>
                  {recipe.nutrition.caloricBreakdown.percentProtein}% Protein -
                  {recipe.nutrition.caloricBreakdown.percentFat}% Fat -
                  {recipe.nutrition.caloricBreakdown.percentCarbs}% Carbs
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowNutrition(!showNutrition)}
                className="flex justify-center items-center m-2"
                style={styles.shadow}
              >
                <View className="flex justify-center items-center">
                  <Text style={{ fontSize: 40 }}>🍏</Text>
                  <Text className="font-SpaceMono text-lg text-[#7a1b0e] text-center">
                    Nutritional Values
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Nutrition Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={showNutrition}
              onRequestClose={() => {
                setShowNutrition(false);
              }}
            >
              <View className="flex-1 justify-center items-center bg-black/50">
                <View
                  style={styles.shadow}
                  className="bg-slate-300 rounded-2xl p-2 w-[80%] max-h-[70%]"
                >
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => setShowNutrition(false)}
                      className="items-end"
                    >
                      <AntDesign name="close" size={30} color={"#64748b"} />
                    </TouchableOpacity>
                    <View className="items-center">
                      <Text className="font-SpaceMono text-lg text-center">
                        Nutritional Values for {recipe.title} recipe
                      </Text>
                    </View>

                    <DataTable className="w-max">
                      <DataTable.Header>
                        <DataTable.Title className="justify-center">
                          <Text>Nutrient</Text>
                        </DataTable.Title>
                        <DataTable.Title className="justify-center">
                          Amount
                        </DataTable.Title>
                        <DataTable.Title className="justify-center">
                          % of daily needs
                        </DataTable.Title>
                      </DataTable.Header>

                      {recipe.nutrition.nutrients &&
                        recipe.nutrition.nutrients.map((nutrient, index) => (
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
                                {nutrient.percentOfDailyNeeds}
                              </Text>
                            </DataTable.Cell>
                          </DataTable.Row>
                        ))}
                    </DataTable>
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Ingredients list */}
            {recipe.extendedIngredients?.map((ingredient, index: number) => (
              <View key={index} className="relative">
                <View
                  className="absolute bg-[#64E6A6] rounded-2xl right-0.5 bottom-0.5"
                  style={{
                    width: screenWidth - 45,
                    minHeight: 90,
                    ...styles.shadow,
                  }}
                ></View>
                <View
                  key={index}
                  className="flex flex-row justify-between items-center bg-white rounded-2xl m-2 p-2"
                  style={{
                    width: screenWidth - 40,
                    minHeight: 100,
                  }}
                >
                  <View className="flex flex-row justify-center items-center mx-2">
                    {/* w-[260] */}

                    <TouchableOpacity
                      onPress={() => {
                        handleIngredientClick(ingredient.id);
                      }}
                    >
                      {ingredient.image ? (
                        <Image
                          source={{
                            uri: constructImageUrl(ingredient.image),
                          }}
                          className="w-14 h-14"
                        />
                      ) : (
                        <Image
                          source={require("../../assets/images/missingIng.png")}
                          className="w-14 h-14"
                        />
                      )}
                    </TouchableOpacity>

                    <View className="flex justify-center">
                      <View className="flex items-center mx-2 flex-wrap max-w-[190]">
                        <Text className="font-SpaceMono text-[16px]">
                          {ingredient.originalName.charAt(0).toUpperCase() +
                            ingredient.originalName.slice(1)}
                        </Text>
                      </View>
                      {activeIngredientId === ingredient.id && (
                        <View>
                          {ingredientSubstitutes.length > 0 ? (
                            ingredientSubstitutes.map((substitute, index) => (
                              <Text
                                key={index}
                                className="flex items-center mx-2 flex-wrap max-w-[190] font-SpaceMono text-[15px]"
                              >
                                {substitute}
                              </Text>
                            ))
                          ) : (
                            <Text className="flex items-center mx-2 flex-wrap max-w-[190] font-SpaceMono text-[15px]">
                              No substitutes found
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex flex-row justify-center items-center mx-2">
                    <View className="flex justify-center items-center">
                      <Text className="font-SpaceMono text-[17px]">
                        {unitSystem === "metric"
                          ? parseFloat(
                              (
                                ingredient.measures.us.amount *
                                (servings / recipe.servings)
                              ).toFixed(2)
                            )
                          : parseFloat(
                              (
                                ingredient.measures.metric.amount *
                                (servings / recipe.servings)
                              ).toFixed(2)
                            )}
                      </Text>
                      <Text className="font-SpaceMono text-[14px]">
                        {unitSystem === "metric"
                          ? ingredient.measures.us.unitShort
                          : ingredient.measures.metric.unitShort}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        fetchIngredientSubstitution(ingredient.id);
                        if (activeIngredientId === ingredient.id) {
                          setActiveIngredientId(null);
                        } else {
                          setActiveIngredientId(ingredient.id);
                        }
                      }}
                    >
                      <Image
                        source={require("../../assets/images/foodSubs1.png")}
                        className="w-7 h-16 ml-1"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Nutrition per Ingredient */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={ingredientModalVisible}
              onRequestClose={() => {
                setIngredientModalVisible(false);
              }}
            >
              <View className="flex-1 justify-center items-center bg-black/50">
                <View
                  style={styles.shadow}
                  className="bg-slate-300 rounded-2xl p-2 w-[80%] max-h-[70%]"
                >
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => setIngredientModalVisible(false)}
                      className="items-end"
                    >
                      <AntDesign name="close" size={30} color={"#64748b"} />
                    </TouchableOpacity>

                    {selectedIngredientNutrition && (
                      <View>
                        <View>
                          <Text className="font-SpaceMono text-[20px] text-center">
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

                        <DataTable className="w-max">
                          <DataTable.Header>
                            <DataTable.Title className="justify-center">
                              <Text>Nutrient</Text>
                            </DataTable.Title>
                            <DataTable.Title className="justify-center">
                              Amount
                            </DataTable.Title>
                            <DataTable.Title className="justify-center">
                              % of daily needs
                            </DataTable.Title>
                          </DataTable.Header>

                          {selectedIngredientNutrition.nutrients.map(
                            (nutrient, index) => (
                              <DataTable.Row
                                key={index}
                                style={
                                  index % 2 === 0
                                    ? { backgroundColor: "#f1f5f9" }
                                    : { backgroundColor: "#e2e8f0" }
                                }
                              >
                                <DataTable.Cell className="justify-center">
                                  <Text
                                    numberOfLines={2}
                                    className="text-center"
                                  >
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
                                    {nutrient.percentOfDailyNeeds}
                                  </Text>
                                </DataTable.Cell>
                              </DataTable.Row>
                            )
                          )}
                        </DataTable>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <TouchableOpacity
              onPress={() => {
                setShowWinePairing(!showWinePairing);
                // fetchWineDescription(recipe.winePairing.pairedWines);
              }}
              className="flex justify-center items-center m-2"
              style={styles.shadow}
            >
              <View className="flex justify-center items-center">
                <Text className="text-[80px]">🍷</Text>
                <Text className="font-SpaceMono text-[20px] text-[#7a1b0e] text-center">
                  Wine Pairing
                </Text>
              </View>
            </TouchableOpacity>

            {showWinePairing &&
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
                          (wine, index: number) => (
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
                              {/* <Text className="text-md">{wineDescription[wine]}</Text> */}
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

            {showWinePairing &&
              (!recipe.winePairing.pairedWines ||
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

            {/* Box behind instructions */}
            <View className="relative mb-5">
              <View
                className="absolute bg-[#FF5045] rounded-2xl -right-0 -bottom-0"
                style={{
                  width: screenWidth - 45,
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
                    (instruction, index: number) => (
                      <View
                        key={index}
                        className="flex justify-between items-center rounded-2xl m-2 p-3 border"
                        style={{
                          width: screenWidth - 70,
                        }}
                      >
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
                        <Text
                          className="text-justify p-1 mx-2"
                          style={{
                            fontFamily: "SpaceMono",
                            fontSize: 15,
                          }}
                        >
                          {instruction.step}
                        </Text>
                        {/* {instruction.equipment &&
                          instruction.equipment.map((equipment, index) => (
                            <View key={index}>
                              <Text>Equipment needed: {equipment.name}</Text>
                            </View>
                          ))} */}
                      </View>
                    )
                  )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    elevation: 8,
  },
});
