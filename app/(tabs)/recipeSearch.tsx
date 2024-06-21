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
import React, { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import Background from "@/components/Background";
import { fetchRandomRecipe } from "@/apiFunctions";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { op } from "@tensorflow/tfjs";

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

  // const searchByIngredients = async (search: string) => {
  //   const ingredients = search.split(" ").join(",").replace(/%2C/g, ",");
  //   const response = await fetch(
  //     `http://192.168.1.34:3000/recipes/findByIngredients?ingredients=${ingredients}`
  //   );
  //   console.log(response);
  //   const recipe = await response.json();
  //   console.log(recipe);
  //   setSearch(ingredients);
  //   setRecipesFromIngredients(recipe);
  // };

  const complexSearchByIngredients = async (
    search: string
    // diet: string[] = [],
    // intolerances: string[] = []
  ) => {
    const ingredients = search.split(" ").join(",").replace(/%2C/g, ",");
    // const dietQuery = diet.length > 0 ? `&diet=${diet.join(",")}` : "";
    // const intolerancesQuery =
    //   intolerances.length > 0 ? `&intolerances=${intolerances.join(",")}` : "";
    const response = await fetch(
      `http://192.168.1.34:3000/recipes/complexSearchByIngredients?ingredients=${ingredients}`
    );
    console.log(response);
    const recipe = await response.json();
    console.log(recipe);
    setSearch(ingredients);
    setRecipesFromIngredients(recipe.results);
  };

  const randomStickerImage = () => {
    const images = [
      require("../../assets/images/stickerB1.png"),
      require("../../assets/images/stickerB2.png"),
      require("../../assets/images/stickerB3.png"),
      require("../../assets/images/stickerB4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const toggleDiet = (item: string) => {
    if (diet.includes(item)) {
      console.log(`Removing ${item} from diet array`);
      setDiet(diet.filter((x) => x !== item));
    } else {
      console.log(`Adding ${item} to diet array`);
      setDiet([...diet, item]);
    }
  };

  const dietOptions = [
    { key: "vegetarian", label: "Vegetarian" },
    { key: "vegan", label: "Vegan" },
    { key: "glutenFree", label: "Gluten Free" },
    { key: "ketogenic", label: "Ketogenic" },
    { key: "paleo", label: "Paleo" },
    { key: "primal", label: "Primal" },
    { key: "whole30", label: "Whole 30" },
    { key: "pescetarian", label: "Pescetarian" },
    { key: "lactoVegetarian", label: "Lacto Vegetarian" },
    { key: "ovoVegetarian", label: "Ovo Vegetarian" },
    { key: "lowFodmap", label: "Low Fodmap" },
  ];

  const toggleIntolerances = (item: string) => {
    if (intolerances.includes(item)) {
      console.log(`Removing ${item} from intolerances array`);
      setIntolerances(intolerances.filter((x) => x !== item));
    } else {
      console.log(`Adding ${item} to intolerances array`);
      setIntolerances([...intolerances, item]);
    }
  };

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

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-sharp" size={30} />
      </TouchableOpacity>

      {/* <TouchableOpacity onPress={fetchTrivia}>
        <Text>Fetch Trivia</Text>
      </TouchableOpacity>
      <Text className="items-center justify-center">{trivia}</Text>

      <TouchableOpacity onPress={fetchJoke}>
        <Text>Fetch Joke</Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={handleFetchRandomRecipe}
        className="flex flex-row justify-center items-center"
      >
        <Text
          style={{
            fontFamily: "Nobile",
            color: "blue",
            fontSize: 18,
            textAlign: "center",
          }}
        >
          Surprise me ➜
        </Text>
        <Image
          source={require("../../assets/images/randomButton.png")}
          className="w-20 h-20"
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="relative items-center w-full justify-center">
          <TextInput
            placeholder="Search by ingredients"
            placeholderTextColor={"gray"}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => complexSearchByIngredients(search)}
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
            source={require("../../assets/images/yellowTape2.png")}
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
            source={require("../../assets/images/yellowTape1.png")}
            className="absolute inset-0 w-full h-full"
          ></Image>
          <Text style={{ fontFamily: "Nobile" }} className="text-center">
            Intolerances
          </Text>
        </TouchableOpacity>
      </View>

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
              <View className="bg-white w-[200] p-2 rounded-lg justify-center">
                {dietOptions.map((option) => (
                  <View key={option.key} className="flex-row m-0.5 ml-2">
                    <BouncyCheckbox
                      size={25}
                      fillColor={"green"}
                      unFillColor={"transparent"}
                      innerIconStyle={{ borderWidth: 2, borderColor: "green" }}
                      onPress={() => toggleDiet(option.key)}
                      isChecked={diet.includes(option.key)}
                    />
                    <Text style={{ fontFamily: "Nobile", color: "green" }}>
                      {option.label}
                    </Text>
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
              <View className="bg-white w-[140] p-2 rounded-lg justify-center">
                {intolerancesOptions.map((option) => (
                  <View key={option.key} className="flex-row m-0.5 ml-2">
                    <BouncyCheckbox
                      size={25}
                      fillColor={"orange"}
                      unFillColor={"transparent"}
                      innerIconStyle={{ borderWidth: 2, borderColor: "orange" }}
                      onPress={() => toggleIntolerances(option.key)}
                      isChecked={intolerances.includes(option.key)}
                    />
                    <Text style={{ fontFamily: "Nobile", color: "orange" }}>
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </View>

      <ScrollView className="flex-1">
        {recipesFromIngredients.map((recipe) => (
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
