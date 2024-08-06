import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import Background from "@/components/Background";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecipeInformation, randomStickerImage } from "@/apiFunctions";
import { useRoute } from "@react-navigation/native";
import { useToast } from "react-native-toast-notifications";
import LottieView from "lottie-react-native";
import {
  removeFromFavouriteRecipes,
  updateFavouriteRecipes,
} from "@/store/recipes";
import { Ionicons } from "@expo/vector-icons";
import { Surface } from "react-native-paper";

export default function Favourites() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const toast = useToast();
  const user = useSelector((state) => state.user.value);
  const favourites = useSelector((state) => state.recipes.favourites);

  const [favouriteRecipes, setFavouriteRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "http://192.168.1.34:3000";

  useEffect(() => {
    const fetchFavouriteRecipes = async () => {
      if (!user.token) return;
      try {
        setLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/users/fetchFavourites/${user.token}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch favourite recipes");
        }
        const data = await response.json();
        console.log("Fetched favourite recipe IDs:", data.favourites);

        const fetchInBatches = async (ids) => {
          const results = [];
          for (let i = 0; i < ids.length; i += 5) {
            const batch = ids.slice(i, i + 5);
            const batchResults = await Promise.all(
              batch.map((recipeId) => fetchRecipeInformation(recipeId))
            );
            results.push(...batchResults);
            if (i + 5 < ids.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
          return results;
        };

        const recipes = await fetchInBatches(data.favourites);
        console.log("Favourite recipes:", recipes.length);

        dispatch(updateFavouriteRecipes(recipes));
        setFavouriteRecipes(recipes);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavouriteRecipes();
  }, [user.token, favourites.length]);

  const removeRecipeFromFavourites = async (recipeId) => {
    try {
      const token = user.token;
      const response = await fetch(
        `${BACKEND_URL}/users/removeFavourite/${recipeId}/${token}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        console.log("Error removing recipe from favourites");
        toast.show("Error removing recipe from favourites", {
          type: "danger",
          placement: "center",
          duration: 2000,
          animationType: "zoom-in",
          swipeEnabled: true,
          icon: <Ionicons name="close-circle" size={24} color="white" />,
        });
      }

      dispatch(removeFromFavouriteRecipes(recipeId));
      setFavouriteRecipes(favouriteRecipes.filter((r) => r.id !== recipeId));

      console.log("Recipe removed from favourites:", recipeId);
      toast.show("Recipe removed from favourites", {
        type: "success",
        placement: "center",
        duration: 2000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-16">
      <Background cellSize={25} />
      <StatusBar barStyle="dark-content" />

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

      <View className="flex flex-1 items-center justify-center">
        {!user.token ? (
          <View className="flex items-center justify-center relative rounded-2xl w-[360] h-[460]">
            <Image
              source={require("../../assets/images/recipeBack/recipeBack4.png")}
              className="absolute inset-0 w-full h-full"
              style={styles.shadow}
            />
            <View className="flex items-center justify-center max-w-[180]">
              <Link href="/authentication" className="text-blue-500">
                <Text className="font-CreamyCookies text-center text-3xl">
                  Log in
                </Text>
              </Link>
              <Text className="font-CreamyCookies text-center text-3xl">
                to see your favourite recipes
              </Text>
            </View>
          </View>
        ) : loading ? (
          <LottieView
            source={require("../../assets/images/animations/Animation1722874174540.json")}
            autoPlay
            loop
            style={{
              width: 360,
              height: 360,
              position: "absolute",
              top: 80,
            }}
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
                  className="flex-1 items-center justify-center relative rounded-2xl w-[360] h-[460]"
                  key={index}
                >
                  <Image
                    source={require("../../assets/images/recipeBack/recipeBack4.png")}
                    className="absolute inset-0 w-full h-full"
                    style={styles.shadow}
                  />
                  <TouchableOpacity
                    className="absolute top-20 right-5"
                    onPress={() => removeRecipeFromFavourites(recipe.id)}
                  >
                    <Image
                      source={require("../../assets/images/trash2.png")}
                      className="w-8 h-8"
                    />
                  </TouchableOpacity>
                  <View className="flex items-center justify-center">
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("recipeCard", {
                          recipeId: recipe.id,
                          refresh: true,
                        })
                      }
                      key={recipe.id}
                      className="flex items-center justify-center"
                    >
                      <Image
                        source={
                          recipe.image
                            ? { uri: recipe.image }
                            : require("../../assets/images/picMissing.png")
                        }
                        className="rounded-xl w-[200] h-[200] right-4"
                      />
                      <View className="flex items-center justify-center max-w-[200] mt-4">
                        <Text className="font-Flux text-center">
                          {recipe.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
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
    // elevation: 5,
  },
  // shadow: {
  //   ...Platform.select({
  //     ios: {
  //       shadowColor: "#000",
  //       shadowOffset: { width: 2, height: 2 },
  //       shadowOpacity: 0.25,
  //       shadowRadius: 4,
  //     },
  //     android: {
  //       elevation: 20,
  //     },
  //   }),
  // },
});
