import {
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Badge } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { useNavigation } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Entypo } from "@expo/vector-icons";
import {
  dietOptions,
  intolerancesOptions,
  conversionUnits,
  maxReadyTimeOptions,
  cuisines,
} from "../../_dataSets.json";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import SpeechToText from "@/components/SpeechToText";
import { RootState } from "@/store/store";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
} from "@/store/recipes";
import {
  BACKEND_URL,
  fetchRandomRecipe,
  addRecipeToFavourites,
  removeRecipeFromFavourites,
  goToRecipeCard,
} from "@/_recipeUtils";

export default function Search() {
  const convert = require("convert-units");
  const navigation = useNavigation<any>();
  const toast = useToast();
  const route = useRoute();
  const dispatch = useDispatch();
  const transcription = route.params
    ? (route.params as { transcription: string }).transcription
    : "";
  const similarRecipes = route.params as { data: any[] };

  const user = useSelector((state: RootState) => state.user.value);
  const favourites = useSelector(
    (state: RootState) => state.recipes.favourites
  );

  const [trivia, setTrivia] = useState<string>("");
  const [showTrivia, setShowTrivia] = useState<boolean>(false);
  const [triviaLoading, setTriviaLoading] = useState<boolean>(false);

  const [randomRecipe, setRandomRecipe] = useState<any[]>([]);
  const [lastRecipeOpened, setLastRecipeOpened] = useState<any>(null);
  const [recentlyViewedRecipes, setRecentlyViewedRecipes] = useState<any[]>([]);
  const [showHome, setShowHome] = useState<boolean>(true);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [randomStickers, setRandomStickers] = useState<any[]>([]);

  const [search, setSearch] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>("");
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const [hasMoreResults, setHasMoreResults] = useState<boolean>(false);
  const [numberOfRecipes, setNumberOfRecipes] = useState<number>(10);
  const [individualSearchMode, setIndividualSearchMode] =
    useState<boolean>(false);
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [exhaustedIngredients, setExhaustedIngredients] = useState<Set<any>>(
    new Set()
  );
  const [loadedRecipeIds, setLoadedRecipeIds] = useState<Set<number>>(
    new Set<number>()
  );
  const [recipesFromIngredients, setRecipesFromIngredients] = useState<any[]>(
    []
  );
  const [userFavourites, setUserFavourites] = useState<any[]>([]);
  const [isFavourite, setIsFavourite] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Filter Modal States
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

  // Unit Converter States
  const [unitAmount, setUnitAmount] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [showConversion, setShowConversion] = useState<boolean>(false);
  const [showConversionResult, setShowConversionResult] =
    useState<boolean>(false);
  const [lastConvertedAmount, setLastConvertedAmount] = useState<string>("");
  const [lastFromUnit, setLastFromUnit] = useState<string>("");
  const [lastToUnit, setLastToUnit] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const calculatedHeight = screenWidth * (9 / 16);
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

  // Fetch recently viewed recipes when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchRecentlyViewedRecipes = async () => {
        try {
          const recentlyViewed = await AsyncStorage.getItem(
            "recentlyViewedRecipes"
          );
          if (recentlyViewed) {
            setRecentlyViewedRecipes(JSON.parse(recentlyViewed));
            console.log("Fetched recently viewed recipes");
          } else {
            console.log("No recently viewed recipes found.");
          }
        } catch (error: any) {
          console.error(
            "Error fetching recently viewed recipes:",
            error.message
          );
        }
      };

      fetchRecentlyViewedRecipes();
    }, [])
  );

  // Fetch Random Recipe
  const handleFetchRandomRecipe = async () => {
    try {
      const recipe = await fetchRandomRecipe();
      setRandomRecipe(recipe);
      setLastRecipeOpened(recipe.id);

      // Check if recipe exists in the database
      const response = await fetch(
        `${BACKEND_URL}/users/fetchRecipe/${recipe.id}`
      );
      if (response.status === 404) {
        navigation.navigate("recipeCard", { recipeId: recipe.id });
      } else {
        const existingRecipe = await response.json();
        navigation.navigate("recipeCard", { passedRecipe: existingRecipe });
      }
    } catch (error: any) {
      console.error("Error handling fetch random recipe:", error.message);
    }
  };

  // Fetch favourites from user
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

  // Search for recipes by ingredients
  const complexSearchByIngredients = async (
    search = "",
    diet: string[] = [],
    intolerances: string[] = [],
    maxReadyTime: number | null = null,
    number = 10,
    offset = 0,
    isIndividualSearchMode = false,
    usedIngredientsParam: string[] = [],
    exhaustedIngredientsParam = new Set(),
    loadedRecipeIds = new Set(),
    cuisine = ""
  ) => {
    if (!search.trim() && !cuisine) {
      toast.show("Please enter an ingredient", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }

    if (search.trim() && cuisine) {
      cuisine = "";
      setCuisine("");
    }

    let ingredients = "";
    if (search.trim()) {
      ingredients = search
        .toLowerCase()
        .replace(/\band\b/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .join(",");
    }

    let URL = `${BACKEND_URL}/recipes/complexSearchByIngredientsOrCuisine?number=${number}&offset=${offset}`;

    // Add ingredients to the URL if provided
    if (ingredients) {
      URL += `&ingredients=${ingredients}`;
    }

    // Add cuisine to the URL if provided
    if (cuisine) {
      const cuisineType = cuisine.toLowerCase().trim();
      URL += `&cuisine=${encodeURIComponent(cuisineType)}`;
    }

    if (diet.length > 0) URL += `&diet=${diet.join(",")}`;
    if (intolerances.length > 0)
      URL += `&intolerances=${intolerances.join(",")}`;
    if (maxReadyTime) URL += `&maxReadyTime=${maxReadyTime}`;

    try {
      // Clear previous search results if offset is 0 (new search)
      if (offset === 0) {
        setRecipesFromIngredients([]);
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

        const recipe = await response.json();
        console.log("Search results:", recipe.totalResults);

        results = recipe.results;
        totalResults = recipe.totalResults;

        // Filter out already loaded recipes so no duplicates are shown
        results = results.filter((recipe) => !loadedRecipeIds.has(recipe.id));
        // Add the new recipes to the loaded recipes
        results.forEach((recipe) => loadedRecipeIds.add(recipe.id));

        // If no results found, switch to individual search mode
        if (results.length === 0) {
          isIndividualSearchMode = true;
          console.log(
            "No results found. Searching for each ingredient individually"
          );
          setIndividualSearchMode(true);
          usedIngredientsParam = ingredients.split(",");
          setUsedIngredients(usedIngredientsParam);
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
          let individualURL = `${BACKEND_URL}/recipes/complexSearchByIngredientsOrCuisine?ingredients=${ingredient}&number=${number}&offset=${offset}`;
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
          // Add the new recipes to the loaded recipes
          filteredResults.forEach((recipe: { id: number }) =>
            loadedRecipeIds.add(recipe.id)
          );
          // Add the new recipes to the loaded recipes
          setLoadedRecipeIds(
            (prevIds) =>
              new Set([
                ...prevIds,
                ...filteredResults.map((recipe: { id: number }) => recipe.id),
              ])
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
      const updatedRecipes =
        offset === 0 ? results : recipesFromIngredients.concat(results);
      setRecipesFromIngredients(updatedRecipes);

      // Check if there are more results to load
      setHasMoreResults(totalResults > number + offset);

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

      // Update the states
      setSearch(search);
      setDiet(diet);
      setIntolerances(intolerances);
      setMaxReadyTime(maxReadyTime);
      setSearchPerformed(true);
      setNumberOfRecipes(number + offset);
      setShowSearch(true);
      setShowHome(false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.show("Error fetching recipes", {
        type: "warning",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
    }
  };

  // Transcribe speech to text and search for recipes
  useEffect(() => {
    if (transcription && transcription !== "No transcription results found") {
      const formatedTranscription = transcription
        .toLowerCase()
        .replace(/\band\b/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .join(",");

      if (formatedTranscription) {
        complexSearchByIngredients(
          formatedTranscription,
          diet,
          intolerances,
          maxReadyTime,
          10,
          0,
          false,
          [],
          new Set(),
          new Set(),
          ""
        );
      }
    }
  }, [transcription]);

  // Display similar recipes
  useEffect(() => {
    if (similarRecipes && similarRecipes.data && similarRecipes.data.length) {
      setRecipesFromIngredients(similarRecipes.data);
      setSearchPerformed(true);
      setShowSearch(true);
      setShowHome(false);
    }
  }, [similarRecipes]);

  // Construct image URL for similar recipes
  const constructImageUrl = (recipe: any) => {
    const imageUrl =
      recipe.id &&
      recipe.imageType &&
      `https://img.spoonacular.com/recipes/${recipe.id}-556x370.${recipe.imageType}`;
    return imageUrl;
  };

  // Load more recipes based on the current search mode
  const loadMoreRecipes = () => {
    complexSearchByIngredients(
      search,
      diet,
      intolerances,
      maxReadyTime,
      10,
      numberOfRecipes,
      individualSearchMode,
      usedIngredients,
      exhaustedIngredients,
      loadedRecipeIds,
      cuisine
    );
  };

  // Go to recipe card
  const handleGoToRecipeCard = async (recipeId: any) => {
    const fromScreen = "search";
    await goToRecipeCard(recipeId, navigation, fromScreen);
    setLastRecipeOpened(recipeId);
  };

  // Go to last recipe opened
  const handleGoToLastRecipeOpened = () => {
    if (lastRecipeOpened) {
      goToRecipeCard(lastRecipeOpened, navigation, "search");
    } else {
      toast.show("No recipe viewed yet", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
    }
  };

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

  // Helper function to convert units
  const convertUnits = () => {
    if (isNaN(Number(unitAmount.replace(",", ".")))) {
      setErrorMessage("Please enter a valid number");
      return;
    }

    const unitAmountNumber = parseFloat(unitAmount.replace(",", "."));

    if (!unitAmount || fromUnit === "" || toUnit === "") {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setErrorMessage("");

    // If the units are the same, no need to convert
    if (fromUnit === toUnit) {
      setConvertedAmount(unitAmountNumber);
      setLastConvertedAmount(unitAmount);
      setLastFromUnit(fromUnit);
      setLastToUnit(toUnit);
      setShowConversionResult(true);
      return;
    }

    const fromUnitMeasure = convert().describe(fromUnit).measure;
    const toUnitMeasure = convert().describe(toUnit).measure;

    if (fromUnitMeasure !== toUnitMeasure) {
      setErrorMessage(
        `Cannot convert incompatible measures of ${fromUnitMeasure} and ${toUnitMeasure}`
      );
      setShowConversionResult(false);
      return;
    }

    const convertedValue = convert(unitAmountNumber).from(fromUnit).to(toUnit);
    setConvertedAmount(convertedValue);
    setLastConvertedAmount(unitAmount);
    setLastFromUnit(fromUnit);
    setLastToUnit(toUnit);
    setShowConversionResult(true);
    setErrorMessage("");
  };

  // Trigger Search on Filter Toggle
  const triggerSearchWithFilters = () => {
    if (!search.trim() && !cuisine.trim()) {
      return;
    }
    complexSearchByIngredients(
      search,
      selectedDiet,
      selectedIntolerance,
      selectedMaxReadyTime,
      10,
      0,
      individualSearchMode,
      usedIngredients,
      exhaustedIngredients,
      loadedRecipeIds,
      cuisine
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

  // Fetch Trivia
  const fetchTrivia = async () => {
    setTriviaLoading(true);
    const response = await fetch(`${BACKEND_URL}/recipes/trivia`);
    const data = await response.json();
    console.log(data);
    setTrivia(data.text);
    setTriviaLoading(false);
  };

  // Cusiines images
  const imageForCuisine = (cuisine: string) => {
    const cuisineImages = {
      African: require("../../assets/images/cuisines/african.jpg"),
      Asian: require("../../assets/images/cuisines/asian.jpg"),
      American: require("../../assets/images/cuisines/american.jpg"),
      British: require("../../assets/images/cuisines/british.jpg"),
      Cajun: require("../../assets/images/cuisines/cajun.jpg"),
      Caribbean: require("../../assets/images/cuisines/caribbean.jpg"),
      Chinese: require("../../assets/images/cuisines/chinese.jpg"),
      "Eastern European": require("../../assets/images/cuisines/easterneuropean.jpg"),
      European: require("../../assets/images/cuisines/european.jpg"),
      French: require("../../assets/images/cuisines/french.jpg"),
      German: require("../../assets/images/cuisines/german.jpg"),
      Greek: require("../../assets/images/cuisines/greek.jpg"),
      Indian: require("../../assets/images/cuisines/indian.jpg"),
      Irish: require("../../assets/images/cuisines/irish.jpg"),
      Italian: require("../../assets/images/cuisines/italian.jpg"),
      Japanese: require("../../assets/images/cuisines/japanese.jpg"),
      Jewish: require("../../assets/images/cuisines/jewish.jpg"),
      Korean: require("../../assets/images/cuisines/korean.jpg"),
      "Latin American": require("../../assets/images/cuisines/latinamerican.jpg"),
      Mediterranean: require("../../assets/images/cuisines/mediterranean.jpg"),
      Mexican: require("../../assets/images/cuisines/mexican.jpg"),
      "Middle Eastern": require("../../assets/images/cuisines/middleeastern.jpg"),
      Nordic: require("../../assets/images/cuisines/nordic.jpg"),
      Southern: require("../../assets/images/cuisines/southern.jpg"),
      Spanish: require("../../assets/images/cuisines/spanish.jpg"),
      Thai: require("../../assets/images/cuisines/thai.jpg"),
      Vietnamese: require("../../assets/images/cuisines/vietnamese.jpg"),
    };
    return cuisineImages[cuisine as keyof typeof cuisineImages];
  };

  // Function to get random sticker images
  const setRandomStickerImages = (count: number) => {
    const images = [
      require("../../assets/images/stickers/stickerWhite1.png"),
      require("../../assets/images/stickers/stickerWhite2.png"),
      require("../../assets/images/stickers/stickerWhite3.png"),
      require("../../assets/images/stickers/stickerWhite4.png"),
    ];

    const stickers = Array.from(
      { length: count },
      () => images[Math.floor(Math.random() * images.length)]
    );

    setRandomStickers(stickers);
  };

  // Set random sticker images
  useEffect(() => {
    if (cuisines.length > 0) {
      setRandomStickerImages(cuisines.length);
    }
  }, [cuisines]);

  // Set random cuisine type
  useEffect(() => {
    const randomCuisineTypes = cuisines.sort(() => Math.random() - 0.5);
    setCuisine(randomCuisineTypes[0]);
  }, []);

  return (
    <SafeAreaView className="flex-1 items-center justify-center pb-10">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Background cellSize={25} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center">
            {/* Logo */}
            <View className="flex justify-center items-center">
              <Image
                source={require("../../assets/images/logo.png")}
                className="w-60 h-14"
              />
            </View>

            {/* Top Four Buttons */}
            <View className="flex-row justify-center items-center mb-2">
              {/* Radom Recipe Button */}
              <TouchableOpacity
                onPress={handleFetchRandomRecipe}
                className="mx-2"
                style={styles.shadow}
              >
                <BouncingImage>
                  <View className="relative w-16 h-16 flex justify-center items-center">
                    <Image
                      source={require("../../assets/images/randomButton.png")}
                      className="absolute inset-0 w-full h-full"
                    />
                    <Image
                      source={require("../../assets/images/dice.png")}
                      className="w-6 h-6 bottom-2"
                    />
                  </View>
                </BouncingImage>
              </TouchableOpacity>

              {/* Trivia Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowTrivia(!showTrivia);
                  fetchTrivia();
                }}
                className={
                  isSmallScreen
                    ? "flex justify-center items-center mx-2 p-2 rounded-lg bg-[#1c79b2]"
                    : "flex justify-center items-center mx-2 p-3 rounded-lg bg-[#1c79b2]"
                }
                style={styles.shadow}
              >
                <View className="flex flex-row justify-center items-center">
                  <Text
                    className={
                      isSmallScreen
                        ? "text-sm text-white text-center font-Nobile"
                        : "text-md text-white text-center font-Nobile"
                    }
                  >
                    Trivia
                  </Text>
                  <Image
                    source={require("../../assets/images/trivia.png")}
                    className="w-4 h-4 ml-1"
                  />
                </View>
              </TouchableOpacity>

              {/* Unit Converter Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowConversion(!showConversion);
                }}
                className={
                  isSmallScreen
                    ? "flex justify-center items-center mx-2 p-2 rounded-lg bg-[#1c79b2]"
                    : "flex justify-center items-center mx-2 p-3 rounded-lg bg-[#1c79b2]"
                }
                style={styles.shadow}
              >
                <View className="flex flex-row justify-center items-center">
                  <Text
                    className={
                      isSmallScreen
                        ? "text-sm text-white text-center font-Nobile"
                        : "text-md text-white text-center font-Nobile"
                    }
                  >
                    Unit Converter
                  </Text>
                  <Image
                    source={require("../../assets/images/unitConverter.png")}
                    className="w-4 h-4 ml-1"
                  />
                </View>
              </TouchableOpacity>

              {/* Back to Last Recipe button */}
              <TouchableOpacity
                onPress={handleGoToLastRecipeOpened}
                style={styles.shadow}
                className="mx-2"
              >
                <Image
                  source={require("@/assets/images/arrows/yellowArrowRight.png")}
                  alt="button"
                  className={isSmallScreen ? "w-10 h-8" : "w-12 h-10"}
                />
              </TouchableOpacity>
            </View>

            {showConversion && (
              <View>
                <View className="flex justify-center items-center mb-4 py-5 w-[350px] bg-slate-200 rounded-lg border border-slate-400">
                  <View className="flex flex-row justify-center items-center m-2">
                    <TextInput
                      placeholder="Amount"
                      placeholderTextColor={"gray"}
                      value={unitAmount}
                      onChangeText={(value) => setUnitAmount(value)}
                      className="border-2 border-gray-400 rounded-lg w-20 h-10 mx-2 text-center"
                    />

                    <RNPickerSelect
                      onValueChange={(value) => setFromUnit(value)}
                      items={conversionUnits}
                      style={pickerSelectStyles}
                      value={fromUnit}
                      useNativeAndroidPickerStyle={false}
                      placeholder={{ label: "Unit" }}
                      Icon={() => {
                        return (
                          <Ionicons
                            name="chevron-down"
                            size={24}
                            color="gray"
                          />
                        );
                      }}
                    />
                    <Text className="text-lg mx-2">to</Text>
                    <RNPickerSelect
                      onValueChange={(value) => setToUnit(value)}
                      items={conversionUnits}
                      style={pickerSelectStyles}
                      value={toUnit}
                      useNativeAndroidPickerStyle={false}
                      placeholder={{ label: "Unit" }}
                      Icon={() => {
                        return (
                          <Ionicons
                            name="chevron-down"
                            size={24}
                            color="gray"
                          />
                        );
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={convertUnits}
                    className="flex justify-center items-center relative my-2"
                    style={styles.shadow}
                  >
                    <Image
                      source={require("@/assets/images/button/button1.png")}
                      alt="button"
                      className="w-36 h-12"
                    />
                    <Text className="text-lg text-white absolute text-center font-Nobile">
                      Convert
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setUnitAmount("");
                      setFromUnit("");
                      setToUnit("");
                      setConvertedAmount(0);
                      setShowConversionResult(false);
                      setErrorMessage("");
                    }}
                    className="flex justify-center items-center relative mx-2"
                    style={styles.shadow}
                  >
                    <Image
                      source={require("@/assets/images/button/button11.png")}
                      alt="button"
                      className="w-28 h-10"
                    />
                    <Text className="text-lg text-white absolute text-center font-Nobile">
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Show Error Message */}
                {errorMessage !== "" && (
                  <View className="relative mb-6">
                    <View
                      className="absolute bg-[#64E6A6] rounded-2xl -right-1 -bottom-1 w-[350] h-20"
                      style={styles.shadow}
                    ></View>
                    <View className="flex justify-center items-center bg-white rounded-2xl w-[350] h-20">
                      <Text className="text-center font-Nobile text-red-500 text-lg w-72">
                        {errorMessage}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Show Conversion Result */}
                {showConversionResult && !errorMessage && (
                  <View className="relative mb-6">
                    <View
                      className="absolute bg-[#64E6A6] rounded-2xl -right-1 -bottom-1 w-[350] h-20"
                      style={styles.shadow}
                    ></View>
                    <View className="flex justify-center items-center bg-white rounded-2xl w-[350] h-20">
                      <Text className="text-center font-Nobile text-xl text-slate-600">
                        {`${lastConvertedAmount.replace(
                          ",",
                          "."
                        )} ${lastFromUnit} = ${
                          Number.isInteger(convertedAmount)
                            ? convertedAmount
                            : convertedAmount?.toFixed(3)
                        } ${lastToUnit}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Search Bar, Search Button, Filter Button */}
            <View className="flex flex-row justify-center items-center mb-1">
              {/* Filter Button */}
              <View className="flex flex-row justify-center items-center mx-2">
                <TouchableOpacity
                  onPress={() => setOpenFilterModal(!openFilterModal)}
                  className="flex justify-center items-center relative"
                  style={styles.shadow}
                >
                  <Image
                    source={require("@/assets/images/filter.png")}
                    alt="button"
                    className={isSmallScreen ? "w-9 h-9" : "w-10 h-10"}
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

              {/* Search Bar */}
              <View className="flex justify-center items-center mx-1">
                <View className="relative items-center w-full justify-center">
                  <TextInput
                    placeholder="Search by ingredient"
                    placeholderTextColor={"gray"}
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                    onSubmitEditing={() =>
                      complexSearchByIngredients(
                        search,
                        diet,
                        intolerances,
                        maxReadyTime,
                        numberOfRecipes
                      )
                    }
                    className="border border-gray-400 rounded-lg pl-4 w-56 h-10 bg-[#e2e8f0] font-Nobile"
                  />
                  <TouchableOpacity
                    onPress={() => setSearch("")}
                    className="absolute right-2.5 top-2 -translate-y-3.125"
                  >
                    <Image
                      source={require("@/assets/images/redCross.png")}
                      alt="clear"
                      className="w-6 h-6"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Button */}
              <View
                className="flex justify-center items-center relative"
                style={styles.shadow}
              >
                <TouchableOpacity
                  onPress={() =>
                    complexSearchByIngredients(
                      search,
                      diet,
                      intolerances,
                      maxReadyTime,
                      numberOfRecipes
                    )
                  }
                >
                  <Image
                    source={require("@/assets/images/search.png")}
                    alt="search"
                    className={isSmallScreen ? "w-8 h-8 mx-2" : "w-9 h-9 mx-2"}
                  />
                </TouchableOpacity>
              </View>

              {/* Microphone icon */}
              <SpeechToText targetScreen="search" />
            </View>

            {/* Home and Search Buttons */}
            {searchPerformed && (
              <View className="flex flex-row justify-center items-center mt-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowHome(true);
                    setShowSearch(false);
                  }}
                  className="flex justify-center items-center mx-3 border border-gray-500 rounded-lg px-14 py-1 bg-slate-100"
                  style={styles.shadow}
                >
                  <Text className="text-center font-Nobile text-base text-slate-700">
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowSearch(true);
                    setShowHome(false);
                  }}
                  className="flex justify-center items-center mx-3 border border-gray-500 rounded-lg px-14 py-1 bg-slate-100"
                  style={styles.shadow}
                >
                  <Text className="text-center font-Nobile text-base text-slate-700">
                    Results
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Home Screen with Categories and Recent Recipes */}
            <ScrollView className="flex-1">
              {showHome && (
                <View>
                  {/* Categories */}
                  <View>
                    <Text className="font-NobileBold text-lg text-slate-700 mt-4 ml-6">
                      Categories
                    </Text>
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row items-center justify-center relative mb-1 mx-4">
                        {cuisines.map((cuisine, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setCuisine(cuisine);
                              complexSearchByIngredients(
                                "",
                                [],
                                [],
                                null,
                                10,
                                0,
                                false,
                                [],
                                new Set(),
                                new Set(),
                                cuisine
                              );
                            }}
                            className="flex justify-between items-center"
                            style={styles.shadow}
                          >
                            <View
                              className={
                                isSmallScreen
                                  ? "absolute bg-[#FFBA00] rounded-2xl right-3 top-5 w-28 h-28"
                                  : "absolute bg-[#FFBA00] rounded-2xl right-3 top-5 w-32 h-32"
                              }
                              style={styles.shadow}
                            ></View>
                            <View className="m-4 items-center justify-center rounded-2xl">
                              <Image
                                source={imageForCuisine(cuisine)}
                                className={
                                  isSmallScreen
                                    ? "w-28 h-28 rounded-2xl"
                                    : "w-32 h-32 rounded-2xl"
                                }
                              />
                            </View>
                            <View
                              className={
                                isSmallScreen
                                  ? "flex justify-center items-center w-32 h-8 relative"
                                  : "flex justify-center items-center w-36 h-10 relative"
                              }
                            >
                              <Image
                                source={randomStickers[index]}
                                className="absolute inset-0 w-full h-full"
                              />
                              <Text
                                className={
                                  isSmallScreen
                                    ? "text-xs text-center font-NobileBold text-slate-700"
                                    : "text-md text-center font-NobileBold text-slate-700"
                                }
                              >
                                {cuisine}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Recent Recipes */}
                  {recentlyViewedRecipes?.length ? (
                    <View>
                      <Text className="font-NobileBold text-lg text-slate-700 mt-4 ml-6">
                        Recent recipes
                      </Text>
                      <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                          marginLeft: 10,
                          paddingBottom: 30,
                        }}
                      >
                        {recentlyViewedRecipes?.length > 0 &&
                          recentlyViewedRecipes.map((recipe: any) => (
                            <View
                              className="flex-1 items-center justify-center relative rounded-2xl w-[220] h-[270] my-1"
                              key={recipe.id}
                            >
                              <Image
                                source={require("../../assets/images/recipeBack/recipeBack4.png")}
                                className="absolute inset-0 w-full h-full"
                                style={styles.shadow}
                              />
                              {user.token && (
                                <TouchableOpacity
                                  className="absolute top-10 right-3"
                                  onPress={() =>
                                    isFavourite[recipe.id]
                                      ? handleRemoveFromFavourites(recipe.id)
                                      : handleAddToFavourites(recipe.id)
                                  }
                                >
                                  <Image
                                    source={
                                      isFavourite[recipe.id]
                                        ? require("../../assets/images/heartFull.png")
                                        : require("../../assets/images/heartEmpty.png")
                                    }
                                    className="w-5 h-5"
                                  />
                                </TouchableOpacity>
                              )}

                              <View className="flex items-center justify-start h-full">
                                <TouchableOpacity
                                  onPress={() =>
                                    handleGoToRecipeCard(recipe.id)
                                  }
                                  key={recipe.id}
                                  className="flex items-center justify-center"
                                >
                                  {/* Fixed Image */}
                                  <View className="w-[115px] h-[115px]">
                                    <Image
                                      source={
                                        recipe.image
                                          ? { uri: recipe.image }
                                          : require("../../assets/images/picMissing.png")
                                      }
                                      className="rounded-xl w-full h-full top-12 right-2"
                                      onError={() => {
                                        setRecentlyViewedRecipes(
                                          (prev: any) => ({
                                            ...prev,
                                            image: null,
                                          })
                                        );
                                      }}
                                    />
                                  </View>

                                  {/* Title */}
                                  <View className="flex items-center justify-center top-14 right-2">
                                    <Text className="font-Flux text-center max-w-[140px] text-xs">
                                      {recipe.title.length > 23
                                        ? recipe.title.substring(0, 23) + "..."
                                        : recipe.title}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </View>

                              {/* Details */}
                              <View className="justify-center items-center absolute bottom-6 ">
                                <Image
                                  source={require("../../assets/images/timer.png")}
                                  className="w-5 h-5"
                                />
                                <Text className="text-xs">
                                  {recipe.readyInMinutes} mins
                                </Text>
                              </View>
                            </View>
                          ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <View className="flex flex-col items-center justify-center pb-10">
                      <View className="w-full items-start">
                        <Text className="font-NobileBold text-lg text-slate-700 mt-4 ml-6">
                          Recent recipes
                        </Text>
                      </View>
                      <View className="flex items-center justify-center relative rounded-2xl w-[220] h-[270] my-1">
                        <Image
                          source={require("../../assets/images/recipeBack/recipeBack4.png")}
                          className="absolute inset-0 w-full h-full"
                          style={styles.shadow}
                        />
                        <Text className="font-CreamyCookies text-center text-3xl max-w-[100]">
                          No recent recipes viewed
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Search Results */}
              {showSearch &&
                recipesFromIngredients?.length > 0 &&
                recipesFromIngredients.map((recipe) => (
                  <View
                    className="flex-1 items-center justify-center relative rounded-2xl w-[360] h-[460] mb-2 mt-3"
                    key={recipe.id}
                  >
                    <Image
                      source={require("../../assets/images/recipeBack/recipeBack4.png")}
                      className="absolute inset-0 w-full h-full"
                      style={styles.shadow}
                    />
                    {user.token && (
                      <TouchableOpacity
                        className="absolute top-20 right-4"
                        onPress={() =>
                          isFavourite[recipe.id]
                            ? handleRemoveFromFavourites(recipe.id)
                            : handleAddToFavourites(recipe.id)
                        }
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
                    )}

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
                                : recipe.sourceUrl
                                ? { uri: constructImageUrl(recipe) }
                                : require("../../assets/images/picMissing.png")
                            }
                            defaultSource={require("../../assets/images/picMissing.png")}
                            className="rounded-xl w-full h-full top-12 right-4"
                            onError={() => {
                              setRecipesFromIngredients((prevRecipes) =>
                                prevRecipes.map((r) =>
                                  r.id === recipe.id ? { ...r, image: null } : r
                                )
                              );
                            }}
                          />
                        </View>

                        {/* Title */}
                        <View className="flex items-center justify-center top-16 right-4">
                          <Text className="font-Flux text-center max-w-[200px]">
                            {recipe.title.length > 60
                              ? recipe.title.substring(0, 60) + "..."
                              : recipe.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Details */}
                    <View className="flex justify-center items-center absolute bottom-12">
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

              {/* Load more recipes button */}
              {showSearch && hasMoreResults && (
                <View className="flex justify-center items-center mb-14">
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

              {/* No recipes found */}
              {showSearch &&
                searchPerformed &&
                recipesFromIngredients?.length === 0 && (
                  <View className="flex items-center justify-center relative rounded-2xl w-[360] h-[460] mt-10">
                    <Image
                      source={require("../../assets/images/recipeBack/recipeBack4.png")}
                      className="absolute inset-0 w-full h-full"
                      style={styles.shadow}
                    />
                    <View className="flex items-center justify-center max-w-[190]">
                      <Text className="font-CreamyCookies text-center text-3xl">
                        No recipes were found with this combination of
                        ingredients of filters
                      </Text>
                    </View>
                  </View>
                )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Trivia Modal */}
      <Modal
        visible={showTrivia}
        onDismiss={() => {
          setShowTrivia(false);
          setTrivia("");
        }}
      >
        <View className="flex justify-center items-center">
          <View
            className={
              triviaLoading
                ? "bg-slate-100 rounded-lg p-3 w-[80%]"
                : "flex justify-center items-center bg-slate-100 rounded-lg p-3 w-[80%]"
            }
          >
            <View>
              <TouchableOpacity
                onPress={() => {
                  setShowTrivia(false);
                  setTrivia("");
                }}
                className="items-end"
              >
                <Image
                  source={require("../../assets/images/cross.png")}
                  className="w-6 h-6"
                />
              </TouchableOpacity>

              <Text className="text-center font-Nobile text-2xl text-[#475569]">
                Did you know?
              </Text>
              {triviaLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#475569"
                  className="my-10"
                />
              ) : (
                <Text className="text-center font-Nobile text-lg text-[#475569] m-8 mb-10">
                  {trivia}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

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
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputAndroid: {
    color: "black",
    fontFamily: "Nobile",
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    paddingRight: 40,
    marginHorizontal: 10,
  },
  inputIOS: {
    color: "black",
    fontFamily: "Nobile",
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    paddingRight: 40,
    marginHorizontal: 10,
  },
  iconContainer: {
    position: "absolute",
    top: 10,
    right: 12,
  },
});
