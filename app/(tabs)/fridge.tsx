import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Dimensions,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { TextInput, ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { Modal, List } from "react-native-paper";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import Background from "@/components/Background";
import BouncingImage from "@/components/Bounce";
import { BACKEND_URL } from "@/_recipeUtils";
import { RootState } from "@/store/store";
import {
  addIngredient,
  removeIngredient,
  updateIngredients,
} from "@/store/fridge";

export default function Fridge() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state: RootState) => state.user.value);
  const ingredients = useSelector(
    (state: RootState) => state.fridge.ingredients
  ) as any[];

  const isInitialMount = useRef<boolean>(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const [fridgeItems, setFridgeItems] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState<any[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<any[]>([]);
  const [isSearchModalVisible, setIsSearchModalVisible] =
    useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] =
    useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [directInput, setDirectInput] = useState<string>("");

  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  // Set the status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  // Fetch fridge items from the backend
  useEffect(() => {
    const fetchFridgeItems = async () => {
      if (!user.token) return;
      try {
        if (isInitialMount.current) {
          setLoading(true);
        }

        const response = await fetch(
          `${BACKEND_URL}/users/fetchIngredients/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch fridge items");
        }
        const data = await response.json();
        console.log(
          "Fridge items:",
          data.ingredients.map((item: any) => item.name)
        );

        const allItems = data.ingredients.map((item: any) => ({
          name: item.name,
          dateAdded: item.dateAdded,
          checked: false,
        }));

        dispatch(updateIngredients(allItems));
        setFridgeItems(allItems);
      } catch (error) {
        console.error(error);
      } finally {
        if (isInitialMount.current) {
          setLoading(false);
          isInitialMount.current = false;
        }
      }
    };
    fetchFridgeItems();
  }, [user.token, ingredients.length]);

  // Auto-scroll to the end of the list when new items are added
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [fridgeItems]);

  // Search recipes from selected ingredients
  const searchRecipesFromIngredientsSelected = async () => {
    const selectedIgredients = ingredients.filter((item) => item.checked);
    setSelectedIngredients(selectedIgredients);
    if (selectedIgredients.length === 0) {
      toast.show("Select at least one ingredient to search for", {
        type: "warning",
        placement: "center",
        duration: 1000,
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
  const autocompleteSearchIngredient = async (query: string) => {
    if (query.length === 0) {
      toast.show("Enter a search item", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return false;
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
        !data.some(
          (item: any) => item.name.toLowerCase() === query.toLowerCase()
        )
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
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
      }
      return true;
    } catch (error) {
      console.error(error);
    }
  };

  // Select ingredients from search modal
  const toggleIngredientSelected = (ingredient: any) => {
    setSelectedFromSearch((prev) => {
      const index = prev.findIndex((item) => item.name === ingredient.name);
      if (index === -1) {
        return [...prev, ingredient];
      } else {
        return prev.filter((item) => item.name !== ingredient.name);
      }
    });
  };

  // Add selected ingredients to fridge from search modal
  const addIngredientToFridge = async () => {
    if (selectedFromSearch.length === 0) {
      toast.show("Select at least one ingredient to add", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return false;
    }
    try {
      // Filter out ingredients that are already in the fridgeItems state
      const newIngredients = selectedFromSearch.filter(
        (item) =>
          !fridgeItems.some(
            (fridgeItem) =>
              fridgeItem.name.toLowerCase() === item.name.toLowerCase()
          )
      );

      // Alert if some ingredients are already in the fridge
      if (newIngredients.length < selectedFromSearch.length) {
        const alreadyInFridgeNames = selectedFromSearch
          .filter((item) =>
            fridgeItems.some((fridgeItem) => fridgeItem.name === item.name)
          )
          .map((item) => item.name.charAt(0).toUpperCase() + item.name.slice(1))
          .join(", ");

        const message = `${alreadyInFridgeNames} ${
          alreadyInFridgeNames.length > 1 ? "are" : "is"
        } already in your kitchen`;

        toast.show(message, {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        });
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

        dispatch(addIngredient(newIngredients));
        setFridgeItems((prev) => [...prev, ...newIngredients]);
        setSelectedFromSearch([]);
        setDirectInput("");

        const newIngredientsNames = newIngredients
          .map((item) => item.name.charAt(0).toUpperCase() + item.name.slice(1))
          .join(", ");

        toast.show(`${newIngredientsNames} have been added successfully`, {
          type: "success",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
        });
        return true;
      } else {
        console.log("No new ingredients to add");
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // Handle adding an ingredient directly from the input field
  const addDirectIngredientToFridge = async () => {
    const trimmedInput = directInput.trim().toLowerCase();

    if (trimmedInput.length === 0) {
      toast.show("Enter an ingredient to add", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return false;
    }

    const newIngredient = {
      name: trimmedInput,
      dateAdded: new Date().toISOString(),
    };
    if (
      fridgeItems.some(
        (item) => item.name.toLowerCase() === newIngredient.name.toLowerCase()
      )
    ) {
      toast.show(
        `${
          newIngredient.name.charAt(0).toUpperCase() +
          newIngredient.name.slice(1)
        } is already in your kitchen`,
        {
          type: "warning",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="warning" size={24} color="white" />,
        }
      );
      return false;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/users/addIngredient/${user.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients: [newIngredient],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add ingredient to fridge");
      }
      const data = await response.json();
      console.log("Added ingredient to fridge:", data);

      // Update the local state with the new ingredient
      dispatch(addIngredient([newIngredient]));
      setFridgeItems((prev) => [...prev, newIngredient.name]);
      setDirectInput("");
      setSearch("");

      toast.show(
        `${
          newIngredient.name.charAt(0).toUpperCase() +
          newIngredient.name.slice(1)
        } has been added successfully`,
        {
          type: "success",
          placement: "center",
          duration: 1000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
        }
      );

      return true;
    } catch (error) {
      console.error(error);
      toast.show("Failed to add ingredient. Please try again.", {
        type: "danger",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="alert-circle" size={24} color="white" />,
      });
      return false;
    }
  };

  // Select several ingredients to remove
  const toggleIngredientSelectedToRemove = (ingredient: any) => {
    if (selectedToRemove.includes(ingredient)) {
      setSelectedToRemove((prev) => prev.filter((name) => name !== ingredient));
    } else {
      setSelectedToRemove((prev) => [...prev, ingredient]);
    }
  };

  // Remove selected ingredients
  const removeSelectedIngredients = async () => {
    if (selectedToRemove.length === 0) {
      toast.show("Select at least one ingredient to delete", {
        type: "danger",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      return;
    }
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

              const ingredientsNamestoRemove = selectedToRemove
                .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
                .join(", ");

              setFridgeItems((prev) =>
                prev.filter((item) => !selectedToRemove.includes(item.name))
              );
              dispatch(removeIngredient(selectedToRemove));
              setSelectedToRemove([]);

              const ingredientCount = selectedToRemove.length;
              const message = `${ingredientsNamestoRemove} ${
                ingredientCount > 1 ? "have" : "has"
              } been successfully deleted`;

              toast.show(message, {
                type: "success",
                placement: "center",
                duration: 5000,
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
                duration: 1000,
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

  // Filter ingredients by name, dateAdded or checked
  const filterIngredients = (criteria: string, sortOrder: string) => {
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
            ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
            : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
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
      toast.show("No recipe searches performed yet", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-20">
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
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-center items-center">
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
                  <ActivityIndicator
                    size="large"
                    color="#237CB0"
                    className="flex-1"
                  />
                ) : user.token && fridgeItems.length === 0 ? (
                  // User is logged in but fridge is empty
                  <View className="flex justify-center items-center mx-20">
                    <Text className="font-CreamyCookies text-3xl text-center">
                      You don't have any ingredients in your kitchen yet. Add
                      some now!
                    </Text>
                    <View className="flex flex-row m-10 justify-center items-center">
                      <Image
                        source={require("../../assets/images/curvedArrowDownLeft.png")}
                        className="w-12 h-12 top-5 mx-4"
                      />

                      <Text className="font-CreamyCookies text-2xl">Here!</Text>
                    </View>
                  </View>
                ) : (
                  user.token &&
                  fridgeItems.length > 0 && (
                    // User is logged in and fridge items are displayed
                    <>
                      {/* <View className="border-2 border-slate-400 h-[550] p-1 rounded-3xl mt-2 relative"> */}
                      <View
                        className="h-[550] p-1 mt-5 relative flex justify-center items-center mb-6 bg-slate-200"
                        style={styles.shadow}
                      >
                        <Image
                          source={require("../../assets/images/fridge/fridgeSideRight.png")}
                          className="absolute top-0 right-1 h-[100%] w-[12]"
                          style={{
                            resizeMode: "stretch",
                          }}
                        />
                        <Image
                          source={require("../../assets/images/fridge/fridgeSideLeft.png")}
                          className="absolute top-0 left-1 h-[100%] w-[12]"
                          style={{
                            resizeMode: "stretch",
                          }}
                        />
                        <Image
                          source={require("../../assets/images/fridge/fridgeTopRounded.png")}
                          className="absolute -top-4 left-0 right-0 h-[18] w-[420]"
                          style={{ resizeMode: "stretch" }}
                        />
                        <Image
                          source={require("../../assets/images/fridge/fridgeBottom.png")}
                          className="absolute -bottom-6 left-0 right-0 h-[33] w-[421]"
                          style={{ resizeMode: "stretch" }}
                        />

                        <ScrollView
                          ref={scrollViewRef}
                          className="flex-1 px-4 mb-2"
                        >
                          <View className="flex justify-center items-center mb-2">
                            {fridgeItems &&
                              fridgeItems.map((item, index) => (
                                <View key={index} className="relative p-1 m-1">
                                  <View
                                    className="absolute bg-[#FF9B50] rounded-2xl -right-0.5 -bottom-0.5"
                                    style={{
                                      width: screenWidth - 65,
                                      height: 55,
                                      ...styles.shadow,
                                    }}
                                  ></View>
                                  <View
                                    className="flex flex-row justify-between items-center bg-white rounded-2xl p-2"
                                    style={{
                                      width: screenWidth - 65,
                                      height: 55,
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
                                            showsHorizontalScrollIndicator={
                                              false
                                            }
                                          >
                                            <View className="flex-row justify-center items-center ml-2">
                                              <Text className="text-lg text-slate-600">
                                                {item.name
                                                  ?.charAt(0)
                                                  .toUpperCase() +
                                                  item.name?.slice(1)}
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
                                          const updatedItems = fridgeItems.map(
                                            (i) =>
                                              i.name === item.name
                                                ? { ...i, checked: isChecked }
                                                : i
                                          );
                                          setFridgeItems(updatedItems);
                                          dispatch(
                                            updateIngredients(updatedItems)
                                          );
                                        }}
                                      />
                                      <RNBounceable
                                        className="flex justify-center items-center"
                                        onPress={() => {
                                          const updatedItems =
                                            fridgeItems.filter(
                                              (i) => i.name !== item.name
                                            );
                                          setFridgeItems(updatedItems);
                                          // dispatch(updateIngredients(updatedItems));
                                        }}
                                      ></RNBounceable>
                                    </View>
                                    <TouchableOpacity
                                      onPress={() =>
                                        toggleIngredientSelectedToRemove(
                                          item.name
                                        )
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
                                        <Feather
                                          name="square"
                                          size={20}
                                          color="grey"
                                        />
                                      )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      className="absolute right-2"
                                      onPress={() =>
                                        toggleIngredientSelectedToRemove(
                                          item.name
                                        )
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

                      <View className="flex flex-row justify-center items-center">
                        {/* Search Recipes Button */}
                        <View className="flex justify-center items-center">
                          <TouchableOpacity
                            onPress={searchRecipesFromIngredientsSelected}
                            className="relative flex justify-center items-center mx-1"
                            style={styles.shadow}
                          >
                            <Image
                              source={require("@/assets/images/button/button9.png")}
                              alt="button"
                              className="w-32 h-10"
                            />
                            <Text className="text-sm text-white absolute font-Nobile">
                              Search Recipes
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Remove Ingredients Button */}
                        <View className="flex justify-center items-center">
                          <TouchableOpacity
                            onPress={removeSelectedIngredients}
                            className="relative flex justify-center items-center mx-1"
                            style={styles.shadow}
                          >
                            <Image
                              source={require("@/assets/images/button/button5.png")}
                              alt="button"
                              className="w-32 h-10"
                            />
                            <Text className="text-sm text-white absolute font-Nobile">
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Filter button */}
                        <TouchableOpacity
                          onPress={() =>
                            setIsFilterModalVisible(!isFilterModalVisible)
                          }
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
                      </View>
                    </>
                  )
                )}

                {/* Search Bar, Add button, Search Button */}
                {user.token && !loading && (
                  <View className="flex justify-center items-center">
                    <View
                      className={
                        fridgeItems.length === 0
                          ? "flex flex-row justify-center items-center bottom-24"
                          : "flex flex-row justify-center items-center"
                      }
                    >
                      <View className="flex justify-center items-center mx-2">
                        <View className="items-center justify-center relative w-full">
                          <KeyboardAvoidingView
                            behavior={
                              Platform.OS === "ios" ? "padding" : "height"
                            }
                          >
                            <TextInput
                              placeholder="Add or search for ingredient"
                              placeholderTextColor={"gray"}
                              value={directInput && search}
                              onChangeText={(text) => {
                                setSearch(text);
                                setDirectInput(text);
                              }}
                              className="bg-[#e2e8f0] border border-gray-400 pl-4 rounded-lg w-64 h-10 font-Nobile"
                            />
                            <TouchableOpacity
                              onPress={() => {
                                setSearch("");
                                setDirectInput("");
                              }}
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
                          </KeyboardAvoidingView>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={addDirectIngredientToFridge}
                        style={styles.shadow}
                      >
                        <Image
                          source={require("@/assets/images/addIcon.png")}
                          alt="add"
                          className="w-9 h-9 mx-2"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          const success = await autocompleteSearchIngredient(
                            search
                          );
                          if (success) {
                            setIsSearchModalVisible(true);
                          }
                        }}
                        style={styles.shadow}
                      >
                        <Image
                          source={require("@/assets/images/search2.png")}
                          alt="search"
                          className="w-9 h-9 mx-2"
                        />
                      </TouchableOpacity>
                    </View>
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

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
                onPress={async () => {
                  const success = await addIngredientToFridge();
                  if (success) {
                    setIsSearchModalVisible(false);
                    setSearch("");
                  }
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
          <View className="bg-white rounded-2xl p-10 items-center justify-center">
            <TouchableOpacity
              onPress={() => setIsFilterModalVisible(false)}
              className="absolute top-3 right-3"
            >
              <Image
                source={require("../../assets/images/cross.png")}
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <List.Section className="flex justify-center items-center">
              <List.Accordion
                style={[styles.accordion, { borderColor: "#64E6A6" }]}
                id={1}
                title="Name"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 15,
                }}
                left={(props) => (
                  <MaterialCommunityIcons
                    {...props}
                    name="sort-alphabetical-variant"
                    size={24}
                  />
                )}
              >
                <List.Item
                  title="⚬ A → Z"
                  onPress={() => {
                    filterIngredients("name", "asc");
                    setIsFilterModalVisible(false);
                  }}
                />
                <List.Item
                  title="⚬ Z → A"
                  onPress={() => {
                    filterIngredients("name", "desc");
                    setIsFilterModalVisible(false);
                  }}
                />
              </List.Accordion>
              <List.Accordion
                style={[styles.accordion, { borderColor: "#fa9c55" }]}
                id={2}
                title="Selected"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 15,
                }}
                left={(props) => (
                  <MaterialCommunityIcons {...props} name="target" size={24} />
                )}
              >
                <List.Item
                  title="⚬ ⬜️ to ☑️"
                  onPress={() => {
                    filterIngredients("checked", "asc");
                    setIsFilterModalVisible(false);
                  }}
                />
                <List.Item
                  title="⚬ ☑️ to ⬜️"
                  onPress={() => {
                    filterIngredients("checked", "desc");
                    setIsFilterModalVisible(false);
                  }}
                />
              </List.Accordion>
              <List.Accordion
                style={[styles.accordion, { borderColor: "#0cbac7" }]}
                id={3}
                title="Date"
                titleStyle={{
                  fontFamily: "Nobile",
                  color: "#475569",
                  fontSize: 15,
                }}
                left={(props) => (
                  <MaterialCommunityIcons
                    {...props}
                    name="calendar-month-outline"
                    size={24}
                  />
                )}
              >
                <List.Item
                  title="⚬ Old → New"
                  onPress={() => {
                    filterIngredients("dateAdded", "asc");
                    setIsFilterModalVisible(false);
                  }}
                />
                <List.Item
                  title="⚬ New → Old"
                  onPress={() => {
                    filterIngredients("dateAdded", "desc");
                    setIsFilterModalVisible(false);
                  }}
                />
              </List.Accordion>
            </List.Section>
            <TouchableOpacity
              onPress={() => {
                setFridgeItems(ingredients);
                setIsFilterModalVisible(false);
              }}
              className="relative flex justify-center items-center top-3"
              style={styles.shadow}
            >
              <Text className="text-lg font-Nobile text-slate-800">
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
  accordion: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 192, // 48 * 4 (since React Native uses pixels)
    borderWidth: 2,
    borderRadius: 8, // rounded-lg
    height: 64, // 16 * 4
    marginBottom: 8, // 2 * 4
  },
});
