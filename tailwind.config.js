/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        Nobile: ['Nobile'],
        NobileBold: ['NobileBold'],
        NobileMedium: ['NobileMedium'],
        Flux: ['Flux'],
        Maax: ['Maax'],
        CreamyCookies: ['CreamyCookies'],
        Sketch: ['Sketch'],
        SpaceMono: ['SpaceMono'],
        Steradian: ['Steradian'],
        Luminous: ['Luminous'],
        OrleansCity: ['OrleansCity'],
        RowsofSunflowers: ['RowsofSunflowers'],
        HappyWork: ['HappyWork'],
      },
    },
  },
  plugins: [],
}

