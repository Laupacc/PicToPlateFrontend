import {
  Image,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Modal,
  ImageBackground,
  ScrollView,
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
import {
  addIngredient,
  removeIngredient,
  updateIngredients,
} from "@/store/fridge";

export default function Fridge() {
  const navigation = useNavigation();
  const user = useSelector((state) => state.user.value);
  const ingredients = useSelector((state) => state.fridge.ingredients);
  const dispatch = useDispatch();

  const BACKEND_URL = "http://192.168.1.34:3000";

  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

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

        dispatch(updateIngredients(allItems));
        setFridgeItems(allItems);
      } catch (error) {
        console.error(error);
      }
    };
    fetchFridgeItems();
  }, [user.token, ingredients.length]);

  const searchRecipesFromIngredientsSelected = async () => {
    const selectedIgredients = ingredients.filter((item) => item.checked);
    console.log("Selected Ingredients:", selectedIgredients);

    setSelectedIngredients(selectedIgredients);
    const query = selectedIgredients.map((item) => item.name).join(",");
    console.log("Search query:", query);
    navigation.navigate("recipesFromFridge", { searchQuery: query });
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
      // Filter out ingredients that are already in the fridgeItems state
      const newIngredients = selectedFromSearch.filter(
        (item) =>
          !fridgeItems.some((fridgeItem) => fridgeItem.name === item.name)
      );

      // Alert if some ingredients are already in the fridge
      if (newIngredients.length < selectedFromSearch.length) {
        const alreadyInFridgeNames = selectedFromSearch
          .filter((item) =>
            fridgeItems.some((fridgeItem) => fridgeItem.name === item.name)
          )
          .map((item) => item.name);
        alert(`${alreadyInFridgeNames.join(", ")} are aleady in your fridge`);
      }

      // Proceed to add only new ingredients
      if (newIngredients.length > 0) {
        const response = await fetch(
          `${BACKEND_URL}/users/addIngredient/${user.token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ingredients: newIngredients.map((item) => item.name),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add ingredient to fridge");
        }
        const data = await response.json();
        console.log("Added ingredient to fridge:", data);

        // Update the local state with the new ingredients
        setSelectedFromSearch([]);

        dispatch(addIngredient(newIngredients));
        setFridgeItems((prev) => [...prev, ...newIngredients]);

        alert("New ingredient(s) added successfully");
      } else {
        console.log("No new ingredients to add");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeIngredientFromFridge = async (ingredient) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/users/removeIngredient/${user.token}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredient: ingredient,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove ingredient from fridge");
      }
      const data = await response.json();
      console.log("Removed ingredient from fridge:", data);

      dispatch(removeIngredient(ingredient));
      setFridgeItems((prev) =>
        prev.filter((item) => item.name !== ingredient.name)
      );

      alert("Ingredient removed successfully");
    } catch (error) {
      if (error.message === "Failed to remove ingredient from fridge") {
        alert("Failed to remove ingredient from fridge");
      } else {
        console.error("Error removing ingredient from fridge:", error.message);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center mt-5">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      {/* <ImageBackground
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
      /> */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-start items-center w-full h-full"
      >
        <View className="flex justify-center items-center -mt-6">
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

        <Text
          style={{
            fontFamily: "Nobile",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Add more ingredients to your fridge
        </Text>

        <View className="flex items-center justify-center relative">
          <TextInput
            placeholder="Search ingredient"
            placeholderTextColor={"gray"}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              autocompleteSearchIngredient(search);
              setIsSearchModalVisible(true);
            }}
            className="text-center bg-[#e2e8f0] border-[#FF9B50] rounded-lg w-60 h-10"
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

        {isSearchModalVisible && searchResults.length > 0 && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={isSearchModalVisible}
            onRequestClose={() => setIsSearchModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center">
              <View
                style={{
                  margin: 20,
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 30,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 2,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <TouchableOpacity
                  onPress={() => setIsSearchModalVisible(false)}
                  className="absolute top-4 right-4"
                >
                  <Ionicons name="close" size={35} color="#FF9B50" />
                </TouchableOpacity>
                <View className="flex justify-center items-center m-4">
                  {searchResults.map((item, index) => (
                    <View key={index} className="w-52 p-1">
                      <BouncyCheckbox
                        size={25}
                        fillColor="#FF9B50"
                        unFillColor="#e2e8f0"
                        text={
                          item.name.charAt(0).toUpperCase() + item.name.slice(1)
                        }
                        textStyle={{
                          fontFamily: "Nobile",
                          textDecorationLine: "none",
                        }}
                        iconStyle={{ borderColor: "#FF9B50" }}
                        onPress={() => toggleIngredientSelected(item)}
                        isChecked={selectedFromSearch.includes(item)}
                      />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    addIngredientToFridge();
                    setIsSearchModalVisible(false);
                    setSearch("");
                  }}
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
              </View>
            </View>
          </Modal>
        )}

        <View className="relative flex justify-start items-center w-full h-full mt-2">
            <Image
              source={require("@/assets/images/fridge/fridge8.png")}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                resizeMode: "contain",
                shadowColor: "#000",
                shadowOffset: {
                  width: 4,
                  height: 4,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              }}
              />
              <ScrollView>
            <View className="flex justify-center items-center mt-16">
              {fridgeItems.map((item, index) => (
                <View key={index} className="w-52 p-1">
                  <BouncyCheckbox
                    size={25}
                    fillColor="#FF9B50"
                    unFillColor="#e2e8f0"
                    text={
                      item.name.charAt(0).toUpperCase() + item.name.slice(1)
                    }
                    textStyle={{
                      fontFamily: "Nobile",
                      textDecorationLine: "none",
                    }}
                    iconStyle={{ borderColor: "#FF9B50" }}
                    onPress={(isChecked) => {
                      const updatedItems = fridgeItems.map((i) =>
                        i.name === item.name ? { ...i, checked: isChecked } : i
                      );
                      // setFridgeItems(updatedItems);
                      dispatch(updateIngredients(updatedItems));
                    }}
                  />
                  <RNBounceable
                    className="flex justify-center items-center"
                    onPress={() => {
                      const updatedItems = fridgeItems.filter(
                        (i) => i.name !== item.name
                      );
                      // setFridgeItems(updatedItems);
                      dispatch(updateIngredients(updatedItems));
                    }}
                  ></RNBounceable>
                  <TouchableOpacity
                    onPress={() => {
                      const updatedItems = fridgeItems.filter(
                        (i) => i.name !== item.name
                      );
                      removeIngredientFromFridge(item.name);
                      // setFridgeItems(updatedItems);
                      dispatch(updateIngredients(updatedItems));
                    }}
                    className="absolute top-0 right-0"
                  >
                    <Ionicons name="trash" size={20} color="#FF9B50" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View className="flex justify-center items-center">
              {ingredients.length > 0 &&
                ingredients.some((item) => item.checked) && (
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
                </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
