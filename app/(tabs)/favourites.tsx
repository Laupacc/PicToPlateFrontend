import {
  Image,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
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
              top: 100,
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
                    onPress={() => handleRemoveFromFavourites(recipe.id)}
                  >
                    <Image
                      source={require("../../assets/images/trash2.png")}
                      className="w-8 h-8"
                    />
                  </TouchableOpacity>
                  <View className="flex items-center justify-center">
                    <TouchableOpacity
                      onPress={() => handleGoToRecipeCard(recipe.id)}
                      key={recipe.id}
                      className="flex items-center justify-center"
                    >
                      <Image
                        source={
                          recipe.additionalData.image
                            ? { uri: recipe.additionalData.image }
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
    elevation: 5,
  },
});
