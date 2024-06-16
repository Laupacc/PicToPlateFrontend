import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

export default function InsideRecipe() {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipe } = route.params || {};

  const extraAttribute = (att: string, value: boolean) => {
    return value ? att : "";
  };
  const constructImageUrl = (imageFileName: string) => {
    return `https://spoonacular.com/cdn/ingredients_100x100/${imageFileName}`;
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center pb-20 mx-6 mt-4">
      <Text className="text-cyan-800">Inside Recipe</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Go Back</Text>
      </TouchableOpacity>
      <ScrollView>
        {recipe && (
          <View className="flex items-center justify-center">
            <Image
              source={{ uri: recipe.image }}
              className="w-52 h-52 rounded-lg"
            />
            <Text className="text-xl">{recipe.title}</Text>
            <Text>{extraAttribute("Vegetarian", recipe.vegetarian)}</Text>
            <Text>{extraAttribute("Vegan", recipe.vegan)}</Text>
            <Text>{extraAttribute("Gluten Free", recipe.glutenFree)}</Text>
            <Text>{extraAttribute("Dairy Free", recipe.dairyFree)}</Text>
            <Text>{extraAttribute("Very Healthy", recipe.veryHealthy)}</Text>
            <Text>{extraAttribute("Cheap", recipe.cheap)}</Text>
            <Text>{extraAttribute("Very Popular", recipe.veryPopular)}</Text>
            <Text>{extraAttribute("Sustainable", recipe.sustainable)}</Text>
            <Text>{extraAttribute("Ketogenic", recipe.ketogenic)}</Text>
            <View>
              {recipe.extendedIngredients.map((ingredient, index: number) => (
                <View key={index}>
                  {ingredient.image ? (
                    <Image
                      source={{ uri: constructImageUrl(ingredient.image) }}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : null}
                  <View className="flex items-center">
                    <Text>{ingredient.measures.us.amount}</Text>
                    <Text>{ingredient.measures.us.unitShort}</Text>

                    <Text>{ingredient.measures.metric.amount}</Text>
                    <Text>{ingredient.measures.metric.unitShort}</Text>
                    <Text>{ingredient.originalName}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text>{recipe.instructions}</Text>
            <Text>Ready in: {recipe.readyInMinutes} minutes</Text>
            <Text>Servings: {recipe.servings}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
