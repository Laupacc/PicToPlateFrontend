import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { Modal } from "react-native-paper";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToFavouriteRecipes,
  removeFromFavouriteRecipes,
} from "@/store/recipes";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import { fetchRandomRecipe } from "@/apiFunctions";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import RNPickerSelect from "react-native-picker-select";
import { useToast } from "react-native-toast-notifications";
import { List } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

export default function Search() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [trivia, setTrivia] = useState("");
  const [showTrivia, setShowTrivia] = useState(false);
  const [recipe, setRecipe] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [numberOfRecipes, setNumberOfRecipes] = useState(10);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [recipesFromIngredients, setRecipesFromIngredients] = useState<any[]>(
    []
  );
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [maxReadyTime, setMaxReadyTime] = useState<number | null>(null);
  const [diet, setDiet] = useState([]);
  const [intolerances, setIntolerances] = useState([]);
  const [showMaxReadyTime, setShowMaxReadyTime] = useState(false);
  const [showDiet, setShowDiet] = useState(false);
  const [showIntolerances, setShowIntolerances] = useState(false);

  const [selectedDiet, setSelectedDiet] = useState([]);
  const [selectedIntolerance, setSelectedIntolerance] = useState([]);
  const [selectedMaxReadyTime, setSelectedMaxReadyTime] = useState(null);

  const isInitialMount = useRef(true);
  const [showFilters, setShowFilters] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  const [ingredientName, setIngredientName] = useState("");
  const [sourceAmount, setSourceAmount] = useState("");
  const [sourceUnit, setSourceUnit] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [showConversion, setShowConversion] = useState(false);
  const [showConversionResult, setShowConversionResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userInfo, setUserInfo] = useState({});

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const BACKEND_URL = "http://192.168.1.34:3000";

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

  // Fetch Trivia useEffect
  const fetchTrivia = async () => {
    const response = await fetch(`${BACKEND_URL}/recipes/trivia`);
    const data = await response.json();
    console.log(data);
    setTrivia(data.text);
  };

  const handleFetchRandomRecipe = async () => {
    const recipe = await fetchRandomRecipe();
    setRecipe(recipe);
    navigation.navigate("recipeCard", { recipeId: recipe.id });
  };

  // Search for recipes by ingredients
  const complexSearchByIngredients = async (
    search,
    diet,
    intolerances,
    maxReadyTime,
    number,
    offset = 0
  ) => {
    if (!search.trim()) return;

    const ingredients = search
      .toLowerCase()
      .replace(/\band\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .join(",");
    let URL = `${BACKEND_URL}/recipes/complexSearchByIngredients?ingredients=${ingredients}&number=${number}&offset=${offset}`;
    if (diet.length > 0) {
      const dietParam = diet.join(",");
      URL += `&diet=${dietParam}`;
    }
    if (intolerances.length > 0) {
      const intolerancesParam = intolerances.join(",");
      URL += `&intolerances=${intolerancesParam}`;
    }
    if (maxReadyTime) {
      URL += `&maxReadyTime=${maxReadyTime}`;
    }
    try {
      const response = await fetch(URL);
      console.log(URL);
      console.log(response);
      const recipe = await response.json();

      if (offset === 0) {
        setRecipesFromIngredients(recipe.results);
      } else {
        setRecipesFromIngredients((prevRecipes) => [
          ...prevRecipes,
          ...recipe.results,
        ]);
      }

      setSearch(search);
      setDiet(diet);
      setIntolerances(intolerances);
      setMaxReadyTime(maxReadyTime);
      setSearchPerformed(true);
      setNumberOfRecipes(number + offset);

      if (recipe.totalResults && recipe.totalResults > number + offset) {
        setHasMoreResults(true);
      } else {
        setHasMoreResults(false);
      }
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
          type: "danger",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="close-circle" size={24} color="white" />,
        });
      }

      dispatch(addToFavouriteRecipes(recipe));
      setIsFavourite((prev) => ({ ...prev, [recipeId]: true }));

      console.log("Recipe added to favourites:", recipe.id);
      toast.show("Recipe added to favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error(error);
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
      dispatch(removeFromFavouriteRecipes(recipe));
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

  // Unit Converter
  const convertAmount = async (
    ingredientName,
    sourceAmount,
    sourceUnit,
    targetUnit
  ) => {
    const URL = `${BACKEND_URL}/recipes/convertAmount?ingredientName=${ingredientName}&sourceAmount=${sourceAmount}&sourceUnit=${sourceUnit}&targetUnit=${targetUnit}`;
    try {
      if (
        ingredientName === "" ||
        sourceAmount === "" ||
        sourceUnit === "" ||
        targetUnit === ""
      ) {
        setErrorMessage("Please fill in all fields");
        return;
      }

      const response = await fetch(URL);
      const data = await response.json();
      console.log(data);
      setErrorMessage("");
      setIngredientName(ingredientName);
      setSourceAmount(sourceAmount);
      setSourceUnit(sourceUnit);
      setTargetUnit(targetUnit);
      setConvertedAmount(data.answer);
    } catch (error) {
      console.error("Error converting amount:", error);
    }
  };

  const toggleDiet = (item: string) => {
    if (diet.includes(item)) {
      setSelectedDiet(selectedDiet.filter((x) => x !== item));
    }
    if (!diet.includes(item)) {
      setSelectedDiet([...selectedDiet, item]);
    }
  };

  const toggleIntolerances = (item: string) => {
    if (intolerances.includes(item)) {
      setSelectedIntolerance(selectedIntolerance.filter((x) => x !== item));
    }
    if (!intolerances.includes(item)) {
      setSelectedIntolerance([...selectedIntolerance, item]);
    }
  };

  const toggleMaxReadyTime = (time: number) => {
    if (maxReadyTime === time) {
      setSelectedMaxReadyTime(null);
    } else {
      setSelectedMaxReadyTime(time);
    }
  };

  const handleOkPress = () => {
    setDiet(selectedDiet);
    setIntolerances(selectedIntolerance);
    setMaxReadyTime(selectedMaxReadyTime);
    setOpenFilterModal(false);
  };

  const handleResetFilters = () => {
    setSelectedDiet([]);
    setSelectedIntolerance([]);
    setSelectedMaxReadyTime(null);
  };

  const handleClearSearch = () => {
    setSearch("");
    setDiet([]);
    setIntolerances([]);
    setMaxReadyTime(null);
    complexSearchByIngredients("", [], [], null, 0);
  };

  const randomRecipeIcon = () => {
    const icons = [
      require("../../assets/images/recipeMissing/recipe7.png"),
      require("../../assets/images/recipeMissing/recipe8.png"),
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const dietOptions = [
    { key: "vegetarian", label: "Vegetarian" },
    { key: "vegan", label: "Vegan" },
    { key: "glutenfree", label: "Gluten Free" },
    { key: "ketogenic", label: "Ketogenic" },
    { key: "pescetarian", label: "Pescetarian" },
    { key: "paleo", label: "Paleo" },
    { key: "primal", label: "Primal" },
    { key: "whole30", label: "Whole 30" },
    { key: "lactoVegetarian", label: "Lacto Vegetarian" },
    { key: "ovoVegetarian", label: "Ovo Vegetarian" },
    { key: "lowFodmap", label: "Low Fodmap" },
  ];

  const intolerancesOptions = [
    { key: "dairy", label: "Dairy" },
    { key: "egg", label: "Egg" },
    { key: "gluten", label: "Gluten" },
    { key: "grain", label: "Grain" },
    { key: "peanut", label: "Peanut" },
    { key: "seafood", label: "Seafood" },
    { key: "sesame", label: "Sesame" },
    { key: "shellfish", label: "Shellfish" },
    { key: "soy", label: "Soy" },
    { key: "sulfite", label: "Sulfite" },
    { key: "treeNut", label: "Tree Nut" },
    { key: "wheat", label: "Wheat" },
  ];

  const maxReadyTimeOptions = [15, 30, 45, 60, 90, 120, 150, 180];

  const conversionAmounts = [
    { label: "g", value: "g" },
    { label: "kg", value: "kg" },
    { label: "oz", value: "oz" },
    { label: "lb", value: "lb" },
    { label: "tsp", value: "tsp" },
    { label: "tbsp", value: "tbsp" },
    { label: "cup", value: "cup" },
    { label: "ml", value: "ml" },
    { label: "l", value: "l" },
  ];

  // Search for recipes on initial load based on user's preferences
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      complexSearchByIngredients(
        search,
        diet,
        intolerances,
        maxReadyTime,
        10, // always request 10 recipes per call
        0 // reset offset on initial load
      );
    }
  }, [diet, intolerances, maxReadyTime]);

  // Load more recipes on scroll button click
  const loadMoreRecipes = () => {
    complexSearchByIngredients(
      search,
      diet,
      intolerances,
      maxReadyTime,
      10, // always request 10 more recipes per call
      numberOfRecipes // current number of loaded recipes as offset
    );
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center pb-16">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      <View className="flex justify-center items-center">
        <Image
          source={require("../../assets/images/logo8.png")}
          className="w-60 h-14"
        />
        {/* <View className="w-72 h-[1] bg-slate-400"></View> */}
      </View>

      {/* Three Top Buttons */}
      <View className="flex-row justify-center items-center mb-3">
        {/* Open Trivia Button */}
        <View className="flex-row justify-center items-center mx-1 flex-grow">
          <TouchableOpacity
            onPress={() => {
              setShowTrivia(!showTrivia);
              fetchTrivia();
            }}
            className="flex justify-center items-center m-2 p-3 rounded-lg bg-[#1c79b2]"
            style={styles.shadow}
          >
            <Text className="text-md text-white text-center font-Nobile">
              Trivia
            </Text>
          </TouchableOpacity>

          {/* Unit Converter Button */}
          <TouchableOpacity
            onPress={() => {
              setShowConversion(!showConversion);
              setShowFilters(false);
              setShowDiet(false);
              setShowIntolerances(false);
              setShowMaxReadyTime(false);
            }}
            className="flex justify-center items-center m-2 p-3 rounded-lg bg-[#1c79b2]"
            style={styles.shadow}
          >
            <Text className="text-md text-white text-center font-Nobile">
              Unit Converter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Radom Recipe Button */}
        <View
          className="flex justify-between items-center right-8"
          style={styles.shadow}
        >
          <View className="flex justify-center items-center">
            <TouchableOpacity
              onPress={handleFetchRandomRecipe}
              className="flex flex-row justify-center items-center"
            >
              <BouncingImage>
                <View className="relative w-16 h-16 flex justify-center items-center">
                  <Image
                    source={require("../../assets/images/randomButton.png")}
                    className="absolute inset-0 w-full h-full"
                  />
                  <Image
                    source={require("../../assets/images/dice5.png")}
                    className="w-6 h-6 bottom-2"
                  />
                </View>
              </BouncingImage>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Show Unit Converter */}
      {showConversion && (
        <View>
          <View className="flex justify-center items-center mb-6 p-5 bg-slate-200 rounded-lg border border-slate-400">
            <View className="flex flex-row justify-center items-center m-2">
              <TextInput
                placeholder="Ingredient"
                placeholderTextColor={"gray"}
                value={ingredientName}
                onChangeText={setIngredientName}
                className="border-2 border-gray-400 rounded-lg w-40 h-10 mx-2 text-center"
              />
              <TextInput
                placeholder="Amount"
                placeholderTextColor={"gray"}
                value={sourceAmount}
                onChangeText={setSourceAmount}
                className="border-2 border-gray-400 rounded-lg w-20 h-10 mx-2 text-center"
              />
            </View>
            <View className="flex flex-row justify-center items-center m-2">
              <RNPickerSelect
                onValueChange={(value) => setSourceUnit(value)}
                items={conversionAmounts}
                style={pickerSelectStyles}
                value={sourceUnit}
                useNativeAndroidPickerStyle={false}
                placeholder={{ label: "Unit", value: null }}
                Icon={() => {
                  return (
                    <Ionicons name="chevron-down" size={24} color="gray" />
                  );
                }}
              />
              <RNPickerSelect
                onValueChange={(value) => setTargetUnit(value)}
                items={conversionAmounts}
                style={pickerSelectStyles}
                value={targetUnit}
                useNativeAndroidPickerStyle={false}
                placeholder={{ label: "Unit", value: null }}
                Icon={() => {
                  return (
                    <Ionicons name="chevron-down" size={24} color="gray" />
                  );
                }}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                convertAmount(
                  ingredientName,
                  sourceAmount,
                  sourceUnit,
                  targetUnit
                );
                setShowConversionResult(true);
              }}
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
                setIngredientName("");
                setSourceAmount("");
                setSourceUnit("");
                setTargetUnit("");
                setConvertedAmount("");
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

            {errorMessage !== "" && (
              <View className="flex justify-center items-center mt-4">
                <Text className="text-center font-Nobile text-red-500 text-[16px]">
                  {errorMessage}
                </Text>
              </View>
            )}
          </View>
          {showConversionResult && !errorMessage && (
            <View className="relative mb-6">
              <View
                className="absolute bg-[#64E6A6] rounded-2xl -right-1 -bottom-1 w-[350px] h-[50px]"
                style={styles.shadow}
              ></View>
              <View className="flex justify-center items-center bg-white rounded-2xl w-[350px] h-[50px]">
                <Text className="text-center font-Nobile text-[16px] text-[#475569]">
                  {convertedAmount !== "" && `${convertedAmount}`}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Search bar and filter button*/}
      <View className="flex flex-row justify-center items-center mb-2">
        {/* Search bar */}
        <View className="flex justify-center items-center mx-3">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="relative items-center w-full justify-center">
              <TextInput
                placeholder="Search by ingredients"
                placeholderTextColor={"gray"}
                value={search}
                onChangeText={(text) => setSearch(text)}
                onSubmitEditing={() =>
                  search.trim() &&
                  complexSearchByIngredients(
                    search,
                    diet,
                    intolerances,
                    maxReadyTime,
                    numberOfRecipes
                  )
                }
                className="border border-gray-400 rounded-lg pl-4 w-64 h-10 bg-[#e2e8f0] font-Nobile"
              />
              <TouchableOpacity
                onPress={() => handleClearSearch()}
                className="absolute right-2.5 top-2 -translate-y-3.125"
              >
                <Image
                  source={require("@/assets/images/redCross.png")}
                  alt="clear"
                  className="w-6 h-6"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() =>
                search.trim() &&
                complexSearchByIngredients(
                  search,
                  diet,
                  intolerances,
                  maxReadyTime,
                  numberOfRecipes
                )
              }
              className="absolute right-11 top-2 -translate-y-3.125"
            >
              <Image
                source={require("@/assets/images/search2.png")}
                alt="search"
                className="w-6 h-6"
              />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>

        {/* Filter Button */}
        <View className="flex flex-row justify-center items-center">
          <TouchableOpacity
            onPress={() => setOpenFilterModal(!openFilterModal)}
            className="flex justify-center items-center relative mx-2"
            style={styles.shadow}
          >
            <Image
              source={require("@/assets/images/filter5.png")}
              alt="button"
              className="w-10 h-10"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recipe Results */}
      <ScrollView className="flex-1 m-2">
        {recipesFromIngredients &&
          recipesFromIngredients.length > 0 &&
          recipesFromIngredients.map((recipe) => (
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
                onPress={() =>
                  isFavourite[recipe.id]
                    ? removeRecipeFromFavourites(recipe.id)
                    : addRecipeToFavourites(recipe.id)
                }
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
                    navigation.navigate("recipeCard", { recipeId: recipe.id })
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

        {/* Load more recipes button */}
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

        {/* No recipes found */}
        {searchPerformed && recipesFromIngredients.length === 0 && (
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
        )}

        {/* No search performed yet */}
        {!searchPerformed && (
          <View className="flex items-center justify-center relative mt-4">
            <View
              className="absolute bg-[#FFBA00] rounded-2xl right-2 bottom-2 w-[300] h-[420]"
              style={styles.shadow}
            ></View>
            <View className="bg-white w-[300] h-[420] m-4 items-center justify-center rounded-2xl">
              <Text className="font-Flux text-[18px] text-[#475569] text-center mx-6 my-4">
                Use your available ingredients to unlock amazing recipe ideas!
              </Text>
              <Image source={randomRecipeIcon()} className="w-60 h-60" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Trivia Modal */}
      <Modal visible={showTrivia} onDismiss={() => setShowTrivia(false)}>
        <View className="flex justify-center items-center">
          <View className="flex justify-center items-center bg-slate-100 rounded-lg p-3 w-[80%]">
            <View>
              <TouchableOpacity
                onPress={() => setShowTrivia(false)}
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
              <Text className="text-center font-Nobile text-lg text-[#475569] m-8 mb-10">
                {trivia}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={openFilterModal}
        onDismiss={() => setOpenFilterModal(false)}
      >
        {/* Filters */}
        <View className="flex justify-center items-center">
          <View className="bg-slate-100 rounded-2xl p-12">
            <TouchableOpacity
              onPress={() => setOpenFilterModal(false)}
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
                <Text className="text-center font-Nobile ml-4 text-slate-800">
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
                <Text className="text-center font-Nobile ml-4 text-slate-800">
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
                <Text className="text-center font-Nobile ml-4 text-slate-800">
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
                onPress={handleOkPress}
                className="flex justify-center items-center my-4"
                style={styles.shadow}
              >
                <Text className="text-2xl font-Nobile text-slate-800">OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetFilters}
                className="absolute -bottom-10"
                style={styles.shadow}
              >
                <Text className="text-base font-Nobile text-slate-800">
                  Reset Options
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
