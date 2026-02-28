# Spotify Profile App

## Project Overview

This project is a Spotify-inspired music profile app, built to combine my interests in music and front-end development. While it’s not a direct clone, it offers a familiar experience for users to explore their listening habits, favorite artists, and top tracks.

### Technologies Used

- **Front-End:**
  - **React** with **Tailwind CSS** and **ShadCN** for rapid, clean UI development.
  - **spotify-web-player** for seamless music playback with a familiar interface.
- **Back-End:**
  - **Node.js** with **spotify-web-api-node** for easy authentication and data fetching from Spotify.
  - **TanStack Query** for efficient server data management and caching.
- **Development Tools:**
  - **ChatGPT** was invaluable for debugging, brainstorming, and accelerating development.

## Reflection

I chose this as my Level 3 project because it aligns with my passion for music and front-end engineering. Using modern UI libraries allowed me to focus on features and user experience rather than building components from scratch. Integrating third-party tools like spotify-web-player and leveraging ChatGPT made the process smoother and more enjoyable.

## Challenges

- Some of Spotify's API calls are deprecated, and Spotify is restrictive on the data it provides. Most of the stats are calculated based on the data the app receives, rather than Spotify providing it directly.
- Working with third-party libraries made authentication easier, but there was a learning curve during integration. One positive was that the Spotify Web Player had a great UI that fit perfectly with ShadCN and Tailwind components.

## Future Improvements

There’s still plenty of room for growth. I’d like to:

- Enhance the UI with more interactive and personalized features.
- Add a web scraper to display artist concert events or news (since Spotify’s API doesn’t provide this).
- Improve error handling and loading states for a more robust experience.
- Expand analytics and visualizations for user listening data.

Overall, I’m proud to get to work on something I’m really interested in and looking forward to improving this project even more.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
