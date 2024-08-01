import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToFavouriteRecipes } from "@/store/recipes";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import { fetchRandomRecipe } from "@/apiFunctions";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import RNPickerSelect from "react-native-picker-select";
import { useToast } from "react-native-toast-notifications";

export default function Search() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);

  const [trivia, setTrivia] = useState("");
  const [joke, setJoke] = useState("");
  const [recipe, setRecipe] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [numberOfRecipes, setNumberOfRecipes] = useState(10);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [recipesFromIngredients, setRecipesFromIngredients] = useState<any[]>(
    []
  );
  const [maxReadyTime, setMaxReadyTime] = useState<number | null>(null);
  const [diet, setDiet] = useState([]);
  const [intolerances, setIntolerances] = useState([]);
  const [showMaxReadyTime, setShowMaxReadyTime] = useState(false);
  const [showDiet, setShowDiet] = useState(false);
  const [showIntolerances, setShowIntolerances] = useState(false);
  const isInitialMount = useRef(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  const [ingredientName, setIngredientName] = useState("");
  const [sourceAmount, setSourceAmount] = useState("");
  const [sourceUnit, setSourceUnit] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [showConversion, setShowConversion] = useState(false);
  const [showConversionResult, setShowConversionResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const BACKEND_URL = "http://192.168.1.34:3000";

  // const fetchTrivia = async () => {
  //   const response = await fetch(`${BACKEND_URL}/recipes/trivia`);
  //   const data = await response.json();
  //   console.log(data);
  //   setTrivia(data.text);
  // };

  // const fetchJoke = async () => {
  //   const response = await fetch(`${BACKEND_URL}/recipes/joke`);
  //   const data = await response.json();
  //   console.log(data);
  //   setJoke(data.text);
  // };

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
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.show("Error fetching recipes", {
        type: "warning",
        placement: "top",
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
          placement: "top",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="close-circle" size={24} color="white" />,
        });
      }

      dispatch(addToFavouriteRecipes(recipe));
      setIsFavourite(true);

      console.log("Recipe added to favourites:", recipe.id);
      toast.show("Recipe added to favourites", {
        type: "success",
        placement: "top",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error(error);
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
      setDiet(diet.filter((x) => x !== item));
    } else {
      setDiet([...diet, item]);
    }
  };

  const toggleIntolerances = (item: string) => {
    if (intolerances.includes(item)) {
      setIntolerances(intolerances.filter((x) => x !== item));
    } else {
      setIntolerances([...intolerances, item]);
    }
  };

  const toggleMaxReadyTime = (time: number) => {
    if (maxReadyTime === time) {
      setMaxReadyTime(null);
    } else {
      setMaxReadyTime(time);
    }
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
        <View className="w-72 h-[1] bg-slate-400"></View>
      </View>

      <Text className="text-center font-Nobile text-lg text-[#475569] my-2">
        Turn your pantry into delicious meals!
      </Text>

      <View className="flex flex-row justify-center items-center mb-2">
        {/* Search bar, by Ingredients */}
        <View className="flex justify-center items-center mx-2">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="relative items-center w-full justify-center">
              <TextInput
                placeholder="Search for recipes"
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
                className="border border-gray-400 rounded-lg pl-4 w-60 h-10 bg-[#e2e8f0] font-Nobile"
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

        {/* Radom Recipe Button */}
        <View
          className="flex justify-center items-center mx-2"
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

      {/* Filters and Conversion Buttons */}
      <View className="flex flex-row justify-center items-center">
        <TouchableOpacity
          onPress={() => {
            setShowFilters(!showFilters);
            setShowConversion(false);
            setShowDiet(false);
            setShowIntolerances(false);
            setShowMaxReadyTime(false);
          }}
          className="flex justify-center items-center relative mx-2"
          style={styles.shadow}
        >
          <Image
            source={require("@/assets/images/button/button9.png")}
            alt="button"
            className="w-40 h-12"
          />
          <Text
            className="text-lg text-white absolute text-center font-Nobile"
            style={styles.shadow}
          >
            Filters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setShowConversion(!showConversion);
            setShowFilters(false);
            setShowDiet(false);
            setShowIntolerances(false);
            setShowMaxReadyTime(false);
          }}
          className="flex justify-center items-center relative mx-2"
          style={styles.shadow}
        >
          <Image
            source={require("@/assets/images/button/button3.png")}
            alt="button"
            className="w-40 h-12"
          />
          <Text
            className="text-lg text-white absolute text-center font-Nobile"
            style={styles.shadow}
          >
            Unit Converter
          </Text>
        </TouchableOpacity>
      </View>

      {showConversion && (
        <View>
          <View className="flex justify-center items-center my-3">
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
              className="flex justify-center items-center relative mx-2"
              style={styles.shadow}
            >
              <Image
                source={require("@/assets/images/button/button1.png")}
                alt="button"
                className="w-36 h-12"
              />
              <Text
                className="text-lg text-white absolute text-center font-Nobile"
                style={styles.shadow}
              >
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
              }}
              className="flex justify-center items-center relative mx-2"
              style={styles.shadow}
            >
              <Image
                source={require("@/assets/images/button/button12.png")}
                alt="button"
                className="w-28 h-10"
              />
              <Text
                className="text-lg text-white absolute text-center font-Nobile"
                style={styles.shadow}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage !== "" && (
            <View className="flex justify-center items-center">
              <Text className="text-center font-Nobile text-red-500 text-[16px]">
                {errorMessage}
              </Text>
            </View>
          )}

          {showConversionResult && !errorMessage && (
            <View className="relative">
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

      {/* Filters */}
      {showFilters && (
        <View className="flex flex-row justify-center items-center my-3">
          <TouchableOpacity
            onPress={() => {
              setShowDiet(!showDiet);
              setShowIntolerances(false);
              setShowMaxReadyTime(false);
            }}
            className="flex justify-center items-center relative w-20 h-10 mx-2"
            style={styles.shadow}
          >
            <Image
              source={require("../../assets/images/stickers/yellowTape2.png")}
              className="absolute inset-0 w-full h-full"
            ></Image>
            <Text className="text-center font-Nobile">Diet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowIntolerances(!showIntolerances);
              setShowDiet(false);
              setShowMaxReadyTime(false);
            }}
            className="flex justify-center items-center relative w-32 h-10 mx-2"
            style={styles.shadow}
          >
            <Image
              source={require("../../assets/images/stickers/yellowTape1.png")}
              className="absolute inset-0 w-full h-full"
            ></Image>
            <Text className="text-center font-Nobile">Intolerances</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowMaxReadyTime(!showMaxReadyTime);
              setShowDiet(false);
              setShowIntolerances(false);
            }}
            className="flex justify-center items-center relative w-28 h-10 mx-2"
            style={styles.shadow}
          >
            <Image
              source={require("../../assets/images/stickers/yellowTape1.png")}
              className="absolute inset-0 w-full h-full"
            />
            <Text className="text-center font-Nobile">Max Time</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Diet and Intolerances Checkbox */}
      <View className="flex flex-row justify-center items-start mb-2">
        {showDiet && (
          <View className="relative mx-3">
            <View
              className="absolute bg-[#64E6A6] rounded-lg -right-2 -bottom-2 w-[200] h-[330]"
              style={styles.shadow}
            ></View>
            <View className="bg-white w-[200] p-2 rounded-lg">
              {dietOptions.map((option) => (
                <View
                  key={option.key}
                  className="flex-row m-0.5 ml-2 items-center"
                >
                  <BouncyCheckbox
                    onPress={() => toggleDiet(option.key)}
                    isChecked={diet.includes(option.key)}
                    size={25}
                    text={option.label}
                    textStyle={{
                      fontFamily: "Nobile",
                      color: "green",
                      fontSize: 14,
                      textDecorationLine: "none",
                    }}
                    fillColor={"green"}
                    unFillColor={"transparent"}
                    innerIconStyle={{ borderWidth: 2, borderColor: "green" }}
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
        {showIntolerances && (
          <View className="relative mx-3">
            <View
              className="absolute bg-[#FF9B50] rounded-lg -right-2 -bottom-2 w-[140] h-[360]"
              style={styles.shadow}
            ></View>
            <View className="bg-white w-[140] p-2 rounded-lg">
              {intolerancesOptions.map((option) => (
                <View
                  key={option.key}
                  className="flex-row m-0.5 ml-2 items-center"
                >
                  <BouncyCheckbox
                    onPress={() => toggleIntolerances(option.key)}
                    isChecked={intolerances.includes(option.key)}
                    size={25}
                    text={option.label}
                    textStyle={{
                      fontFamily: "Nobile",
                      color: "orange",
                      fontSize: 14,
                      textDecorationLine: "none",
                    }}
                    fillColor={"orange"}
                    unFillColor={"transparent"}
                    innerIconStyle={{ borderWidth: 2, borderColor: "orange" }}
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
        {showMaxReadyTime && (
          <View className="relative mx-3">
            <View
              className="absolute bg-[#0098a3] rounded-lg -right-2 -bottom-2 w-[140] h-[240]"
              style={styles.shadow}
            ></View>
            <View className="bg-white w-[140] p-2 rounded-lg">
              {maxReadyTimeOptions.map((time) => (
                <View key={time} className="flex-row m-0.5 ml-2 items-center">
                  <BouncyCheckbox
                    onPress={() => toggleMaxReadyTime(time)}
                    isChecked={maxReadyTime === time}
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
                      borderColor: "#0098a3",
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
      </View>
      <View className="w-72 h-[1] bg-slate-500 mt-3"></View>

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
                onPress={() => addRecipeToFavourites(recipe.id)}
              >
                <Image
                  source={
                    isFavourite
                      ? require("../../assets/images/heart1.png")
                      : require("../../assets/images/heart3.png")
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
                    source={{ uri: recipe.image }}
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
        {recipesFromIngredients.length > 0 && (
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

      {/* Modal for Joke */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={joke !== ""}
        onRequestClose={() => {
          setJoke("");
        }}
      >
        <ScrollView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <View className="bg-white p-4 rounded-lg">
              <Text>{joke}</Text>
              <TouchableOpacity onPress={() => setJoke("")}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    elevation: 8,
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
    paddingRight: 30,
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
    paddingRight: 30,
    marginHorizontal: 10,
  },
  iconContainer: {
    position: "absolute",
    top: "50%",
    left: "60%",
  },
});
