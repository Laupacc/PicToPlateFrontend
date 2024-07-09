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
  Dimensions,
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
import { TextInput, ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { List } from "react-native-paper";
import { logout } from "@/store/user";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
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

  const BACKEND_URL = "http://192.168.201.158:3000";

  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  // Logout user
  const handleLogout = async () => {
    if (!user.token) {
      return;
    }
    await SecureStore.deleteItemAsync("token");
    dispatch(logout());
    alert("Logged out");
    console.log(user);
  };

  // Fetch fridge items from the backend
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
          dateAdded: item.dateAdded,
          checked: false,
        }));

        dispatch(updateIngredients(allItems));
        setFridgeItems(allItems);
      } catch (error) {
        console.error(error);
      }
    };
    fetchFridgeItems();
  }, [user.token, ingredients.length]);

  // Search recipes from selected ingredients
  const searchRecipesFromIngredientsSelected = async () => {
    const selectedIgredients = ingredients.filter((item) => item.checked);
    setSelectedIngredients(selectedIgredients);

    const query = selectedIgredients.map((item) => item.name).join(",");
    navigation.navigate("recipesFromFridge", { searchQuery: query });
  };

  // Autocomplete search ingredient
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

  // Toggle ingredient selected from search modal
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
              ingredients: newIngredients.map((item) => ({
                name: item.name,
                dateAdded: item.dateAdded,
              })),
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

  const filterIngredients = (criteria, sortOrder) => {
    let sortedIngredients = [...fridgeItems];
    switch (criteria) {
      case "name":
        sortedIngredients.sort((a, b) =>
          sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );
        break;
      case "dateAdded":
        sortedIngredients.sort((a, b) =>
          sortOrder === "asc"
            ? new Date(a.dateAdded) - new Date(b.dateAdded)
            : new Date(b.dateAdded) - new Date(a.dateAdded)
        );
        break;
      case "checked":
        sortedIngredients.sort((a, b) =>
          sortOrder === "asc" ? a.checked - b.checked : b.checked - a.checked
        );
        console.log(sortedIngredients);
        break;
      default:
        break;
    }
    setFridgeItems(sortedIngredients);
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      <View className="flex justify-center items-center mb-2">
        <Image
          source={require("../../assets/images/logo8.png")}
          className="w-60 h-14"
        />
      </View>

      <View className="flex justify-center items-center">
        {user.token && (
          <Text className="text-xl text-cyan-600">
            Welcome back {user.username}
          </Text>
        )}
        {!user.token ? (
          <Link href="/authentication">
            <Text>Please Log in</Text>
          </Link>
        ) : (
          <TouchableOpacity onPress={handleLogout}>
            <Text>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="relative flex justify-center items-center">
        <Image
          source={require("@/assets/images/stickers/tape10.png")}
          className="w-64 h-16 absolute inset-0"
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
        />
        <Text
          style={{
            fontFamily: "Flux",
            fontSize: 20,
            textAlign: "center",
            margin: 25,
          }}
        >
          My Fridge
        </Text>
      </View>

      <Text
        style={{
          fontFamily: "CreamyCookies",
          fontSize: 20,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Add ingredients to your fridge
      </Text>

      {/* Search Section */}
      <View className="flex flex-row justify-center items-center relative">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
        </KeyboardAvoidingView>

        {/* Filter Section */}

        <TouchableOpacity
          onPress={() => setIsFilterModalVisible(!isFilterModalVisible)}
          className="absolute -right-10"
        >
          <FontAwesome name="sliders" size={25} color={"#FF9B50"} />
        </TouchableOpacity>

        {isFilterModalVisible && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={isFilterModalVisible}
            onRequestClose={() => setIsFilterModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center">
              <View
                style={{
                  margin: 20,
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 40,
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
                  onPress={() => setIsFilterModalVisible(false)}
                  className="absolute top-4 right-4"
                >
                  <Ionicons name="close" size={35} color="#FF9B50" />
                </TouchableOpacity>
                <List.Section className="flex justify-center items-center">
                  <List.Accordion
                    className="flex justify-center items-center w-48"
                    id={1}
                    title="Name"
                    titleStyle={{
                      fontFamily: "Nobile",
                      color: "#FF9B50",
                    }}
                    left={(props) => (
                      <MaterialCommunityIcons
                        {...props}
                        name="sort-alphabetical-variant"
                        size={20}
                      />
                    )}
                  >
                    <List.Item
                      title="Ascending"
                      onPress={() => filterIngredients("name", "asc")}
                    />
                    <List.Item
                      title="Descending"
                      onPress={() => filterIngredients("name", "desc")}
                    />
                  </List.Accordion>
                  <List.Accordion
                    className="flex justify-center items-center w-48"
                    id={2}
                    title="Checked"
                    left={(props) => (
                      <MaterialCommunityIcons
                        {...props}
                        name="target"
                        size={24}
                      />
                    )}
                  >
                    <List.Item
                      title="Ascending"
                      onPress={() => filterIngredients("checked", "asc")}
                    />
                    <List.Item
                      title="Descending"
                      onPress={() => filterIngredients("checked", "desc")}
                    />
                  </List.Accordion>
                  <List.Accordion
                    className="flex justify-center items-center w-48"
                    id={3}
                    title="Date"
                    left={(props) => (
                      <Ionicons {...props} name="calendar-outline" size={24} />
                    )}
                  >
                    <List.Item
                      title="Ascending"
                      onPress={() => filterIngredients("dateAdded", "asc")}
                    />
                    <List.Item
                      title="Descending"
                      onPress={() => filterIngredients("dateAdded", "desc")}
                    />
                  </List.Accordion>
                </List.Section>
              </View>
            </View>
          </Modal>
        )}
      </View>

      {/* Fridge Items */}
      <ScrollView>
        <View className="relative flex justify-center items-center">
          <View className="flex justify-center items-center mt-10">
            {fridgeItems.map((item, index) => (
              <View key={index} className="relative p-1 m-1">
                {/* w-52 */}
                <View
                  className="absolute bg-[#FF9B50] rounded-2xl -right-0.5 -bottom-0.5"
                  style={{
                    width: screenWidth - 45,
                    minHeight: 60,
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
                  className="flex flex-row justify-between items-center bg-white rounded-2xl p-2"
                  style={{
                    width: screenWidth - 40,
                    minHeight: 60,
                  }}
                >
                  <BouncyCheckbox
                    size={25}
                    fillColor="#FF9B50"
                    unFillColor="#e2e8f0"
                    text={
                      item.name.charAt(0).toUpperCase() +
                      item.name.slice(1) +
                      " (" +
                      moment(item.dateAdded).startOf("hour").fromNow() +
                      ")"
                    }
                    textStyle={{
                      fontFamily: "Nobile",
                      textDecorationLine: "none",
                    }}
                    iconStyle={{ borderColor: "#FF9B50" }}
                    isChecked={item.checked}
                    onPress={(isChecked) => {
                      const updatedItems = fridgeItems.map((i) =>
                        i.name === item.name ? { ...i, checked: isChecked } : i
                      );
                      setFridgeItems(updatedItems);
                      dispatch(updateIngredients(updatedItems));
                    }}
                  />
                  <RNBounceable
                    className="flex justify-center items-center"
                    onPress={() => {
                      const updatedItems = fridgeItems.filter(
                        (i) => i.name !== item.name
                      );
                      setFridgeItems(updatedItems);
                      // dispatch(updateIngredients(updatedItems));
                    }}
                  ></RNBounceable>
                  <TouchableOpacity
                    onPress={() => {
                      const updatedItems = fridgeItems.filter(
                        (i) => i.name !== item.name
                      );
                      removeIngredientFromFridge(item.name);
                      setFridgeItems(updatedItems);
                      // dispatch(updateIngredients(updatedItems));
                    }}
                    className="absolute right-2"
                    // onLongPress={() => {
                    //   const updatedItems = fridgeItems.filter(
                    //     (i) => i.name !== item.name
                    //   );
                    //   setFridgeItems(updatedItems);
                    //   // dispatch(updateIngredients(updatedItems));
                    // }}
                  >
                    <Ionicons name="trash" size={20} color="#ff6f03" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Search Recipes Button */}
          <View className="flex justify-center items-center top-4 pb-16">
            {ingredients.length > 0 &&
              ingredients.some((item) => item.checked) && (
                <TouchableOpacity
                  onPress={searchRecipesFromIngredientsSelected}
                  className="relative flex justify-center items-center"
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
        </View>
      </ScrollView>

      {/* Autocomplete Search Modal */}
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
                <Ionicons name="close" size={35} color="#FF3649" />
              </TouchableOpacity>
              <View className="flex justify-center items-center m-4">
                {searchResults.map((item, index) => (
                  <View key={index} className="w-52 p-1">
                    <BouncyCheckbox
                      size={25}
                      fillColor="#FF3649"
                      unFillColor="#e2e8f0"
                      text={
                        item.name.charAt(0).toUpperCase() + item.name.slice(1)
                      }
                      textStyle={{
                        fontFamily: "Nobile",
                        textDecorationLine: "none",
                      }}
                      iconStyle={{ borderColor: "#FF3649" }}
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
                  source={require("@/assets/images/button/button5.png")}
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
    </SafeAreaView>
  );
}
