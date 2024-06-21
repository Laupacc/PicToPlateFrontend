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
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useState, useEffect } from "react";
import Background from "@/components/Background";
// import AppText from "@/components/AppText";
import {
  fetchRandomRecipe,
  fetchRecipeInformation,
  fetchAnalyzedInstructions,
} from "@/apiFunctions";

export default function InsideRecipe() {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(0);
  const [unitSystem, setUnitSystem] = useState("us");
  const [dynamicHeight, setDynamicHeight] = useState(0);

  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        const recipeData = await fetchRecipeInformation(recipeId);
        const instructions = await fetchAnalyzedInstructions(recipeId);
        if (recipeData && instructions) {
          setRecipe({ ...recipeData, analyzedInstructions: instructions });
          setServings(recipeData.servings);

          console.log("recipe data", recipeData);
          console.log("intruction data", instructions);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchRecipeData();
  }, [recipeId]);

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

  const randomPostitImage = () => {
    const images = [
      require("../../assets/images/postit1.png"),
      require("../../assets/images/postit2.png"),
      require("../../assets/images/postit3.png"),
      require("../../assets/images/postit4.png"),
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const handleFetchRandomRecipe = async () => {
    const randomRecipe = await fetchRandomRecipe();
    navigation.navigate("insideRecipe", { recipeId: randomRecipe.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Background cellSize={25} />
      <ScrollView>
        {recipe && (
          <View style={styles.innerContainer}>
            {/* Recipe Image and box behind  */}
            <View className="relative">
              <View
                style={{
                  position: "absolute",
                  backgroundColor: "#B5A8FF",
                  right: -8,
                  bottom: -8,
                  width: screenWidth,
                  height: calculatedHeight,
                  borderRadius: Math.min(screenWidth, calculatedHeight) / 2,
                  overflow: "hidden",
                  borderBottomRightRadius: 130,
                  borderTopRightRadius: 130,
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
              <View
                style={{
                  width: Math.min(screenWidth, calculatedHeight),
                  height: Math.min(screenWidth, calculatedHeight),
                  borderRadius: Math.min(screenWidth, calculatedHeight) / 2,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: recipe.image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "cover",
                  }}
                />
              </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-5 left-5"
            >
              <Ionicons name="arrow-undo-sharp" size={30} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFetchRandomRecipe}
              className="absolute top-5 right-5"
            >
              <FontAwesome name="random" size={30} />
            </TouchableOpacity>

            {/* Recipe Title */}
            <Text style={styles.title}>{recipe.title}</Text>

            {/* Recipe Attributes */}
            <ScrollView>
              <View className="flex flex-row m-1 flex-wrap justify-center items-center">
                {recipe.vegetarian && (
                  <Text style={styles.attributes}>Vegetarian</Text>
                )}
                {recipe.vegan && <Text style={styles.attributes}>Vegan</Text>}
                {recipe.glutenFree && (
                  <Text style={styles.attributes}>Gluten Free</Text>
                )}
                {recipe.dairyFree && (
                  <Text style={styles.attributes}>Dairy Free</Text>
                )}
                {recipe.veryHealthy && (
                  <Text style={styles.attributes}>Very Healthy</Text>
                )}
                {recipe.cheap && <Text style={styles.attributes}>Cheap</Text>}
                {recipe.veryPopular && (
                  <Text style={styles.attributes}>Very Popular</Text>
                )}
                {recipe.sustainable && (
                  <Text style={styles.attributes}>Sustainable</Text>
                )}
                {recipe.ketogenic && (
                  <Text style={styles.attributes}>Ketogenic</Text>
                )}
              </View>
            </ScrollView>

            {/* Switch , time and servings */}
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

              {/* Ingredients list */}
              {recipe.extendedIngredients?.map((ingredient, index: number) => (
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
                      <View className="flex flex-row justify-center items-center w-[260] mx-2">
                        {ingredient.image ? (
                          <Image
                            source={{
                              uri: constructImageUrl(ingredient.image),
                            }}
                            className="w-12 h-12"
                          />
                        ) : null}
                        <ScrollView>
                          <Text
                            className="ml-2 flex flex-wrap"
                            style={{
                              fontFamily: "Nobile",
                              fontSize: 15,
                            }}
                          >
                            {ingredient.originalName.charAt(0).toUpperCase() +
                              ingredient.originalName.slice(1)}
                          </Text>
                        </ScrollView>
                      </View>
                      <View className="flex flex-row items-center justify-center mr-3">
                        <Text
                          style={{
                            fontFamily: "Nobile",
                            fontSize: 15,
                          }}
                        >
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

            {/* Box behind instructions */}
            <View className="relative mb-5">
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
                {/* Instructions, steps */}
                {recipe.analyzedInstructions &&
                  recipe.analyzedInstructions.length > 0 &&
                  recipe.analyzedInstructions[0].steps.map(
                    (instruction, index) => (
                      <View
                        key={index}
                        className="flex justify-between items-center rounded-2xl m-2 p-3 border"
                        style={{
                          width: screenWidth - 70,
                        }}
                      >
                        <View
                          className="flex justify-center items-center w-16 h-16 relative"
                          style={{
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                          }}
                        >
                          <Image
                            source={randomPostitImage()}
                            className="absolute inset-0 w-full h-full"
                          />
                          <Text
                            style={{
                              fontFamily: "Nobile",
                              fontSize: 14,
                            }}
                            className="text-center"
                          >
                            Step {instruction.number}
                          </Text>
                        </View>
                        {/* <View className="flex flex-row justify-center items-center m-1 flex-wrap">
                          {instruction.ingredients &&
                            instruction.ingredients.map((ingredient, index) => (
                              <View key={index}>
                                {ingredient.image && (
                                  <Image
                                    source={{ uri: ingredient.image }}
                                    className="w-10 h-10 rounded-2xl m-1"
                                  />
                                )}
                              </View>
                            ))}
                        </View> */}
                        <Text
                          className="text-justify p-1 mx-2"
                          style={{
                            fontFamily: "Nobile",
                            fontSize: 15,
                          }}
                        >
                          {instruction.step}
                        </Text>
                        {/* {instruction.equipment &&
                          instruction.equipment.map((equipment, index) => (
                            <View key={index}>
                              <Text>Equipment needed: {equipment.name}</Text>
                            </View>
                          ))} */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  attributes: {
    fontFamily: "Nobile",
    fontSize: 15,
    textAlign: "center",
    backgroundColor: "#F4C653",
    borderRadius: 10,
    padding: 5,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Flux",
    textAlign: "center",
    padding: 5,
    marginTop: 20,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
});
