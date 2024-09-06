import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Modal, Badge } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import { useDispatch, useSelector } from "react-redux";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import { Entypo } from "@expo/vector-icons";
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
import {
  dietOptions,
  intolerancesOptions,
  maxReadyTimeOptions,
} from "../../_dataSets.json";

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

  const [openFilterModal, setOpenFilterModal] = useState<boolean>(false);
  const [maxReadyTime, setMaxReadyTime] = useState<number | null>(null);
  const [diet, setDiet] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [showMaxReadyTime, setShowMaxReadyTime] = useState<boolean>(false);
  const [showDiet, setShowDiet] = useState<boolean>(false);
  const [showIntolerances, setShowIntolerances] = useState<boolean>(false);
  const [selectedDiet, setSelectedDiet] = useState<string[]>([]);
  const [selectedIntolerance, setSelectedIntolerance] = useState<string[]>([]);
  const [selectedMaxReadyTime, setSelectedMaxReadyTime] = useState<
    number | null
  >(null);
  const [individualSearchMode, setIndividualSearchMode] =
    useState<boolean>(false);
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [exhaustedIngredients, setExhaustedIngredients] = useState<Set<any>>(
    new Set()
  );
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

  // Set status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
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

  // Search for recipes using fridge ingredients
  const searchRecipesFromFridge = async (
    searchQuery = "",
    diet: string[] = [],
    intolerances: string[] = [],
    maxReadyTime: number | null = null,
    numberOfRecipes = 10,
    offset = 0,
    exhaustedIngredientsParam = new Set(),
    loadedRecipeIds = new Set(),
    isIndividualSearchMode = false,
    usedIngredientsParam: string[] = []
  ) => {
    if (!searchQuery) {
      return;
    }

    // handleResetFilters();

    if (offset === 0) {
      setLoading(true);
    }

    const ingredients = searchQuery
      .toLowerCase()
      .replace(/\band\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .join(",");

    let URL = `${BACKEND_URL}/recipes/complexSearchByIngredientsOrCuisine?ingredients=${ingredients}&number=${numberOfRecipes}&offset=${offset}`;
    if (diet.length > 0) URL += `&diet=${diet.join(",")}`;
    if (intolerances.length > 0)
      URL += `&intolerances=${intolerances.join(",")}`;
    if (maxReadyTime) URL += `&maxReadyTime=${maxReadyTime}`;

    try {
      // Clear previous search results if offset is 0 (new search)
      if (offset === 0) {
        setRecipes([]);
        exhaustedIngredientsParam.clear();
        loadedRecipeIds.clear();
        setIndividualSearchMode(false);
      }

      let results: any[] = [];
      let totalResults = 0;

      // Fetch recipes for initial search
      if (!isIndividualSearchMode) {
        const response = await fetch(URL);
        console.log(URL);

        if (!response.ok) {
          throw new Error("Error fetching recipes");
        }

        const data = await response.json();
        console.log("Search results:", data.totalResults);

        results = data.results;
        totalResults = data.totalResults;

        // Filter out already loaded recipes so no duplicates are shown
        results = results.filter((recipe) => !loadedRecipeIds.has(recipe.id));
        // Add new recipes to loaded list
        results.forEach((recipe) => loadedRecipeIds.add(recipe.id));

        // If no results found, switch to individual search mode
        if (results.length === 0) {
          isIndividualSearchMode = true;
          usedIngredientsParam = ingredients.split(",");

          setUsedIngredients(usedIngredientsParam);
          setIndividualSearchMode(true);
          console.log(
            "No results found. Searching for each ingredient individually"
          );
        }
      }

      // Search for each ingredient individually
      if (isIndividualSearchMode) {
        for (const ingredient of usedIngredientsParam) {
          // Skip API call if no more results for this ingredient
          if (exhaustedIngredientsParam.has(ingredient)) {
            console.log(`Skipping ${ingredient} as it has been exhausted`);
            continue;
          }

          // Fetch recipes for each ingredients
          let individualURL = `${BACKEND_URL}/recipes/complexSearchByIngredientsOrCuisine?ingredients=${ingredient}&number=${numberOfRecipes}&offset=${offset}`;
          if (diet.length > 0) individualURL += `&diet=${diet.join(",")}`;
          if (intolerances.length > 0)
            individualURL += `&intolerances=${intolerances.join(",")}`;
          if (maxReadyTime) individualURL += `&maxReadyTime=${maxReadyTime}`;

          const data = await fetch(individualURL);
          console.log(`URL for ${ingredient}: ${individualURL}`);

          if (!data.ok) {
            throw new Error("Error fetching individual ingredient recipes");
          }

          const individualResults = await data.json();
          console.log(
            `Search results for ${ingredient}: ${individualResults.totalResults}`
          );

          // Filter out already loaded recipes so no duplicates are shown
          const filteredResults = individualResults.results.filter(
            (recipe: { id: number }) => !loadedRecipeIds.has(recipe.id)
          );
          // Add new recipes to loaded list
          filteredResults.forEach((recipe: { id: number }) =>
            loadedRecipeIds.add(recipe.id)
          );

          // If no results found for this ingredient, add it to exhausted list
          if (filteredResults.length === 0) {
            exhaustedIngredientsParam.add(ingredient);
            setExhaustedIngredients(new Set(exhaustedIngredientsParam));
          } else {
            results = results.concat(filteredResults);
            totalResults += individualResults.totalResults;
          }
        }
      }

      // If offset is 0, replace the recipes, otherwise append to the existing ones
      setRecipes(offset === 0 ? results : recipes.concat(results));

      // Check if there are more results to load
      setHasMoreResults(totalResults > numberOfRecipes + offset);

      // Check if the recipes are in the user's favourites
      if (userFavourites.length && results.length) {
        const favouriteIdsSet = new Set(
          userFavourites.map((fav) => String(fav.id))
        );
        results = results.map((recipe) => {
          if (favouriteIdsSet.has(String(recipe.id))) {
            setIsFavourite((prev) => ({ ...prev, [recipe.id]: true }));
          }
          return recipe;
        });
      }

      setLoading(false);
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
    }
  };

  // Fetch recipes from fridge screen
  useEffect(() => {
    if (searchQuery) {
      searchRecipesFromFridge(
        searchQuery,
        selectedDiet,
        selectedIntolerance,
        selectedMaxReadyTime,
        numberOfRecipes,
        offset,
        exhaustedIngredients,
        new Set(),
        individualSearchMode,
        usedIngredients
      );
    }
  }, [searchQuery, numberOfRecipes, offset]);

  // Load more recipes
  const loadMoreRecipes = () => {
    setOffset((prevOffset) => prevOffset + numberOfRecipes);
  };

  // Trigger search with filters
  const triggerSearchWithFilters = () => {
    searchRecipesFromFridge(
      searchQuery,
      selectedDiet,
      selectedIntolerance,
      selectedMaxReadyTime,
      10,
      0,
      new Set(exhaustedIngredients),
      new Set(),
      individualSearchMode,
      usedIngredients
    );
  };

  // Toggle Diet Checkbox (multiple can be selected)
  const toggleDiet = (item: string) => {
    if (selectedDiet.includes(item)) {
      setSelectedDiet(selectedDiet.filter((x) => x !== item));
    } else {
      setSelectedDiet([...selectedDiet, item]);
    }
  };

  // Toggle Intolerances Checkbox (multiple can be selected)
  const toggleIntolerances = (item: string) => {
    if (selectedIntolerance.includes(item)) {
      setSelectedIntolerance(selectedIntolerance.filter((x) => x !== item));
    } else {
      setSelectedIntolerance([...selectedIntolerance, item]);
    }
  };

  // Toggle Max Ready Time Checkbox (only one can be selected)
  const toggleMaxReadyTime = (time: number) => {
    if (selectedMaxReadyTime === time) {
      setSelectedMaxReadyTime(null);
    } else {
      setSelectedMaxReadyTime(time);
    }
  };

  // Handle Ok Press in Filter Modal to apply filters
  const handleOkPress = () => {
    setDiet(selectedDiet);
    setIntolerances(selectedIntolerance);
    setMaxReadyTime(selectedMaxReadyTime);
    triggerSearchWithFilters();
  };

  // Reset Filters back to default
  const handleResetFilters = () => {
    setSelectedDiet([]);
    setSelectedIntolerance([]);
    setSelectedMaxReadyTime(null);
  };

  // Close Filter Modal and options
  const handleCloseFilterModal = () => {
    setOpenFilterModal(false);
    setShowDiet(false);
    setShowIntolerances(false);
    setShowMaxReadyTime(false);
  };

  // Add recipe to favourites list
  const handleAddToFavourites = async (recipeId: number) => {
    setIsFavourite((prev) => ({ ...prev, [recipeId]: true }));
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
    setIsFavourite((prev) => ({ ...prev, [recipeId]: false }));
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

  // Go to recipe card
  const handleGoToRecipeCard = async (recipeId: number) => {
    const fromScreen = "recipesFromFridge";
    await goToRecipeCard(recipeId, navigation, fromScreen);
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Background cellSize={25} />

      {/* Arrow, Title, Filter */}
      <View className="flex-row justify-between items-center">
        {/* Go Back Arrow */}
        <TouchableOpacity
          onPress={() => navigation.navigate("fridge")}
          className=" flex-1 items-start ml-8"
        >
          <Image
            source={require("../../assets/images/arrows/yellowArrowLeft.png")}
            className="w-12 h-10"
          />
        </TouchableOpacity>

        {/* Title */}
        <View
          className="flex justify-center items-center relative m-2 w-[220] h-[60]"
          style={styles.shadow}
        >
          <Image
            source={require("../../assets/images/stickers/blueTape.png")}
            className="absolute inset-0 w-full h-full"
          />
          <Text className="font-Flux text-xl text-center text-white">
            Recipes
          </Text>
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          onPress={() => setOpenFilterModal(!openFilterModal)}
          className="flex-1 items-end mr-8"
        >
          <Image
            source={require("../../assets/images/filter.png")}
            alt="button"
            className="w-10 h-10"
          />
          <Badge
            visible={
              selectedDiet.length > 0 ||
              selectedIntolerance.length > 0 ||
              selectedMaxReadyTime !== null
            }
            size={20}
            style={{
              backgroundColor: "#ef4444",
              position: "absolute",
              top: -6,
              right: -6,
            }}
          >
            +
          </Badge>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#237CB0" className="flex-1" />
      ) : (
        <View className="flex flex-1 items-center justify-center">
          {/* Display message if no recipes found */}
          {recipes.length === 0 ? (
            <View className="flex items-center justify-center relative rounded-2xl w-[360] h-[460]">
              <Image
                source={require("../../assets/images/recipeBack/recipeBack4.png")}
                className="absolute inset-0 w-full h-full"
                style={styles.shadow}
              />
              <View className="flex items-center justify-center max-w-[190]">
                <Text className="font-CreamyCookies text-center text-3xl">
                  No recipes were found with this combination of ingredients of
                  filters
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView>
              {/* Display recipes */}
              {recipes?.length > 0 &&
                recipes.map((recipe) => (
                  <View
                    className="flex-1 items-center justify-center relative w-[360] h-[460]"
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
                            ? require("../../assets/images/heartFull.png")
                            : require("../../assets/images/heartEmpty.png")
                        }
                        className="w-8 h-8"
                      />
                    </TouchableOpacity>

                    <View className="flex items-center justify-start h-full pt-8">
                      <TouchableOpacity
                        onPress={() => handleGoToRecipeCard(recipe.id)}
                        key={recipe.id}
                        className="flex items-center justify-center"
                      >
                        {/* Fixed Image */}
                        <View className="w-[200px] h-[200px]">
                          <Image
                            source={
                              recipe.image
                                ? { uri: recipe.image }
                                : require("../../assets/images/picMissing.png")
                            }
                            className="rounded-xl w-full h-full top-12 right-4"
                            onError={() => {
                              setRecipes((prev: any) => {
                                const updatedRecipes = prev.map((r: any) =>
                                  r.id === recipe.id ? { ...r, image: null } : r
                                );
                                return updatedRecipes;
                              });
                            }}
                          />
                        </View>

                        {/* Title */}
                        <View className="flex items-center justify-center top-16 right-4">
                          <Text className="font-Flux text-center max-w-[200px]">
                            {recipe.title.length > 65
                              ? recipe.title.substring(0, 65) + "..."
                              : recipe.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Details */}
                    <View className="flex-row justify-center items-center absolute bottom-12">
                      <Image
                        source={require("../../assets/images/timer.png")}
                        className="w-8 h-8"
                      />
                      <Text className="text-md">
                        {recipe.readyInMinutes} mins
                      </Text>
                    </View>
                  </View>
                ))}

              {/* Load more button */}
              {hasMoreResults && (
                <View className="flex justify-center items-center mb-8">
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

      {/* Filter Modal */}
      <Modal
        visible={openFilterModal}
        onDismiss={() => {
          handleCloseFilterModal();
        }}
      >
        {/* Filters */}
        <View className="flex justify-center items-center">
          <View className="bg-slate-100 rounded-2xl p-12 mb-16">
            <TouchableOpacity
              onPress={() => {
                handleCloseFilterModal();
              }}
              className="absolute top-2 right-2 p-1"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <View className="flex justify-center items-center">
              {/* Diet Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowDiet(!showDiet);
                  setShowIntolerances(false);
                  setShowMaxReadyTime(false);
                }}
                className="flex-row justify-between items-center my-2 p-2 bg-[#64E6A6] rounded-lg w-44"
                style={styles.shadow}
              >
                <Badge
                  visible={selectedDiet.length > 0}
                  size={20}
                  style={{
                    backgroundColor: "#33a069",
                    position: "absolute",
                    top: -6,
                    right: -6,
                  }}
                >
                  {selectedDiet.length}
                </Badge>
                <Image
                  source={require("../../assets/images/diets.png")}
                  className="w-6 h-6"
                />
                <Text className="text-base font-Nobile text-slate-800">
                  Diet
                </Text>
                <Entypo name="chevron-down" size={24} color="#1e293b" />
              </TouchableOpacity>

              {/* Diet Options */}
              {showDiet && (
                <View className="relative mb-3">
                  <View
                    className="absolute bg-[#64E6A6] rounded-lg -right-2 -bottom-2 w-[180] h-[330]"
                    style={styles.shadow}
                  ></View>
                  <View className="bg-white w-[185] p-2 rounded-lg">
                    {dietOptions.map((option) => (
                      <View
                        key={option.key}
                        className="flex-row m-0.5 ml-2 items-center"
                      >
                        <BouncyCheckbox
                          onPress={() => toggleDiet(option.key)}
                          isChecked={selectedDiet.includes(option.key)}
                          size={25}
                          text={option.label}
                          textStyle={{
                            fontFamily: "Nobile",
                            color: "#58ca91",
                            fontSize: 14,
                            textDecorationLine: "none",
                          }}
                          fillColor={"#58ca91"}
                          unFillColor={"transparent"}
                          innerIconStyle={{
                            borderWidth: 2,
                            borderColor: "#64E6A6",
                          }}
                          bounceEffectIn={0.6}
                        />
                        <RNBounceable
                          onPress={() => toggleDiet(option.key)}
                        ></RNBounceable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Intolerances Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowIntolerances(!showIntolerances);
                  setShowDiet(false);
                  setShowMaxReadyTime(false);
                }}
                className="flex-row justify-between items-center my-2 bg-[#fa9c55] rounded-lg p-2 w-44"
                style={styles.shadow}
              >
                <Badge
                  visible={selectedIntolerance.length > 0}
                  size={20}
                  style={{
                    backgroundColor: "#e76b0d",
                    position: "absolute",
                    top: -6,
                    right: -6,
                  }}
                >
                  {selectedIntolerance.length}
                </Badge>
                <Image
                  source={require("../../assets/images/intolerances.png")}
                  className="w-6 h-6"
                />
                <Text className="text-base font-Nobile text-slate-800">
                  Intolerances
                </Text>
                <Entypo name="chevron-down" size={24} color="#1e293b" />
              </TouchableOpacity>

              {/* Intolerances Options */}
              {showIntolerances && (
                <View className="relative mb-3">
                  <View
                    className="absolute bg-[#fa9c55] rounded-lg -right-2 -bottom-2 w-[185] h-[360]"
                    style={styles.shadow}
                  ></View>
                  <View className="bg-white w-[185] p-2 rounded-lg">
                    {intolerancesOptions.map((option) => (
                      <View
                        key={option.key}
                        className="flex-row m-0.5 ml-2 items-center"
                      >
                        <BouncyCheckbox
                          onPress={() => toggleIntolerances(option.key)}
                          isChecked={selectedIntolerance.includes(option.key)}
                          size={25}
                          text={option.label}
                          textStyle={{
                            fontFamily: "Nobile",
                            color: "#f38028",
                            fontSize: 14,
                            textDecorationLine: "none",
                          }}
                          fillColor={"#f38028"}
                          unFillColor={"transparent"}
                          innerIconStyle={{
                            borderWidth: 2,
                            borderColor: "#fa9c55",
                          }}
                          bounceEffectIn={0.6}
                        />
                        <RNBounceable
                          onPress={() => toggleIntolerances(option.key)}
                        ></RNBounceable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Max Ready Time Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowMaxReadyTime(!showMaxReadyTime);
                  setShowDiet(false);
                  setShowIntolerances(false);
                }}
                className="flex-row justify-between items-center my-2 bg-[#0cbac7] rounded-lg p-2 w-44"
                style={styles.shadow}
              >
                <Badge
                  visible={selectedMaxReadyTime !== null}
                  size={20}
                  style={{
                    backgroundColor: "#00737c",
                    position: "absolute",
                    top: -6,
                    right: -6,
                  }}
                >
                  1
                </Badge>
                <Image
                  source={require("../../assets/images/timer2.png")}
                  className="w-6 h-6"
                />
                <Text className="text-base font-Nobile text-slate-800">
                  Max Time
                </Text>
                <Entypo name="chevron-down" size={24} color="#1e293b" />
              </TouchableOpacity>

              {/* Max Ready Time Options */}
              {showMaxReadyTime && (
                <View className="relative mb-3">
                  <View
                    className="absolute bg-[#0cbac7] rounded-lg -right-2 -bottom-2 w-[185] h-[240]"
                    style={styles.shadow}
                  ></View>
                  <View className="bg-white w-[185] p-2 rounded-lg">
                    {maxReadyTimeOptions.map((time) => (
                      <View
                        key={time}
                        className="flex-row m-0.5 ml-2 items-center"
                      >
                        <BouncyCheckbox
                          onPress={() => toggleMaxReadyTime(time)}
                          isChecked={selectedMaxReadyTime === time}
                          size={25}
                          text={`${time} mins`}
                          textStyle={{
                            fontFamily: "Nobile",
                            color: "#0098a3",
                            fontSize: 14,
                            textDecorationLine: "none",
                          }}
                          fillColor={"#0098a3"}
                          unFillColor={"transparent"}
                          innerIconStyle={{
                            borderWidth: 2,
                            borderColor: "#0cbac7",
                          }}
                          bounceEffectIn={0.6}
                        />
                        <RNBounceable
                          onPress={() => toggleMaxReadyTime(time)}
                        ></RNBounceable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  handleOkPress();
                  handleCloseFilterModal();
                }}
                className={
                  isSmallScreen
                    ? "flex justify-center items-center"
                    : "flex justify-center items-center my-4"
                }
                style={styles.shadow}
              >
                <Text className="text-2xl font-Nobile text-slate-800">
                  Submit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetFilters}
                className="absolute -bottom-8"
                style={styles.shadow}
              >
                <Text className="text-base font-Nobile text-slate-800">
                  Clear Options
                </Text>
              </TouchableOpacity>
            </View>
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
      width: 6,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
});
