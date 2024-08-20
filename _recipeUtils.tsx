import { Ionicons } from "@expo/vector-icons";

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

export const fetchRandomRecipe = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/recipes/randomRecipe`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data.recipes[0];
  } catch (error) {
    console.log("Error fetching random recipe:", error.message);
    throw error;
  }
};

export const fetchRecipeInformation = async (id) => {
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
  } catch (error) {
    console.log("Error fetching recipe information:", error.message);
    throw error;
  }
};

export const fetchAnalyzedInstructions = async (id) => {
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
  } catch (error) {
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
  recipeId,
  user,
  toast,
  fetchDetails = true
) => {
  if (!user?.token) {
    return;
  }

  try {
    console.log("Recipe ID before fetch:", recipeId);

    const token = user.token;
    let fullRecipeData;

    if (fetchDetails) {
      const recipeData = await fetchRecipeInformation(recipeId);
      const instructions = await fetchAnalyzedInstructions(recipeId);

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

    if (!response.ok) {
      const data = await response.json();
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

    toast.show("Recipe added to favourites", {
      type: "success",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
  } catch (error) {
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

export const removeRecipeFromFavourites = async (recipeId, user, toast) => {
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

    toast.show("Recipe removed from favourites", {
      type: "success",
      placement: "center",
      duration: 1000,
      animationType: "zoom-in",
      swipeEnabled: true,
      icon: <Ionicons name="checkmark-circle" size={24} color="white" />,
    });
    console.log("Recipe removed from favourites");
  } catch (error) {
    console.error("Error removing recipe from favourites:", error.message);
  }
};

export const goToRecipeCard = async (recipeId, navigation, fromScreen) => {
  try {
    const response = await fetch(`${BACKEND_URL}/users/fetchAllRecipes`);

    if (!response.ok) {
      throw new Error("Failed to fetch recipes");
    }

    const data = await response.json();
    const existingRecipe = data.recipes.find(
      (recipe) => recipe.id === String(recipeId)
    );

    if (existingRecipe) {
      navigation.navigate("recipeCard", {
        passedRecipe: existingRecipe,
        fromScreen,
      });
    } else {
      navigation.navigate("recipeCard", { recipeId: recipeId, fromScreen });
    }
  } catch (error) {
    console.error("Error navigating to recipe card:", error.message);
  }
};
