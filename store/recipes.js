import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    favourites: [],
    // recipesById: {},
};

export const recipesSlice = createSlice({
    name: 'recipes',
    initialState,
    reducers: {
        addToFavouriteRecipes: (state, action) => {
            state.favourites.push(action.payload);
        },
        removeFromFavouriteRecipes: (state, action) => {
            state.favourites = state.favourites.filter(recipe => recipe !== action.payload);
        },
        updateFavouriteRecipes: (state, action) => {
            state.favourites = action.payload;
        },
        // cacheRecipe: (state, action) => {
        //     return {
        //         ...state,
        //         recipesById: {
        //             ...state.recipesById,
        //             [action.payload.id]: action.payload,
        //         },
        //     };
        // },
        // clearCache: (state) => {
        //     return {
        //         ...state,
        //         recipesById: {},
        //     };
        // },
    },
});

export const { addToFavouriteRecipes, removeFromFavouriteRecipes, updateFavouriteRecipes, cacheRecipe, clearCache } = recipesSlice.actions;
export default recipesSlice.reducer;
