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
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import Background from "@/components/Background";
import { fetchRandomRecipe } from "@/apiFunctions";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";

export default function RecipeSearch() {
  const navigation = useNavigation();
  const [trivia, setTrivia] = useState("");
  const [joke, setJoke] = useState("");
  const [recipe, setRecipe] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [recipesFromIngredients, setRecipesFromIngredients] = useState<any[]>(
    []
  );
  const [diet, setDiet] = useState([]);
  const [intolerances, setIntolerances] = useState([]);
  const [showDiet, setShowDiet] = useState(false);
  const [showIntolerances, setShowIntolerances] = useState(false);
  const isInitialMount = useRef(true);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const fetchTrivia = async () => {
    const response = await fetch(`http://192.168.1.34:3000/recipes/trivia`);
    const data = await response.json();
    console.log(data);
    setTrivia(data.text);
  };

  const fetchJoke = async () => {
    const response = await fetch(`http://192.168.1.34:3000/recipes/joke`);
    const data = await response.json();
    console.log(data);
    setJoke(data.text);
  };

  const handleFetchRandomRecipe = async () => {
    const recipe = await fetchRandomRecipe();
    setRecipe(recipe);
    navigation.navigate("insideRecipe", { recipeId: recipe.id });
  };

  const complexSearchByIngredients = async (search, diet, intolerances) => {
    const ingredients = encodeURIComponent(search.split(" ").join(","));
    let URL = `http://192.168.1.34:3000/recipes/complexSearchByIngredients?ingredients=${ingredients}`;
    if (diet.length > 0) {
      const dietParam = encodeURIComponent(diet.join(","));
      URL += `&diet=${dietParam}`;
    }
    if (intolerances.length > 0) {
      const intolerancesParam = encodeURIComponent(intolerances.join(","));
      URL += `&intolerances=${intolerancesParam}`;
    }
    try {
      const response = await fetch(URL);
      console.log(response);
      const recipe = await response.json();
      console.log(recipe);
      setSearch(ingredients);
      setDiet(diet);
      setIntolerances(intolerances);
      setRecipesFromIngredients(recipe.results);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const randomStickerImage = () => {
    const images = [
      require("../../assets/images/stickers/stickerB1.png"),
      require("../../assets/images/stickers/stickerB2.png"),
      require("../../assets/images/stickers/stickerB3.png"),
      require("../../assets/images/stickers/stickerB4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
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

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      complexSearchByIngredients(search, diet, intolerances);
    }
  }, [diet, intolerances]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      {/* <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-sharp" size={30} />
      </TouchableOpacity> */}

      {/* <TouchableOpacity onPress={fetchTrivia}>
        <Text>Fetch Trivia</Text>
      </TouchableOpacity>
      <Text className="items-center justify-center">{trivia}</Text>

      <TouchableOpacity onPress={fetchJoke}>
        <Text>Fetch Joke</Text>
      </TouchableOpacity> */}

      {/* Radom Recipe Button */}
      <View className="flex flex-row justify-center items-center">
        <View className="flex flex-row justify-center items-center">
          <Text
            style={{
              fontFamily: "Nobile",
              color: "#475569",
              fontSize: 22,
              textAlign: "center",
            }}
          >
            Surprise me
          </Text>
          <Ionicons name="chevron-forward" size={30} color={"#475569"} />
        </View>
        <TouchableOpacity
          onPress={handleFetchRandomRecipe}
          className="flex flex-row justify-center items-center"
        >
          <View className="relative w-20 h-20 flex justify-center items-center">
            <Image
              source={require("../../assets/images/randomButton.png")}
              className="absolute inset-0 w-full h-full"
            />
            <Image
              source={require("../../assets/images/dice5.png")}
              className="w-8 h-8 bottom-2"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search bar, by Ingredients */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="relative items-center w-full justify-center">
          <TextInput
            placeholder="Search by ingredients"
            placeholderTextColor={"gray"}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() =>
              complexSearchByIngredients(search, diet, intolerances)
            }
            className="border-2 border-gray-400 rounded-lg pl-10 w-72 h-12"
          />
          <Ionicons
            name="search"
            size={25}
            color={"blue"}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: [{ translateY: -12.5 }],
            }}
          />
          <FontAwesome6
            name="circle-xmark"
            size={25}
            color={"gray"}
            onPress={() => setSearch("")}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: [{ translateY: -12.5 }],
            }}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Diet and Intolerances Buttons */}
      <View className="flex flex-row justify-center items-center my-3">
        <TouchableOpacity
          onPress={() => setShowDiet(!showDiet)}
          className="flex justify-center items-center relative w-20 h-10 mx-2"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 2,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <Image
            source={require("../../assets/images/stickers/yellowTape2.png")}
            className="absolute inset-0 w-full h-full"
          ></Image>
          <Text style={{ fontFamily: "Nobile" }} className="text-center">
            Diet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowIntolerances(!showIntolerances)}
          className="flex justify-center items-center relative w-32 h-10 mx-2"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 2,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <Image
            source={require("../../assets/images/stickers/yellowTape1.png")}
            className="absolute inset-0 w-full h-full"
          ></Image>
          <Text style={{ fontFamily: "Nobile" }} className="text-center">
            Intolerances
          </Text>
        </TouchableOpacity>
      </View>

      {/* Diet and Intolerances Checkbox */}
      <View className="flex flex-row justify-center items-start">
        {showDiet && (
          <>
            <View className="relative mx-3">
              <View
                className="absolute bg-[#64E6A6] rounded-2xl -right-2 -bottom-2 w-[200] h-[330]"
                style={{
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
          </>
        )}
        {showIntolerances && (
          <>
            <View className="relative mx-3">
              <View
                className="absolute bg-[#FF9B50] rounded-2xl -right-2 -bottom-2 w-[140] h-[360]"
                style={{
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
          </>
        )}
      </View>

      {/* Recipe Results */}
      <ScrollView className="flex-1">
        {recipesFromIngredients &&
          recipesFromIngredients.map((recipe) => (
            <View
              className="flex-1 items-center justify-center relative"
              key={recipe.id}
            >
              <View
                className="absolute bg-[#FF9B50] rounded-2xl right-0.5 bottom-0.5 w-[280] h-[280]"
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
              ></View>

              <View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("insideRecipe", { recipeId: recipe.id })
                  }
                  key={recipe.id}
                  className="bg-white p-4 w-[280] h-[280] m-4 items-center justify-center rounded-br-full rounded-tr-full"
                >
                  <Image
                    source={{ uri: recipe.image }}
                    className="rounded-full w-[200] h-[200]"
                  />

                  <View className="relative w-[280] h-[70] mt-2">
                    <Image
                      source={randomStickerImage()}
                      className="absolute inset-0 w-[280] h-[70] top-0 right-0"
                    />
                    <View className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
                      <Text
                        style={{
                          fontFamily: "Flux",
                          textAlignVertical: "center",
                        }}
                        className="text-center"
                      >
                        {recipe.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
