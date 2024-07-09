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
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
  updateFavouriteRecipes,
} from "@/store/recipes";

export default function RecipeCard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
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

  const BACKEND_URL = "http://192.168.201.158:3000";

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

  // `https://spoonacular.com/cdn/ingredients_100x100/${imageFileName}`

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
      }

      const data = await response.json();
      console.log(data);
      dispatch(addToFavouriteRecipes(recipe));
      setIsFavourite(true);
      alert("Recipe added to favourites");
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
        console.log("Error removing recipe from favourites");
      }

      const data = await response.json();
      console.log(data);
      dispatch(removeFromFavouriteRecipes(recipe));
      setIsFavourite(false);
      alert("Recipe removed from favourites");
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
          <View style={styles.innerContainer}>
            {/* Recipe Image and box behind  */}
            <View className="relative">
              <View
                style={{
                  position: "absolute",
                  backgroundColor: "#B5A8FF",
                  right: -8,
                  bottom: -8,
                  width: screenWidth,
                  height: calculatedHeight,
                  borderRadius: Math.min(screenWidth, calculatedHeight) / 2,
                  overflow: "hidden",
                  borderBottomRightRadius: 130,
                  borderTopRightRadius: 130,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 2,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 8,
                }}
              ></View>
              <View
                style={{
                  width: Math.min(screenWidth, calculatedHeight),
                  height: Math.min(screenWidth, calculatedHeight),
                  borderRadius: Math.min(screenWidth, calculatedHeight) / 2,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={
                    recipe.image
                      ? { uri: recipe.image }
                      : randomMissingMainImage()
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </View>
            </View>

            {/* Back Button and Random Recipe Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-5 left-5"
            >
              <Ionicons name="arrow-undo-sharp" size={30} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFetchRandomRecipe}
              className="absolute top-5 right-5"
            >
              <FontAwesome name="random" size={30} />
            </TouchableOpacity>

            {/* Favourite Button */}
            {user.token && (
              <TouchableOpacity
                onPress={
                  isFavourite
                    ? removeRecipeFromFavourites
                    : addRecipeToFavourites
                }
                className="absolute top-5 right-14"
              >
                <Ionicons
                  name={isFavourite ? "heart" : "heart-outline"}
                  size={30}
                  color={"#ba0000"}
                />
              </TouchableOpacity>
            )}

            {/* Recipe Title */}
            <Text style={styles.title}>{recipe.title}</Text>

            {/* Recipe Attributes */}
            <ScrollView>
              <View className="flex flex-row m-1 flex-wrap justify-center items-center">
                {recipe.veryHealthy && (
                  <Text style={styles.attributes}>Very Healthy</Text>
                )}
                {recipe.cheap && <Text style={styles.attributes}>Cheap</Text>}
                {recipe.veryPopular && (
                  <Text style={styles.attributes}>Very Popular</Text>
                )}
                {recipe.sustainable && (
                  <Text style={styles.attributes}>Sustainable</Text>
                )}
                {recipe.veryHealthy && (
                  <Text style={styles.attributes}>Very Healthy</Text>
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

            {/* Switch , time and servings */}
            <View>
              <View className="flex flex-row justify-around items-center m-2">
                <View className="flex flex-row justify-center items-center mr-4">
                  <Text
                    style={{
                      fontFamily: "SpaceMono",
                      fontSize: 15,
                      marginRight: 2,
                    }}
                  >
                    US
                  </Text>
                  <Switch
                    value={unitSystem === "us"}
                    onValueChange={(value) =>
                      setUnitSystem(value ? "us" : "metric")
                    }
                    trackColor={{ false: "#ffb600", true: "#ffb600" }}
                    thumbColor={"#f94a00"}
                  ></Switch>
                  <Text
                    style={{
                      fontFamily: "SpaceMono",
                      fontSize: 15,
                      marginLeft: 2,
                    }}
                  >
                    Metric
                  </Text>
                </View>
                <View className="flex justify-center items-center">
                  <Ionicons name="timer" size={40} color={"#149575"} />
                  <Text
                    style={{
                      fontFamily: "SpaceMono",
                      fontSize: 15,
                    }}
                  >
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
                    <Text
                      style={{
                        fontFamily: "SpaceMono",
                        fontSize: 15,
                        marginHorizontal: 5,
                      }}
                    >
                      {servings}
                    </Text>
                    <TouchableOpacity onPress={incrementServings}>
                      <Ionicons name="add-circle" size={40} color={"#149575"} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      fontFamily: "SpaceMono",
                      fontSize: 15,
                    }}
                  >
                    Servings
                  </Text>
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
              >
                <View className="flex justify-center items-center">
                  <Text style={{ fontSize: 40 }}>🍏</Text>
                  <Text
                    style={{
                      fontFamily: "SpaceMono",
                      fontSize: 18,
                      color: "#7a1b0e",
                      textAlign: "center",
                    }}
                  >
                    Nutritional Values
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Nutrition Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={showNutrition}
              onRequestClose={() => {
                setShowNutrition(false);
              }}
            >
              <View className="flex-1 justify-center items-center">
                <View
                  style={{
                    width: "80%",
                    maxHeight: "70%",
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 2,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 8,
                    borderRadius: 20,
                    marginHorizontal: "10%",
                  }}
                  className="bg-slate-300 rounded-2xl p-2"
                >
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => setShowNutrition(false)}
                      className="items-end"
                    >
                      <AntDesign name="close" size={30} color={"#64748b"} />
                    </TouchableOpacity>
                    <View className="items-center">
                      <Text
                        style={{
                          fontFamily: "SpaceMono",
                          fontSize: 18,
                          textAlign: "center",
                        }}
                      >
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
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 2,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 6,
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
                        <Text
                          style={{
                            fontFamily: "SpaceMono",
                            fontSize: 16,
                          }}
                        >
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
                                className="flex items-center mx-2 flex-wrap max-w-[190]"
                                style={{
                                  fontFamily: "SpaceMono",
                                  fontSize: 15,
                                }}
                              >
                                {substitute}
                              </Text>
                            ))
                          ) : (
                            <Text
                              className="flex items-center mx-2 flex-wrap max-w-[190]"
                              style={{
                                fontFamily: "SpaceMono",
                                fontSize: 15,
                              }}
                            >
                              No substitutes found
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex flex-row justify-center items-center mx-2">
                    <View className="flex justify-center items-center">
                      <Text
                        style={{
                          fontFamily: "SpaceMono",
                          fontSize: 17,
                        }}
                      >
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
                      <Text
                        style={{
                          fontFamily: "SpaceMono",
                          fontSize: 14,
                        }}
                      >
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
              animationType="slide"
              transparent={true}
              visible={ingredientModalVisible}
              onRequestClose={() => {
                setIngredientModalVisible(false);
              }}
            >
              <View className="flex-1 justify-center items-center">
                <View
                  style={{
                    width: "80%",
                    maxHeight: "70%",
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 2,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 8,
                    borderRadius: 20,
                    marginHorizontal: "10%",
                  }}
                  className="bg-slate-300 rounded-2xl p-2"
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
                          <Text
                            style={{
                              fontFamily: "SpaceMono",
                              fontSize: 20,
                              textAlign: "center",
                            }}
                          >
                            Nutritional Values for{" "}
                            {selectedIngredientNutrition.amount}{" "}
                            {selectedIngredientNutrition.unit}
                          </Text>
                          <Text
                            style={{
                              fontFamily: "SpaceMono",
                              fontSize: 18,
                              textAlign: "center",
                            }}
                          >
                            of{" "}
                            {selectedIngredientNutrition.name
                              .charAt(0)
                              .toUpperCase() +
                              selectedIngredientNutrition.name.slice(1)}
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
            >
              <View className="flex justify-center items-center">
                <Text style={{ fontSize: 80 }}>🍷</Text>
                <Text
                  style={{
                    fontFamily: "SpaceMono",
                    fontSize: 20,
                    color: "#7a1b0e",
                    textAlign: "center",
                  }}
                >
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
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 6,
                        height: 6,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 8,
                      width: screenWidth - 40,
                      height: dynamicHeightWine,
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
                                style={{
                                  fontFamily: "Nobile",
                                  transform: [{ rotate: "-90deg" }],
                                  shadowColor: "#000",
                                  shadowOffset: {
                                    width: 6,
                                    height: 6,
                                  },
                                  shadowOpacity: 0.25,
                                  shadowRadius: 4,
                                  elevation: 8,
                                }}
                                className="text-2xl text-center text-red-600 w-48 top-10"
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
                    <Text
                      className="text-lg my-2 mx-3 text-center"
                      style={{ fontFamily: "SpaceMono" }}
                    >
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
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 6,
                        height: 6,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 8,
                      width: screenWidth - 40,
                      height: 100,
                    }}
                  ></View>
                  <View
                    className="flex justify-center items-center bg-slate-300 rounded-2xl m-2 p-2"
                    style={{
                      width: screenWidth - 40,
                      height: 100,
                    }}
                  >
                    <Text
                      className="text-lg m-2 text-center"
                      style={{ fontFamily: "SpaceMono" }}
                    >
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
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 2,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 6,
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
                          style={{
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                          }}
                        >
                          <Image
                            source={randomPostitImage()}
                            className="absolute inset-0 w-full h-full"
                          />
                          <Text
                            style={{
                              fontFamily: "SpaceMono",
                              fontSize: 15,
                            }}
                            className="text-center"
                          >
                            Step {instruction.number}
                          </Text>
                        </View>
                        {/* <View className="flex flex-row justify-center items-center m-1 flex-wrap">
                          {instruction.ingredients &&
                            instruction.ingredients.map((ingredient, index) => (
                              <View key={index}>
                                {ingredient.image && (
                                  <Image
                                    source={{ uri: ingredient.image }}
                                    className="w-10 h-10 rounded-2xl m-1"
                                  />
                                )}
                              </View>
                            ))}
                        </View> */}
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  attributes: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    textAlign: "center",
    backgroundColor: "#F4C653",
    borderRadius: 10,
    padding: 5,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Flux",
    textAlign: "center",
    padding: 5,
    marginTop: 20,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
});
