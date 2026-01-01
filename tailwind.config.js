module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,css}"],
  darkMode: "class",
  // Safelist allows these classes to always be generated, even if not found in source code
  // Useful for testing classes via browser console
  safelist: [
    // Theme-dark variants with common colors for testing
    'theme-dark:bg-black',
    'theme-dark:bg-white',
    'theme-dark:bg-red-500',
    'theme-dark:bg-blue-500',
    'theme-dark:bg-green-500',
    // Add any other classes you want to test via console
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
