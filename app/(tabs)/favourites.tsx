import {
  Image,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import LottieView from "lottie-react-native";
import { RootState } from "@/store/store";
import { removeFromFavouriteRecipes } from "@/store/recipes";
import Background from "@/components/Background";
import {
  BACKEND_URL,
  removeRecipeFromFavourites,
  goToRecipeCard,
} from "@/_recipeUtils";

export default function Favourites() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state: RootState) => state.user.value);
  const favourites = useSelector(
    (state: RootState) => state.recipes.favourites
  );

  const isInitialMount = useRef<boolean>(true);
  const [favouriteRecipes, setFavouriteRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

  // Set status bar style
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  // fetch user info for favourite recipes
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user.token) return;
      try {
        if (isInitialMount.current) {
          setLoading(true);
        }

        const response = await fetch(
          `${BACKEND_URL}/users/userInformation/${user.token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const data = await response.json();
        console.log(
          "User id favourites fetched",
          data.favourites.map((fav: any) => fav.id)
        );
        setFavouriteRecipes(data.favourites);
        if (isInitialMount.current) {
          isInitialMount.current = false;
          setTimeout(() => setLoading(false), 1500);
        }
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };
    fetchUserInfo();
  }, [user.token, favourites.length]);

  // Remove recipe from favourites list
  const handleRemoveFromFavourites = async (recipeId: number) => {
    await removeRecipeFromFavourites(recipeId, user, toast);
    dispatch(removeFromFavouriteRecipes(recipeId));
    setFavouriteRecipes(favouriteRecipes.filter((r) => r.id !== recipeId));
  };

  // Go to recipe card
  const handleGoToRecipeCard = async (recipeId: number) => {
    const fromScreen = "favourites";
    await goToRecipeCard(recipeId, navigation, fromScreen);
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <Background cellSize={25} />
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <View
        className="flex justify-center items-center relative m-2 w-[330] h-[60]"
        style={styles.shadow}
      >
        <Image
          source={require("../../assets/images/stickers/redTape.png")}
          className="absolute inset-0 w-full h-full"
        />
        <Text className="font-Flux text-xl text-center text-white">
          My favourite recipes
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        {!user.token ? (
          <View
            className="flex items-center justify-center relative rounded-2xl w-[360] h-[460]"
            // style={styles.shadow}
          >
            <Image
              source={require("../../assets/images/recipeBack/recipeBack4.png")}
              className="absolute inset-0 w-full h-full"
            />
            <View className="flex items-center justify-center max-w-[180]">
              <TouchableOpacity
                onPress={() => navigation.navigate("authentication")}
                className="flex justify-center items-center mb-6"
                style={styles.shadow}
              >
                <Image
                  source={require("../../assets/images/keyholeSecurity.png")}
                  className="w-16 h-16"
                />
                <Text className="font-CreamyCookies text-blue-500 text-center text-3xl">
                  Log in
                </Text>
              </TouchableOpacity>
              <Text className="font-CreamyCookies text-center text-3xl">
                to see your favourite recipes
              </Text>
            </View>
          </View>
        ) : loading ? (
          <LottieView
            source={require("../../assets/images/animations/Animation1722874174540.json")}
            // source={require("../../assets/images/animations/Animation1722874735851.json")}
            autoPlay
            loop
            style={
              isSmallScreen
                ? { width: 300, height: 300, position: "absolute", top: 50 }
                : { width: 360, height: 360, position: "absolute", top: 100 }
            }
          />
        ) : user.token && favouriteRecipes.length === 0 ? (
          <View className="flex items-center justify-center relative rounded-2xl w-[360] h-[460]">
            <Image
              source={require("../../assets/images/recipeBack/recipeBack4.png")}
              className="absolute inset-0 w-full h-full"
              style={styles.shadow}
            />
            <View className="flex items-center justify-center max-w-[180]">
              <Text className="font-CreamyCookies text-center text-3xl">
                You don't have any favourite recipes saved yet
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView className="flex-1">
            {user.token &&
              favouriteRecipes.length > 0 &&
              favouriteRecipes.map((recipe, index) => (
                <View
                  className="flex-1 items-center justify-center relative rounded-2xl w-[360px] h-[460px]"
                  key={index}
                >
                  <Image
                    source={require("../../assets/images/recipeBack/recipeBack4.png")}
                    className="absolute inset-0 w-full h-full"
                    style={styles.shadow}
                  />
                  <TouchableOpacity
                    className="absolute top-20 right-5"
                    onPress={() => handleRemoveFromFavourites(recipe.id)}
                  >
                    <Image
                      source={require("../../assets/images/trash.png")}
                      className="w-8 h-8"
                    />
                  </TouchableOpacity>

                  <View className="flex items-center justify-start h-full pt-8">
                    <TouchableOpacity
                      onPress={() => handleGoToRecipeCard(recipe.id)}
                      key={recipe.id}
                      className="flex items-center justify-center"
                    >
                      {/* Fixed Image */}
                      <View className="w-[200px] h-[200px]">
                        <Image
                          source={
                            recipe.additionalData?.image
                              ? { uri: recipe.additionalData.image }
                              : require("../../assets/images/picMissing.png")
                          }
                          className="rounded-xl w-full h-full top-12 right-4"
                          onError={() => {
                            setFavouriteRecipes((prev: any) => {
                              const updatedRecipes = prev.map((r: any) =>
                                r.id === recipe.id
                                  ? {
                                      ...r,
                                      additionalData: {
                                        ...r.additionalData,
                                        image: null,
                                      },
                                    }
                                  : r
                              );
                              return updatedRecipes;
                            });
                          }}
                        />
                      </View>

                      {/* Title */}
                      <View className="flex items-center justify-center top-16 right-4">
                        <Text className="font-Flux text-center max-w-[200px]">
                          {recipe.title.length > 65
                            ? recipe.title.substring(0, 65) + "..."
                            : recipe.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Details */}
                  <View className="flex-row justify-around items-center absolute bottom-10 right-20">
                    <View className="flex justify-center items-center mx-3">
                      <Image
                        source={require("../../assets/images/money.png")}
                        className="w-8 h-8"
                      />
                      <Text className="text-md">
                        $
                        {(recipe.additionalData.pricePerServing / 100).toFixed(
                          2
                        )}
                      </Text>
                    </View>
                    <View className="flex justify-center items-center ml-3 mr-2">
                      <Image
                        source={require("../../assets/images/fire.png")}
                        className="w-8 h-8"
                      />
                      <Text className="text-md">
                        {Math.round(
                          recipe.additionalData.nutrition.nutrients[0].amount
                        )}{" "}
                        kcal
                      </Text>
                    </View>
                    <View className="flex justify-center items-center mx-3">
                      <Image
                        source={require("../../assets/images/timer.png")}
                        className="w-8 h-8"
                      />
                      <Text className="text-md">
                        {recipe.additionalData.readyInMinutes} mins
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </ScrollView>
        )}
      </View>
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
    elevation: 10,
  },
});
