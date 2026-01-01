const plugin = require("tailwindcss/plugin");

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
        // Theme colors
        "theme-workspace": "var(--theme-workspace)",
        "theme-card": "var(--theme-card)",
        "theme-modal": "var(--theme-modal)",
        "theme-sidebar": "var(--theme-sidebar)",
        "theme-elevated": "var(--theme-elevated)",
        "theme-surface": "var(--theme-surface)",
        "theme-button": "var(--theme-button)",
        "theme-button-hover": "var(--theme-button-hover)",
      "theme-button-active": "var(--theme-button-active)",
        "theme-button-text": "var(--theme-button-text)",
        "theme-text-primary": "var(--theme-text-primary)",
        "theme-text-secondary": "var(--theme-text-secondary)",
        "theme-text-muted": "var(--theme-text-muted)",
        "theme-border": "var(--theme-border)",
        "theme-border-subtle": "var(--theme-border-subtle)",
        "theme-accent": "var(--theme-accent)",
        "theme-accent-hover": "var(--theme-accent-hover)",
        "theme-accent-active": "var(--theme-accent-active)",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("theme-cherry", ".theme-cherry &");
      addVariant("theme-dark", ".theme-dark &");
      addVariant("theme-light", ".theme-light &");
    }),
  ],
};
