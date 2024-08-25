import { Ionicons } from "@expo/vector-icons";
import { ToastType } from "react-native-toast-notifications";

export type RootStackParamList = {
  camera: undefined;
  favourites: undefined;
  fridge: undefined;
  profile: undefined;
  recipeCard: undefined;
  recipesFromFridge: undefined;
  search: undefined;
  authentication: undefined;
  index: undefined;
};

export const BACKEND_URL = "http://192.168.1.34:3000";

export const fetchRandomRecipe = async (): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/recipes/randomRecipe`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const recipe = data.recipes[0];
    return recipe;
  } catch (error: any) {
    console.error("Error fetching random recipe:", error.message);
    throw error;
  }
};

export const fetchRecipeInformation = async (id: number) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/recipes/recipeInformation/${id}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.log("Error fetching recipe information:", error.message);
    throw error;
  }
};

export const fetchAnalyzedInstructions = async (id: number) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/recipes/analyzedInstructions/${id}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.log("Error fetching analyzed instructions:", error.message);
    throw error;
  }
};

export const randomStickerImage = () => {
  const images = [
    require("./assets/images/stickers/stickerB1.png"),
    require("./assets/images/stickers/stickerB2.png"),
    require("./assets/images/stickers/stickerB3.png"),
    require("./assets/images/stickers/stickerB4.png"),
  ];
  return images[Math.floor(Math.random() * images.length)];
};

export const addRecipeToFavourites = async (
  recipeId: number,
  user: any,
  toast: ToastType
) => {
  if (!user?.token) {
    return;
  }

  try {
    const token = user.token;

    // Check if recipe exists in the database
    const checkExistenceResponse = await fetch(
      `${BACKEND_URL}/users/checkExistence/${recipeId}`
    );

    if (!checkExistenceResponse.ok) {
      throw new Error("Failed to check recipe existence");
    }
    const { exists } = await checkExistenceResponse.json();

    let fullRecipeData;

    if (!exists) {
      // Fetch data if recipe does not exist in the database
      const [recipeData, instructions] = await Promise.all([
        fetchRecipeInformation(recipeId),
        fetchAnalyzedInstructions(recipeId),
      ]);

      if (recipeData && instructions) {
        fullRecipeData = {
          ...recipeData,
          analyzedInstructions: instructions,
        };
      } else {
        throw new Error("Failed to fetch recipe details");
      }
    } else {
      fullRecipeData = { id: recipeId };
    }

    const response = await fetch(`${BACKEND_URL}/users/addFavourite/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe: fullRecipeData }),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.show(data.message || "Error adding recipe to favourites", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      console.error("Error adding recipe to favourites");
      return;
    }

    console.log("Recipe", recipeId, "added to favourites");
    toast.show("Recipe added to favourites", {
      type: "success",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
  } catch (error: any) {
    toast.show("Error adding recipe to favourites", {
      type: "warning",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="warning" size={24} color="white" />,
    });
    console.error("Error adding recipe to favourites:", error.message);
  }
};

export const removeRecipeFromFavourites = async (
  recipeId: number,
  user: any,
  toast: ToastType
) => {
  if (!user?.token) {
    return;
  }

  try {
    const token = user.token;
    const response = await fetch(
      `${BACKEND_URL}/users/removeFavourite/${token}/${recipeId}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (!response.ok) {
      toast.show("Error removing recipe from favourites", {
        type: "warning",
        placement: "center",
        duration: 1000,
        animationType: "zoom-in",
        swipeEnabled: true,
        icon: <Ionicons name="warning" size={24} color="white" />,
      });
      console.log("Error adding recipe to favourites");
      throw new Error(data.message || "Error adding recipe to favourites");
    }

    console.log("Recipe", recipeId, "removed from favourites");
    toast.show("Recipe removed from favourites", {
      type: "success",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
  } catch (error: any) {
    console.error("Error removing recipe from favourites:", error.message);
  }
};

export const goToRecipeCard = async (
  recipeId: number,
  navigation: any,
  fromScreen: string
) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/users/fetchRecipe/${recipeId}`
    );
    if (response.status === 404) {
      navigation.navigate("recipeCard", { recipeId: recipeId, fromScreen });
    } else {
      const existingRecipe = await response.json();
      navigation.navigate("recipeCard", {
        passedRecipe: existingRecipe,
        fromScreen,
      });
    }
  } catch (error: any) {
    console.error("Error navigating to recipe card:", error.message);
  }
};
