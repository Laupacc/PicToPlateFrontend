import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    favourites: [],
};

export const recipesSlice = createSlice({
    name: 'recipes',
    initialState,
    reducers: {
        addToFavouriteRecipes: (state, action) => {
            state.favourites.push(action.payload);
        },
        removeFromFavouriteRecipes: (state, action) => {
            state.favourites = state.favourites.filter(recipe => recipe.id !== action.payload.id);
        },
        updateFavouriteRecipes: (state, action) => {
            state.favourites = action.payload;
        },
    },
});

export const { addToFavouriteRecipes, removeFromFavouriteRecipes, updateFavouriteRecipes, cacheRecipe, clearCache } = recipesSlice.actions;
export default recipesSlice.reducer;
