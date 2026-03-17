/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}",
     "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"], // Adding Google Font
      },
      colors: {
        primary: "#002F5E", // Custom primary color
        secondary: "#00254A", // Custom secondary color
        customLightGray: "#F5F5F5", // Custom Light gray color
        customTextDarkGray: "#5E5E5E", // Custom Light gray color
        customGray: "#7B7B7B", // Custom gray color
        customYellow: "#E6B020", // Custom yellow color
        customRed: "#FF5757", // Custom red color
        customBlack: "#192537",
        customGreen: "#008748D9",
        inProgressColor: "#1B62CCD9",
        customRed2: "#DF674F",
        lightGrayBg: "#F5F5F5",
      },
      backgroundImage: {
        bgDarkGradientBlue: "linear-gradient(to right, #00254A, #083F77)",
        NavbarGradientColor:
          "linear-gradient(to right, #0E326A, #132C51, #192537)",
        DarkGradientBlue: "linear-gradient(to right, #102F5D, #192537)",
        GrayGradient: "linear-gradient(to top, #F5F5F5, #DBE1EA)",
        TeamMemberBgGradient: "linear-gradient(to top, #002F5E, #8097AF)",
      },
      width: {
        "1/10": "10%",
        "2/10": "20%",
        "2-5/10": "25%",
        "3/10": "30%",
        "3-3/10": "31%",
        "3-9/10": "38.5%",
        "33/100": "33.33%",
        "4/10": "40%",
        "4-2/10": "42%",
        "5/10": "50%",
        "5-8/10": "58%",
        "6/10": "60%",
        "7/10": "70%",
        "7-5/10": "75%",
        "8/10": "80%",
        "9/10": "90%",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".after-border-width-50": {
          position: "relative",
          fontWeight: "600",
          color: "#192537",
          "&::after": {
            content: "''",
            display: "block",
            position: "absolute",
            bottom: "-2px",
            left: 0,
            right: 0,
            width: "70px",
            height: "2px",
            backgroundColor: "#FF5757",
          },
        },
        ".success-label": {
          backgroundColor: "#07A57A1F",
          color: "#07A57AD9",
          fontSize: "12px",
          fontWeight: "600",
          padding: "5px 15px",
          borderRadius: "8px",
          display: "inline-block",
        },
        ".inprocess-label": {
          backgroundColor: "#0746A51F",
          color: "#0746A5",
          fontSize: "12px",
          fontWeight: "600",
          padding: "5px 15px",
          borderRadius: "8px",
          display: "inline-block",
        },
        ".pending-label": {
          backgroundColor: "#E5CE001F",
          color: "#C1B121",
          fontSize: "12px",
          fontWeight: "600",
          padding: "5px 15px",
          borderRadius: "8px",
          display: "inline-block",
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
  variants: {
    extend: {
      placeholder: ["responsive", "hover", "focus"], // Enable placeholder utilities
    },
  },
};
