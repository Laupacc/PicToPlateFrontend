export const fetchRandomRecipe = async () => {
  try {
    const response = await fetch(
      `http://192.168.1.34:3000/recipes/randomRecipe`
    );
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
      `http://192.168.1.34:3000/recipes/recipeInformation/${id}`
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
      `http://192.168.1.34:3000/recipes/analyzedInstructions/${id}`
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
