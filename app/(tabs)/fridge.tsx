import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Background from "@/components/Background";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import RNBounceable from "@freakycoder/react-native-bounceable";

export default function Fridge() {
  const navigation = useNavigation();
  const fridgeItems = [
    {
      id: 1,
      name: "Milk",
      checked: false,
    },
    {
      id: 2,
      name: "Eggs",
      checked: false,
    },
    {
      id: 3,
      name: "Cheese",
      checked: false,
    },
    {
      id: 4,
      name: "Butter",
      checked: false,
    },
  ];

  const searchRecipesFromIngredients = async () => {
    const selectedIgredients = fridgeItems.filter((item) => item.checked);
    console.log("Selected Ingredients:", selectedIgredients);
    const ingredients = selectedIgredients.map((item) => item.name);
    console.log("Ingredients:", ingredients);
    const searchQuery = ingredients.join(",").toLowerCase();

    navigation.navigate("recipesFromFridge", { searchQuery });
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
      <View className="justify-center items-center">
        <Text className="text-cyan-800 text-xl ">My Fridge and Pantry</Text>
        <Link href="/addItemsFridge">Add Items Fridge</Link>
      </View>
      <View className="flex justify-center items-center">
        {fridgeItems.map((item) => (
          <View key={item.id} className="w-[200] p-2">
            <BouncyCheckbox
              onPress={() => (item.checked = !item.checked)}
              isChecked={item.checked}
              size={25}
              text={item.name}
              textStyle={{
                fontFamily: "Nobile",
                color: "black",
                fontSize: 14,
                textDecorationLine: "none",
              }}
              fillColor={"green"}
              unFillColor={"transparent"}
              innerIconStyle={{ borderWidth: 2, borderColor: "black" }}
              bounceEffectIn={0.6}
            />
            <RNBounceable
              onPress={() => (item.checked = !item.checked)}
            ></RNBounceable>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={searchRecipesFromIngredients}
        className="relative flex justify-center items-center top-4"
      >
        <Image
          source={require("@/assets/images/button/button3.png")}
          alt="button"
          className="w-40 h-12"
        />
        <Text
          className="text-lg text-white absolute"
          style={{ fontFamily: "Nobile" }}
        >
          Search Recipes
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
