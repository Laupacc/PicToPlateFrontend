import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  ImageBackground,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Modal } from "react-native-paper";
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
import {
  Feather,
  Ionicons,
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { List } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
import { useToast } from "react-native-toast-notifications";
import BouncingImage from "@/components/Bounce";
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
  const [searchMessage, setSearchMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  // Fetch fridge items from the backend
  useEffect(() => {
    const fetchFridgeItems = async () => {
      if (!user.token) return;
      try {
        setLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/users/fetchIngredients/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch fridge items");
        }
        const data = await response.json();
        console.log(
          "Fridge items:",
          data.ingredients.map((item) => item.name)
        );

        const allItems = data.ingredients.map((item) => ({
          name: item.name,
          dateAdded: item.dateAdded,
          checked: false,
        }));

        dispatch(updateIngredients(allItems));
        setFridgeItems(allItems);
        setLoading(false);
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
    if (selectedIgredients.length === 0) {
      toast.show("Please select at least one ingredient", {
        type: "warning",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }

    const query = selectedIgredients.map((item) => item.name).join(",");
    setLastSearchQuery(query);
    navigation.navigate("recipesFromFridge", { searchQuery: query });
  };

  // Autocomplete search ingredient
  const autocompleteSearchIngredient = async (query) => {
    if (query.length === 0) {
      toast.show("Please enter an ingredient", {
        type: "warning",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }
    try {
      const response = await fetch(
        `${BACKEND_URL}/recipes/autocompleteIngredients?query=${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to autocomplete search ingredient");
      }
      const data = await response.json();
      console.log("Autocomplete search ingredient:", data);

      if (
        !data.some((item) => item.name.toLowerCase() === query.toLowerCase())
      ) {
        data.unshift({ name: query });
      }

      setSearch(query);
      setSearchResults(data);
      setSearchMessage("");
      if (data.length === 1) {
        setSearchMessage("No suggestion found");
      } else if (data.length === 0) {
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

              toast.show("Ingredient(s) deleted successfully", {
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
              toast.show("Failed to delete ingredient(s)", {
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
    const currentQuery = selectedIngredients.map((item) => item.name).join(",");
    if (selectedIngredients.length > 0) {
      if (currentQuery === lastSearchQuery) {
        // Use cached results
        navigation.navigate("recipesFromFridge", {
          searchQuery: lastSearchQuery,
        });
      } else {
        // Perform a new search
        setLastSearchQuery(currentQuery);
        navigation.navigate("recipesFromFridge", { searchQuery: currentQuery });
      }
    } else {
      toast.show("No recipes generated yet", {
        type: "warning",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-20">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />

      {/* Title */}
      <View className="relative flex justify-center items-center">
        <Image
          source={require("@/assets/images/stickers/blackTape.png")}
          className="w-64 h-16 absolute inset-0"
          style={styles.shadow}
        />
        <Text className="font-Flux text-xl text-center text-white my-5">
          My Kitchen
        </Text>
      </View>

      <View className="flex-1 justify-around items-center">
        {/* User not logged in, fridge items empty, fridge items */}
        {!user.token ? (
          <View className="relative">
            <View
              className="absolute bg-[#FF9B50] rounded-2xl -right-1.5 -bottom-1.5"
              style={{
                width: screenWidth - 65,
                height: 300,
                ...styles.shadow,
              }}
            ></View>
            <View
              className="flex justify-center items-center bg-white rounded-2xl"
              style={{
                width: screenWidth - 60,
                height: 300,
              }}
            >
              <View className="flex items-center justify-center">
                <TouchableOpacity
                  onPress={() => navigation.navigate("authentication")}
                  style={styles.shadow}
                >
                  <Image
                    source={require("../../assets/images/keyholeSecurity.png")}
                    className="w-16 h-16"
                  />
                </TouchableOpacity>
                <Text className="font-CreamyCookies text-2xl text-center mx-10 my-4">
                  Log into your account to see your saved ingredients
                </Text>
              </View>
            </View>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#237CB0" className="flex-1" />
        ) : user.token && fridgeItems.length === 0 ? (
          // User is logged in but fridge is empty
          <View className="flex justify-center items-center mx-20">
            <Text className="font-CreamyCookies text-3xl text-center">
              You don't have any ingredients in your kitchen yet. Add some now!
            </Text>
            <View className="flex flex-row m-10 justify-center items-center">
              <Image
                source={require("../../assets/images/curvedArrowDownLeft.png")}
                className="w-12 h-12 top-5 mx-4"
              />

              <Text className="font-CreamyCookies text-2xl">Search</Text>
            </View>
          </View>
        ) : (
          user.token &&
          fridgeItems.length > 0 && (
            // User is logged in and fridge items are displayed
            <>
              <View className="border-2 border-slate-400 h-[550] p-1 rounded-3xl mt-2">
                <ScrollView className="flex-1">
                  <View className="flex justify-center items-center mb-2">
                    {fridgeItems &&
                      fridgeItems.map((item, index) => (
                        <View key={index} className="relative p-1 m-1 ">
                          <View
                            className="absolute bg-[#FF9B50] rounded-2xl -right-0.5 -bottom-0.5"
                            style={{
                              width: screenWidth - 45,
                              height: 60,
                              ...styles.shadow,
                            }}
                          ></View>
                          <View
                            className="flex flex-row justify-between items-center bg-white rounded-2xl p-2"
                            style={{
                              width: screenWidth - 40,
                              height: 60,
                            }}
                          >
                            <View className="w-5/6">
                              <BouncyCheckbox
                                size={25}
                                fillColor="#FF9B50"
                                unFillColor="#e2e8f0"
                                textComponent={
                                  <ScrollView
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                  >
                                    <View className="flex-row justify-center items-center ml-2">
                                      <Text className="text-lg text-slate-600">
                                        {item.name.charAt(0).toUpperCase() +
                                          item.name.slice(1)}
                                      </Text>
                                      <Text className="text-base text-slate-500">
                                        {" (" +
                                          moment(item.dateAdded)
                                            .startOf("minutes")
                                            .fromNow() +
                                          ")"}
                                      </Text>
                                    </View>
                                  </ScrollView>
                                }
                                textStyle={{
                                  fontFamily: "Nobile",
                                  textDecorationLine: "none",
                                }}
                                iconStyle={{ borderColor: "#FF9B50" }}
                                isChecked={item.checked}
                                onPress={(isChecked) => {
                                  const updatedItems = fridgeItems.map((i) =>
                                    i.name === item.name
                                      ? { ...i, checked: isChecked }
                                      : i
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
                            </View>
                            <TouchableOpacity
                              onPress={() =>
                                toggleIngredientSelectedToRemove(item.name)
                              }
                              className="absolute right-9"
                            >
                              {selectedToRemove.includes(item.name) ? (
                                <Feather
                                  name="check-square"
                                  size={20}
                                  color="#FF003D"
                                />
                              ) : (
                                <Feather name="square" size={20} color="grey" />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="absolute right-2"
                              onPress={() =>
                                toggleIngredientSelectedToRemove(item.name)
                              }
                            >
                              <Image
                                source={require("../../assets/images/trash2.png")}
                                className="w-6 h-6"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                </ScrollView>
              </View>

              {/* Search Recipes and Remove Selected Buttons */}
              <View className="flex flex-row justify-center items-center">
                <View className="flex justify-center items-center">
                  <TouchableOpacity
                    onPress={searchRecipesFromIngredientsSelected}
                    className="relative flex justify-center items-center"
                    style={styles.shadow}
                  >
                    <Image
                      source={require("@/assets/images/button/button9.png")}
                      alt="button"
                      className="w-40 h-12"
                    />
                    <Text className="text-lg text-white absolute font-Nobile">
                      Search Recipes
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex justify-center items-center">
                  {selectedToRemove.length > 0 && (
                    <TouchableOpacity
                      onPress={removeSelectedIngredients}
                      className="relative flex justify-center items-center"
                      style={styles.shadow}
                    >
                      <Image
                        source={require("@/assets/images/button/button5.png")}
                        alt="button"
                        className="w-40 h-12"
                      />
                      <Text className="text-lg text-white absolute font-Nobile">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )
        )}

        {/* Search Bar, Filter Button and go back to recipe button */}
        {user.token && !loading && (
          <View
            className={
              fridgeItems.length === 0
                ? "flex flex-row justify-center items-center bottom-24"
                : "flex flex-row justify-center items-center mt-2"
            }
          >
            <View className="flex justify-center items-center mx-2">
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <View className="items-center justify-center relative w-full">
                  <TextInput
                    placeholder="Add ingredients"
                    placeholderTextColor={"gray"}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={() => {
                      autocompleteSearchIngredient(search);
                      setIsSearchModalVisible(true);
                    }}
                    className="bg-[#e2e8f0] border border-gray-400 pl-4 rounded-lg w-60 h-10 font-Nobile"
                  />
                  <TouchableOpacity
                    onPress={() => setSearch("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: [{ translateY: -12.5 }],
                    }}
                  >
                    <Image
                      source={require("@/assets/images/redCross.png")}
                      alt="clear"
                      className="w-6 h-6"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    autocompleteSearchIngredient(search);
                    setIsSearchModalVisible(true);
                  }}
                  style={{
                    position: "absolute",
                    right: 45,
                    top: "50%",
                    transform: [{ translateY: -12.5 }],
                  }}
                >
                  <Image
                    source={require("@/assets/images/search2.png")}
                    alt="search"
                    className="w-6 h-6"
                  />
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </View>

            {fridgeItems.length > 0 && (
              <>
                {/* Filter button */}
                <TouchableOpacity
                  onPress={() => setIsFilterModalVisible(!isFilterModalVisible)}
                  className="mx-1"
                  style={styles.shadow}
                >
                  <Image
                    source={require("@/assets/images/filter5.png")}
                    alt="button"
                    className="w-10 h-10"
                  />
                </TouchableOpacity>

                {/* Back to recipes button */}
                <TouchableOpacity
                  onPress={goBackToRecipesFromFridge}
                  className="mx-1"
                  style={styles.shadow}
                >
                  <Image
                    source={require("@/assets/images/backToRecipeFridge2.png")}
                    alt="button"
                    className="w-14 h-12"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Take a picture arrow */}
      {user.token && !loading && fridgeItems.length === 0 && (
        <View className="flex m-10 justify-center items-center">
          <Text className="font-CreamyCookies text-2xl text-center">
            Or take a picture
          </Text>
          <BouncingImage>
            <Image
              source={require("../../assets/images/arrowDown.png")}
              className="w-12 h-12 top-8"
            />
          </BouncingImage>
        </View>
      )}

      {/* Autocomplete Search Modal */}
      {isSearchModalVisible && searchResults.length > 0 && (
        <Modal
          visible={isSearchModalVisible}
          onDismiss={() => setIsSearchModalVisible(false)}
        >
          <View className="flex justify-center items-center">
            <View className="bg-white p-10 rounded-lg items-center justify-center">
              <TouchableOpacity
                onPress={() => setIsSearchModalVisible(false)}
                className="absolute top-4 right-4"
              >
                <Image
                  source={require("../../assets/images/cross.png")}
                  className="w-6 h-6"
                />
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
              {searchMessage && (
                <Text className="text-lg text-red-500 my-2">
                  {searchMessage}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  addIngredientToFridge();
                  setIsSearchModalVisible(false);
                  setSearch("");
                }}
                className="relative flex justify-center items-center"
              >
                <Image
                  source={require("@/assets/images/button/button5.png")}
                  alt="button"
                  className="w-28 h-10"
                />
                <Text
                  className="text-lg text-white absolute font-Nobile"
                  style={styles.shadow}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        onDismiss={() => setIsFilterModalVisible(false)}
      >
        <View className="flex justify-center items-center">
          <View className=" bg-slate-50 rounded-lg p-10 items-center justify-center">
            <TouchableOpacity
              onPress={() => setIsFilterModalVisible(false)}
              className="absolute top-3 right-3"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <List.Section className="flex justify-center items-center bg-slate-50">
              <List.Accordion
                className="flex justify-center items-center w-48 bg-slate-50"
                id={1}
                title="Name"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 18,
                }}
                left={(props) => (
                  <MaterialCommunityIcons
                    {...props}
                    name="sort-alphabetical-variant"
                    size={26}
                    color={"#FF9B50"}
                  />
                )}
              >
                <List.Item
                  title="⚬ A → Z"
                  onPress={() => filterIngredients("name", "asc")}
                />
                <List.Item
                  title="⚬ Z → A"
                  onPress={() => filterIngredients("name", "desc")}
                />
              </List.Accordion>
              <List.Accordion
                className="flex justify-center items-center w-48 bg-slate-50"
                id={2}
                title="Selected"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 18,
                }}
                left={(props) => (
                  <MaterialCommunityIcons
                    {...props}
                    name="target"
                    size={26}
                    color={"#FF9B50"}
                  />
                )}
              >
                <List.Item
                  title="⚬ ⬜️ to ☑️"
                  onPress={() => filterIngredients("checked", "asc")}
                />
                <List.Item
                  title="⚬ ☑️ to ⬜️"
                  onPress={() => filterIngredients("checked", "desc")}
                />
              </List.Accordion>
              <List.Accordion
                className="flex justify-center items-center w-48 bg-slate-50"
                id={3}
                title="Date"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 18,
                }}
                left={(props) => (
                  <MaterialCommunityIcons
                    {...props}
                    name="calendar-month-outline"
                    size={26}
                    color={"#FF9B50"}
                  />
                )}
              >
                <List.Item
                  title="⚬ Old → New"
                  onPress={() => filterIngredients("dateAdded", "asc")}
                />
                <List.Item
                  title="⚬ New → Old"
                  onPress={() => filterIngredients("dateAdded", "desc")}
                />
              </List.Accordion>
            </List.Section>
            <TouchableOpacity
              onPress={clearFilters}
              className="relative flex justify-center items-center top-4"
              style={styles.shadow}
            >
              <Image
                source={require("@/assets/images/button/button11.png")}
                alt="button"
                className="w-36 h-12"
              />
              <Text className="text-lg text-white absolute font-Nobile">
                Clear Sort
              </Text>
            </TouchableOpacity>
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
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
