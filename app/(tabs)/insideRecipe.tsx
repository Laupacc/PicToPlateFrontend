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
  Modal,
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
  const [ingredientSubstitutes, setIngredientSubstitutes] = useState([]);
  const [ingSubModalVisible, setIngSubModalVisible] = useState(false);
  const [showWinePairing, setShowWinePairing] = useState(false);
  const [winePairing, setWinePairing] = useState([]);
  const [wineDescription, setWineDescription] = useState("");

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

  const fetchIngredientSubstitution = async (id) => {
    try {
      const response = await fetch(
        `http://192.168.1.34:3000/recipes/ingredientSubstitutes/${id}`
      );
      const data = await response.json();
      setIngredientSubstitutes(data.substitutes);
      setIngSubModalVisible(true);
      return data.substitutes;
    } catch (error) {
      console.log("Error fetching ingredient substitutes:", error.message);
      throw error;
    }
  };

  const fetchWinePairing = async (food, wine) => {
    try {
      const winePairing = await fetch(
        `http://192.168.1.34:3000/recipes/winePairing/${food}`
      );
      const wineDescription = await fetch(
        `http://192.168.1.34:3000/recipes/wineDescription/${wine}`
      );
      const data = await winePairing.json();
      const description = await wineDescription.json();
      setWinePairing(data.winePairing);
      setWineDescription(description.wineDescription);
      return data.winePairing;
    } catch (error) {
      console.log("Error fetching wine pairing:", error.message);
      throw error;
    }
  };

  const fetchSimilarRecipes = async (id) => {
    try {
      const response = await fetch(
        `http://192.168.1.34:3000/recipes/similarRecipes/${id}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Error fetching similar recipes:", error.message);
      throw error;
    }
  };

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

  const imageForWine = (wine) => {
    const wineImages = {
      white_wine: require("../../assets/images/whitewine.png"),
      red_wine: require("../../assets/images/redwine.png"),
      rose_wine: require("../../assets/images/rosewine.png"),
      dessert_wine: require("../../assets/images/dessertwine.png"),
      sparkling_wine: require("../../assets/images/sparklingwine.png"),
      default: require("../../assets/images/defaultwine.png"),
    };

    const wineCategories = {
      assyrtiko: "white_wine",
      pinot_blanc: "white_wine",
      cortese: "white_wine",
      roussanne: "white_wine",
      moschofilero: "white_wine",
      muscadet: "white_wine",
      viognier: "white_wine",
      verdicchio: "white_wine",
      greco: "white_wine",
      marsanne: "white_wine",
      white_burgundy: "white_wine",
      chardonnay: "white_wine",
      gruener_veltliner: "white_wine",
      white_rioja: "white_wine",
      frascati: "white_wine",
      gavi: "white_wine",
      l_acadie_blanc: "white_wine",
      trebbiano: "white_wine",
      sauvignon_blanc: "white_wine",
      catarratto: "white_wine",
      albarino: "white_wine",
      arneis: "white_wine",
      verdejo: "white_wine",
      vermentino: "white_wine",
      soave: "white_wine",
      pinot_grigio: "white_wine",
      dry_riesling: "white_wine",
      torrontes: "white_wine",
      mueller_thurgau: "white_wine",
      grechetto: "white_wine",
      gewurztraminer: "white_wine",
      chenin_blanc: "white_wine",
      white_bordeaux: "white_wine",
      semillon: "white_wine",
      riesling: "white_wine",
      sauternes: "white_wine",
      sylvaner: "white_wine",
      lillet_blanc: "white_wine",
      petite_sirah: "red_wine",
      zweigelt: "red_wine",
      baco_noir: "red_wine",
      bonarda: "red_wine",
      cabernet_franc: "red_wine",
      bairrada: "red_wine",
      barbera_wine: "red_wine",
      primitivo: "red_wine",
      pinot_noir: "red_wine",
      nebbiolo: "red_wine",
      dolcetto: "red_wine",
      tannat: "red_wine",
      negroamaro: "red_wine",
      red_burgundy: "red_wine",
      corvina: "red_wine",
      rioja: "red_wine",
      cotes_du_rhone: "red_wine",
      grenache: "red_wine",
      malbec: "red_wine",
      zinfandel: "red_wine",
      sangiovese: "red_wine",
      carignan: "red_wine",
      carmenere: "red_wine",
      cesanese: "red_wine",
      cabernet_sauvignon: "red_wine",
      aglianico: "red_wine",
      tempranillo: "red_wine",
      shiraz: "red_wine",
      mourvedre: "red_wine",
      merlot: "red_wine",
      nero_d_avola: "red_wine",
      bordeaux: "red_wine",
      marsala: "red_wine",
      gamay: "red_wine",
      dornfelder: "red_wine",
      concord_wine: "red_wine",
      sparkling_red_wine: "red_wine",
      pinotage: "red_wine",
      agiorgitiko: "red_wine",
      pedro_ximenez: "dessert_wine",
      moscato: "dessert_wine",
      late_harvest: "dessert_wine",
      ice_wine: "dessert_wine",
      white_port: "dessert_wine",
      lambrusco_dolce: "dessert_wine",
      madeira: "dessert_wine",
      banyuls: "dessert_wine",
      vin_santo: "dessert_wine",
      port: "dessert_wine",
      cava: "sparkling_wine",
      cremant: "sparkling_wine",
      champagne: "sparkling_wine",
      prosecco: "sparkling_wine",
      spumante: "sparkling_wine",
      sparkling_rose: "sparkling_wine",
      cream_sherry: "default",
      dry_sherry: "default",
      dry_vermouth: "default",
      fruit_wine: "default",
      mead: "default",
    };
    const category = wineCategories[wine];
    if (category) {
      return wineImages[category];
    } else {
      return wineImages.default;
    }
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
                      <View className="flex flex-row justify-center items-center">
                        <Ionicons
                          name="plus-circle"
                          size={20}
                          color={"#149575"}
                          onPress={fetchIngredientSubstitution}
                        ></Ionicons>
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
            {/* Ingredient substitution modal */}\
            <Modal
              animationType="slide"
              visible={ingSubModalVisible}
              onRequestClose={() => {
                setIngSubModalVisible(!ingSubModalVisible);
              }}
            >
              <View className="flex justify-center items-center">
                <View className="flex justify-center items-center bg-white rounded-2xl m-2 p-2">
                  <Text>Ingredient Substitutions</Text>
                  {ingredientSubstitutes.map((substitute, index) => (
                    <View
                      key={index}
                      className="flex flex-row justify-between items-center rounded-2xl m-2 p-3 border"
                      style={{
                        width: screenWidth - 70,
                      }}
                    >
                      <Text
                        className="text-justify p-1 mx-2"
                        style={{
                          fontFamily: "Nobile",
                          fontSize: 15,
                        }}
                      >
                        {substitute}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIngSubModalVisible(!ingSubModalVisible)}
                className="absolute top-5 right-5"
              >
                <Ionicons name="close" size={30} />
              </TouchableOpacity>
            </Modal>
            {/* Wine Pairing */}
            <View className="flex justify-center items-center m-2">
              <TouchableOpacity
                onPress={() => {
                  setShowWinePairing(true);
                  fetchWinePairing(recipe.title, recipe.winePairing);
                }}
                className="p-2 m-2 bg-white rounded-xl"
              >
                <Text className="text-lg">Show Wine Pairing</Text>
              </TouchableOpacity>
            </View>
            {showWinePairing && (
              <View className="flex justify-center items-center m-2">
                <View className="flex justify-center items-center bg-white rounded-2xl m-2 p-2">
                  <Text>Wine Pairing</Text>
                  {winePairing.map((wine, index) => (
                    <View
                      key={index}
                      className="flex justify-between items-center rounded-2xl m-2 p-3 border"
                      style={{
                        width: screenWidth - 70,
                      }}
                    >
                      <Text
                        className="text-justify p-1 mx-2"
                        style={{
                          fontFamily: "Nobile",
                          fontSize: 15,
                        }}
                      >
                        {wine}
                      </Text>
                      <Image
                        source={imageForWine(wine)}
                        className="w-10 h-10 rounded-2xl m-1"
                      />
                    </View>
                  ))}
                  <Text>{wineDescription}</Text>

                  <TouchableOpacity
                    onPress={() => setShowWinePairing(false)}
                    className="absolute top-5 right-5"
                  >
                    <Ionicons name="close" size={30} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
