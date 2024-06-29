import {
  Image,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Background from "@/components/Background";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { TextInput } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";

export default function Fridge() {
  const navigation = useNavigation();
  const user = useSelector((state) => state.user.value);

  const BACKEND_URL = "http://192.168.1.34:3000";

  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState([]);

  useEffect(() => {
    const fetchFridgeItems = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/users/fetchIngredients/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch fridge items");
        }
        const data = await response.json();
        console.log("Fridge items:", data.ingredients);

        const allItems = data.ingredients.map((item) => ({
          name: item.name,
        }));
        setFridgeItems(allItems);
      } catch (error) {
        console.error(error);
      }
    };
    fetchFridgeItems();
  }, []);

  const searchRecipesFromIngredientsSelected = async () => {
    const selectedIgredients = fridgeItems.filter((item) => item.checked);
    console.log("Selected Ingredients:", selectedIgredients);
    setSelectedIngredients(selectedIgredients);
    const ingredients = selectedIgredients.map((item) => item.name);
    console.log("Ingredients:", ingredients);
    const searchQuery = ingredients.join(",").toLowerCase();

    navigation.navigate("recipesFromFridge", { searchQuery });
  };

  const autocompleteSearchIngredient = async (query) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/recipes/autocompleteIngredients?query=${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to autocomplete search ingredient");
      }
      const data = await response.json();
      console.log("Autocomplete search ingredient:", data);
      setSearch(query);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleIngredientSelected = (ingredient) => {
    setSelectedFromSearch((prev) => {
      const index = prev.findIndex((item) => item.name === ingredient.name);
      if (index === -1) {
        return [...prev, ingredient];
      } else {
        return prev.filter((item) => item.name !== ingredient.name);
      }
    });
  };

  const addIngredientToFridge = async () => {
    try {
      const ingredientNames = selectedFromSearch.map((item) => item.name);
      console.log("Ingredient names:", ingredientNames);

      const response = await fetch(
        `${BACKEND_URL}/users/addIngredient/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ingredients: ingredientNames }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add ingredient to fridge");
      }
      const data = await response.json();
      console.log("Added ingredient to fridge:", data);
      alert("Ingredient(s) added successfully");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center mt-8">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      <View className="absolute -z-1 w-full h-full">
        <Image
          source={require("@/assets/images/fridge/fridge2.png")}
          className="absolute -z-1 w-full h-full"
          resizeMode="contain"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 4,
              height: 4,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 8,
          }}
        ></Image>
      </View>
      <View className="flex justify-center items-center absolute top-8">
        <Text
          style={{
            fontFamily: "Flux",
            fontSize: 24,
            textAlign: "center",
            margin: 20,
          }}
        >
          My Fridge
        </Text>
      </View>

      <View className="absolute top-52">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="relative items-center w-full justify-center">
            <TextInput
              placeholder="Search ingredient"
              placeholderTextColor={"gray"}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => autocompleteSearchIngredient(search)}
              className="text-center bg-[#e2e8f0] border-[#FF9B50] rounded-lg w-56 h-10"
              style={{
                fontFamily: "Nobile",
                borderWidth: 1,
              }}
            />
            <Ionicons
              name="search"
              size={25}
              color={"#FF9B50"}
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
              color={"#FF9B50"}
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
      </View>

      {searchResults.length > 0 && (
        <View className="flex justify-center items-center m-4">
          {searchResults.map((item, index) => (
            <View key={index} className="w-52 p-1">
              <BouncyCheckbox
                size={25}
                fillColor="#FF9B50"
                unFillColor="#e2e8f0"
                text={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                textStyle={{ fontFamily: "Nobile", textDecorationLine: "none" }}
                iconStyle={{ borderColor: "#FF9B50" }}
                onPress={() => toggleIngredientSelected(item)}
                isChecked={selectedFromSearch.includes(item)}
              />
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={addIngredientToFridge}
        className="relative flex justify-center items-center top-4"
      >
        <Image
          source={require("@/assets/images/button/button10.png")}
          alt="button"
          className="w-40 h-12"
        />
        <Text
          className="text-lg text-white absolute"
          style={{
            fontFamily: "Nobile",
            shadowColor: "#000",
            shadowOffset: {
              width: 4,
              height: 4,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          Add to Fridge
        </Text>
      </TouchableOpacity>

      <View className="flex justify-center items-center m-4">
        {fridgeItems.map((item, index) => (
          <View key={index} className="w-52 p-1">
            <BouncyCheckbox
              size={25}
              fillColor="#FF9B50"
              unFillColor="#e2e8f0"
              text={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
              textStyle={{ fontFamily: "Nobile", textDecorationLine: "none" }}
              iconStyle={{ borderColor: "#FF9B50" }}
              onPress={(isChecked) => {
                const updatedItems = fridgeItems.map((i) =>
                  i.name === item.name ? { ...i, checked: isChecked } : i
                );
                setFridgeItems(updatedItems);
              }}
            />
            <RNBounceable
              className="flex justify-center items-center"
              onPress={() => {
                const updatedItems = fridgeItems.filter(
                  (i) => i.name !== item.name
                );
                setFridgeItems(updatedItems);
              }}
            ></RNBounceable>
          </View>
        ))}
      </View>

      <View className="flex justify-center items-center">
        {fridgeItems.length > 0 && fridgeItems.some((item) => item.checked) && (
          <TouchableOpacity
            onPress={searchRecipesFromIngredientsSelected}
            className="relative flex justify-center items-center top-4"
          >
            <Image
              source={require("@/assets/images/button/button10.png")}
              alt="button"
              className="w-40 h-12"
            />
            <Text
              className="text-lg text-white absolute"
              style={{
                fontFamily: "Nobile",
                shadowColor: "#000",
                shadowOffset: {
                  width: 4,
                  height: 4,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              Search Recipes
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
