const BACKEND_URL = "http://10.0.0.97:3000";

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
