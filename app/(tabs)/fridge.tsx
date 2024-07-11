import {
  StyleSheet,
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
  Alert,
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { List } from "react-native-paper";
import { logout } from "@/store/user";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
import { useToast } from "react-native-toast-notifications";
import {
  addIngredient,
  removeIngredient,
  updateIngredients,
} from "@/store/fridge";

export default function Fridge() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const ingredients = useSelector((state) => state.fridge.ingredients);
  const toast = useToast();

  const BACKEND_URL = "http://192.168.1.34:3000";

  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState([]);
  const [selectedToRemove, setSelectedToRemove] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

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
      if (data.length === 0) {
        toast.show("No ingredients found", {
          type: "warning",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
      }
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

  // Add selected ingredients to fridge
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

        toast.show(
          `${alreadyInFridgeNames[0]
            .charAt(0)
            .toUpperCase()}${alreadyInFridgeNames[0]
            .slice(1)
            .toLowerCase()}${alreadyInFridgeNames
            .slice(1)
            .map((name) => `, ${name.toLowerCase()}`)
            .join("")} is already in your fridge`,
          {
            type: "warning",
            placement: "center",
            duration: 2000,
            animationType: "zoom-in",
            swipeEnabled: true,
            icon: <Ionicons name="warning" size={24} color="white" />,
          }
        );
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

        toast.show("New ingredient(s) added successfully", {
          type: "success",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
        });
      } else {
        console.log("No new ingredients to add");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // const removeIngredientFromFridge = async (ingredient) => {
  //   try {
  //     const response = await fetch(
  //       `${BACKEND_URL}/users/removeIngredient/${user.token}`,
  //       {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           ingredient: ingredient,
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to remove ingredient from fridge");
  //     }
  //     const data = await response.json();
  //     console.log("Removed ingredient from fridge:", data);

  //     dispatch(removeIngredient(ingredient));
  //     setFridgeItems((prev) =>
  //       prev.filter((item) => item.name !== ingredient.name)
  //     );

  //     toast.show("Ingredient deleted successfully", {
  //       type: "success",
  //       placement: "center",
  //       duration: 2000,
  //       animationType: "zoom-in",
  //       swipeEnabled: true,
  //       icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
  //     });
  //   } catch (error) {
  //     if (error) {
  //       toast.show("Failed to delete ingredient", {
  //         type: "danger",
  //         placement: "center",
  //         duration: 2000,
  //         animationType: "zoom-in",
  //         swipeEnabled: true,
  //         icon: <Ionicons name="close-circle" size={24} color="white" />,
  //       });
  //     } else {
  //       console.error("Error removing ingredient from fridge:", error.message);
  //     }
  //   }
  // };

  // Remove selected ingredients
  const removeSelectedIngredients = async () => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to remove the selected ingredients?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Ingredient removal cancelled"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await fetch(
                `${BACKEND_URL}/users/removeIngredient/${user.token}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    ingredient: selectedToRemove,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error("Failed to remove ingredients from fridge");
              }
              const data = await response.json();
              console.log("Removed ingredients from fridge:", data);

              setFridgeItems((prev) =>
                prev.filter((item) => !selectedToRemove.includes(item.name))
              );
              dispatch(removeIngredient(selectedToRemove));
              setSelectedToRemove([]);

              toast.show("Ingredients deleted successfully", {
                type: "success",
                placement: "center",
                duration: 2000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: (
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                ),
              });
            } catch (error) {
              toast.show("Failed to delete ingredients", {
                type: "danger",
                placement: "center",
                duration: 2000,
                animationType: "zoom-in",
                swipeEnabled: true,
                icon: <Ionicons name="close-circle" size={24} color="white" />,
              });
              console.log("Error removing ingredients from fridge:", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Select several ingredients to remove
  const toggleIngredientSelectedToRemove = (ingredient) => {
    if (selectedToRemove.includes(ingredient)) {
      setSelectedToRemove((prev) => prev.filter((name) => name !== ingredient));
    } else {
      setSelectedToRemove((prev) => [...prev, ingredient]);
    }
  };

  // Filter ingredients by name, dateAdded, checked
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

  const clearFilters = () => {
    setFridgeItems(ingredients);
  };

  // Go back to recipesFromFridge screen if there has already been a search query
  const goBackToRecipesFromFridge = () => {
    if (selectedIngredients.length > 0) {
      navigation.navigate("recipesFromFridge", {
        searchQuery: selectedIngredients.map((item) => item.name).join(","),
      });
    } else {
      toast.show("No recipes generated yet", {
        type: "warning",
        placement: "top",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-24">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      <View className="relative flex justify-center items-center">
        <Image
          source={require("@/assets/images/stickers/blackTape.png")}
          className="w-64 h-16 absolute inset-0"
          style={styles.shadow}
        />
        <Text className="font-Flux text-xl text-center text-white m-8">
          My Fridge
        </Text>
      </View>

      <Text className="font-CreamyCookies text-xl text-center mb-4">
        Add ingredients to your fridge
      </Text>

      {/* Search Section */}
      <View className="flex flex-row justify-center items-center my-2">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex items-center justify-center relative mx-2">
            <TextInput
              placeholder="Search ingredient"
              placeholderTextColor={"gray"}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                autocompleteSearchIngredient(search);
                setIsSearchModalVisible(true);
              }}
              className="text-center bg-[#e2e8f0] border border-[#FF9B50] rounded-lg w-60 h-10 font-Nobile"
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

        {/* Filter button */}
        <TouchableOpacity
          onPress={() => setIsFilterModalVisible(!isFilterModalVisible)}
          className="mx-1"
          style={styles.shadow}
        >
          <Image
            source={require("@/assets/images/filter4.png")}
            alt="button"
            className="w-12 h-12"
          />
        </TouchableOpacity>

        {/* Back to recipes button */}
        <TouchableOpacity
          onPress={goBackToRecipesFromFridge}
          className="mx-1"
          style={styles.shadow}
        >
          <Image
            source={require("@/assets/images/backToRecipeFridge.png")}
            alt="button"
            className="w-12 h-12"
          />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      {isFilterModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isFilterModalVisible}
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View
              className="m-5 bg-white rounded-lg p-10 items-center justify-center"
              style={styles.shadow}
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
              <TouchableOpacity
                onPress={clearFilters}
                className="relative flex justify-center items-center top-4"
              >
                <Image
                  source={require("@/assets/images/button/button5.png")}
                  alt="button"
                  className="w-40 h-12"
                />
                <Text className="text-lg text-white absolute font-Nobile">
                  Clear Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Search Recipes and Remove Ingredients Buttons */}
      <View className="flex flex-row justify-center items-center">
        <View className="flex justify-center items-center my-2">
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
                  className="text-lg text-white absolute font-Nobile"
                  style={styles.shadow}
                >
                  Search Recipes
                </Text>
              </TouchableOpacity>
            )}
        </View>
        <View className="flex justify-center items-center my-2">
          {selectedToRemove.length > 0 && (
            <TouchableOpacity
              onPress={removeSelectedIngredients}
              className="relative flex justify-center items-center"
            >
              <Image
                source={require("@/assets/images/button/button6.png")}
                alt="button"
                className="w-40 h-12"
              />
              <Text
                className="text-lg text-white absolute font-Nobile"
                style={styles.shadow}
              >
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fridge Items */}
      <ScrollView>
        <View className="flex justify-center items-center">
          {fridgeItems.map((item, index) => (
            <View key={index} className="relative p-1 m-1">
              {/* w-52 */}
              <View
                className="absolute bg-[#FF9B50] rounded-2xl -right-0.5 -bottom-0.5"
                style={{
                  width: screenWidth - 45,
                  minHeight: 60,
                  ...styles.shadow,
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
                  onPress={() => toggleIngredientSelectedToRemove(item.name)}
                  className="absolute right-9"
                >
                  {selectedToRemove.includes(item.name) ? (
                    <Feather name="check-square" size={20} color="#FF003D" />
                  ) : (
                    <Feather name="square" size={20} color="#FF003D" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="absolute right-2"
                  onPress={() => toggleIngredientSelectedToRemove(item.name)}
                >
                  <Image
                    source={require("../../assets/images/trash1.png")}
                    className="w-6 h-6"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
              className="bg-white p-10 rounded-lg items-center justify-center"
              style={styles.shadow}
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
                  className="text-lg text-white absolute font-Nobile"
                  style={styles.shadow}
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

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
