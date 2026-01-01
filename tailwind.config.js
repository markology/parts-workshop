module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,css}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "aside-background": "var(--aside-background)",
        "text-color": "var(--text-color)",
        "text-color-alt": "var(--text-color-alt)",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("cherry", ".cherry &");
    }),
  ],
};
