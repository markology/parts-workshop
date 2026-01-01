const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,css}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("theme-cherry", ".theme-cherry &");
      addVariant("theme-dark", ".theme-dark &");
      addVariant("theme-light", ".theme-light &");
    }),
  ],
};
