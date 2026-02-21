/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        backgroundImage: {
            "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            "gradient-conic":
            "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            'rainbow': "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
            'rainbow-less': "linear-gradient(45deg, red, blue, indigo)",
            'rainbow-less-hover': "linear-gradient(45deg, #ff4d4d, #4d4dff, #4d4dff)",
            'rainbow-less-disabled': "linear-gradient(45deg, darkred, darkblue, darkindigo)",
        },
      colors: {
        primary: "#1a1a1a",
        secondary: "#252525",
        "light-secondary": '#444444',
        darkblue: "#1f1f1f",
        quaternary: "#06d6a0",
        quaternaryhover: "#5FE5C2",
        button: "#1a1a1a",
        'light-gray': "#555555",
      },
    },
  },
  plugins: [],
};
