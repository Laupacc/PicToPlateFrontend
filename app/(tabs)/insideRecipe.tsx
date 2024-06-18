import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
  StatusBar,
} from "react-native";
import React from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useState } from "react";
import Background from "@/components/Background";

export default function InsideRecipe() {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipe } = route.params || {};
  const [servings, setServings] = useState(recipe.servings);
  const [unitSystem, setUnitSystem] = useState("us");
  const [dynamicHeight, setDynamicHeight] = useState(0);

  const constructImageUrl = (imageFileName: string) => {
    return `https://spoonacular.com/cdn/ingredients_100x100/${imageFileName}`;
  };

  const screenWidth = Dimensions.get("window").width;
  const calculatedHeight = screenWidth * (9 / 16);

  const incrementServings = () => {
    setServings(servings + 1);
  };
  const decrementServings = () => {
    if (servings >= 1) {
      setServings(servings - 1);
    }
  };
  const attributes =
    "text-lg m-1 text-center text-slate-700 bg-[#F4C653] rounded px-2 py-0.5 shadow-3xl";

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-neutral-200">
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      <ScrollView>
        {recipe && (
          <View className="flex items-center justify-center">
            <View className="relative">
              <View
                className="absolute bg-[#B5A8FF] -right-2 -bottom-2"
                style={{
                  width: screenWidth,
                  height: calculatedHeight,
                  borderBottomRightRadius: 130,
                  borderBottomLeftRadius: 10,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 2,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 8,
                }}
              ></View>
              <Image
                source={{ uri: recipe.image }}
                style={{
                  width: screenWidth,
                  height: calculatedHeight,
                  resizeMode: "cover",
                  borderBottomRightRadius: 120,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-2 left-2"
            >
              <Ionicons name="arrow-undo-sharp" size={30} />
            </TouchableOpacity>

            <Text className="text-2xl m-2 text-center bold font-Steradian">
              {recipe.title}
            </Text>

            <ScrollView>
              <View className="flex flex-row m-1 flex-wrap justify-center items-center">
                {recipe.vegetarian && (
                  <Text className={attributes}>Vegetarian</Text>
                )}
                {recipe.vegan && <Text className={attributes}>Vegan</Text>}
                {recipe.glutenFree && (
                  <Text className={attributes}>Gluten Free</Text>
                )}
                {recipe.dairyFree && (
                  <Text className={attributes}>Dairy Free</Text>
                )}
                {recipe.veryHealthy && (
                  <Text className={attributes}>Very Healthy</Text>
                )}
                {recipe.cheap && <Text className={attributes}>Cheap</Text>}
                {recipe.veryPopular && (
                  <Text className={attributes}>Very Popular</Text>
                )}
                {recipe.sustainable && (
                  <Text className={attributes}>Sustainable</Text>
                )}
                {recipe.ketogenic && (
                  <Text className={attributes}>Ketogenic</Text>
                )}
              </View>
            </ScrollView>
            <View>
              <View className="flex flex-row justify-around items-center m-2">
                <View className="flex flex-row justify-center items-center m-2">
                  <Text className="text-md">Us</Text>
                  <Switch
                    value={unitSystem === "us"}
                    onValueChange={(value) =>
                      setUnitSystem(value ? "us" : "metric")
                    }
                    trackColor={{ false: "#ffb600", true: "#ffb600" }}
                    thumbColor={"#f94a00"}
                  ></Switch>
                  <Text className="text-md">Metric</Text>
                </View>
                <View className="flex justify-center items-center">
                  <Ionicons name="timer" size={40} color={"#149575"} />
                  <Text className="text-md">{recipe.readyInMinutes} mins</Text>
                </View>
                <View className="flex justify-center items-center">
                  <View className="flex flex-row justify-center items-center">
                    <TouchableOpacity onPress={decrementServings}>
                      <Ionicons
                        name="remove-circle"
                        size={40}
                        color={"#149575"}
                      />
                    </TouchableOpacity>
                    <Text className="mx-1 text-lg">{servings}</Text>
                    <TouchableOpacity onPress={incrementServings}>
                      <Ionicons name="add-circle" size={40} color={"#149575"} />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-md">Servings</Text>
                </View>
              </View>

              {recipe.extendedIngredients.map((ingredient, index: number) => (
                <>
                  <View className="relative">
                    <View
                      className="absolute bg-[#64E6A6] rounded-2xl right-0.5 bottom-0.5"
                      style={{
                        width: screenWidth - 45,
                        height: 70,
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
                      key={index}
                      className="flex flex-row justify-between items-center bg-white rounded-2xl m-2 p-2"
                      style={{
                        width: screenWidth - 40,
                        height: 80,
                      }}
                    >
                      <View className="flex flex-row justify-center items-center w-72">
                        {ingredient.image ? (
                          <Image
                            source={{
                              uri: constructImageUrl(ingredient.image),
                            }}
                            className="w-12 h-12"
                          />
                        ) : null}
                        <ScrollView>
                          <Text className="ml-2 flex flex-wrap">
                            {ingredient.originalName.charAt(0).toUpperCase() +
                              ingredient.originalName.slice(1)}
                          </Text>
                        </ScrollView>
                      </View>
                      <View className="flex flex-row items-center justify-center">
                        <Text>
                          {unitSystem === "metric"
                            ? Math.round(
                                ingredient.measures.us.amount *
                                  (servings / recipe.servings)
                              )
                            : Math.round(
                                ingredient.measures.metric.amount *
                                  (servings / recipe.servings)
                              )}{" "}
                          {unitSystem === "metric"
                            ? ingredient.measures.us.unitShort
                            : ingredient.measures.metric.unitShort}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ))}
            </View>

            <View className="relative">
              <View
                className="absolute bg-[#FF5045] rounded-2xl -right-0 -bottom-0"
                style={{
                  width: screenWidth - 45,
                  height: dynamicHeight,
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
                className="flex justify-center items-center bg-white rounded-2xl m-2 p-2"
                style={{
                  width: screenWidth - 40,
                }}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setDynamicHeight(height);
                }}
              >
                {recipe.analyzedInstructions &&
                  recipe.analyzedInstructions.length > 0 &&
                  recipe.analyzedInstructions[0].steps.map(
                    (instruction, index) => (
                      <View
                        key={index}
                        className="flex justify-between items-center rounded-2xl m-2 p-2 border"
                        style={{
                          width: screenWidth - 70,
                        }}
                      >
                        <View className="flex flex-row justify-center items-center m-1">
                          {instruction.ingredients &&
                            instruction.ingredients.map((ingredient, index) => (
                              <View key={index} className="mx-1 flex flex-wrap">
                                {/* <Text>{ingredient.name}</Text> */}
                                {ingredient.image && (
                                  <Image
                                    source={{ uri: ingredient.image }}
                                    className="w-10 h-10 rounded-lg"
                                  />
                                )}
                              </View>
                            ))}
                        </View>
                        <Text>Step {instruction.number}</Text>
                        <Text>{instruction.step}</Text>
                        {instruction.equipment &&
                          instruction.equipment.map((equipment, index) => (
                            <View key={index}>
                              <Text>Equipment needed: {equipment.name}</Text>
                            </View>
                          ))}
                      </View>
                    )
                  )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
