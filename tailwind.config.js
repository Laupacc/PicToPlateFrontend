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
        Flux: ['Flux'],
        Maax: ['Maax'],
        CreamyCookies: ['CreamyCookies'],
        Sketch: ['Sketch'],
        SpaceMono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
}

