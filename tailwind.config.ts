import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          milk: '#fdfaf5',
          cream: '#fbf4ea',
          paper: '#f5ebd9',
          sage: '#8aa28a',
          'sage-dark': '#728c72',
          'sage-light': '#dbe6db',
          wine: '#7a353c',
          'wine-dark': '#63282f',
          'wine-light': '#92464e',
          pink: '#f4a7a1',
          'pink-soft': '#fdf0ee',
          terracotta: '#d97d64',
          mustard: '#e5aa49',
          'mustard-dark': '#d49533',
          'mustard-light': '#fdf3de',
          brown: '#382325',
          'brown-muted': '#6b5456',
          'brown-light': '#9c8688',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
        serif: ['Poppins', 'var(--font-poppins)', 'sans-serif'],
        poppins: ['Poppins', 'var(--font-poppins)', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'clay': '0 12px 35px -8px rgba(60, 35, 38, 0.1)',
        'clay-hover': '0 18px 45px -8px rgba(60, 35, 38, 0.16)',
        'clay-inner': 'inset 0 2px 4px 0 rgba(60, 35, 38, 0.06)',
      }
    },
  },
  plugins: [],
};
export default config;
