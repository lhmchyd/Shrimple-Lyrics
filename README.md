# Shrimple Lyric 🍤🎵

Shrimple Lyric is a web application designed to help users find song lyrics, artist information, and song meanings. It leverages the power of the Google Gemini API for comprehensive search results and features a sleek, dark-themed UI inspired by Shadcn UI. The application is built with React, TypeScript, and Tailwind CSS, and utilizes IndexedDB for client-side caching of search history and results, enabling offline access to previously fetched data.

## ✨ Features

*   **Lyric Search:** Find English and Romanized lyrics for a vast catalog of songs.
*   **Artist Information:** Get brief biographies and notable facts about artists.
*   **Song Meanings:** Discover interpretations and summaries of songs.
*   **Google Search Grounding:** Utilizes Google Search via the Gemini API to provide up-to-date and relevant information, with sources cited.
*   **Client-Side Caching:** Search history and results are stored locally using IndexedDB for quick access and offline availability.
*   **Responsive Design:** Adapts to various screen sizes, from mobile to desktop.
*   **Dark Theme:** Modern, aesthetically pleasing dark UI based on Shadcn UI principles.
*   **Rate Limiting:** Built-in client-side rate limiting to manage API calls effectively (30-second cooldown, max 5 calls per hour).
*   **History Management:**
    *   View and select previous searches.
    *   Edit search query titles.
    *   Delete individual history items.
    *   Search within your history.
*   **Lyrics Download:** Download lyrics (English or Romanized) as a .txt file.
*   **Skeleton Loaders:** Smooth loading experience with skeleton placeholders.
*   **Accessibility:** ARIA attributes and keyboard navigation considerations.
*   **Legal Modals:** Includes boilerplate for Privacy Policy, Cookie Policy, and Copyright Information.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (with Shadcn UI-like theme and custom CSS variables)
*   **API:** Google Gemini API (`@google/genai`)
    *   Model for text: `gemini-2.5-flash-preview-04-17`
*   **Local Storage:** IndexedDB for caching search history and results.
*   **Build/Dev:** Esbuild (implied by the no-config setup using `esm.sh` for imports)
*   **Icons:** Lucide React (manually included SVG components)
*   **Markdown Rendering:** `react-markdown` with `remark-gfm`

## 🚀 Getting Started

This application is designed to run directly in a browser environment that supports ES modules and modern JavaScript.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   An **API Key** for the Google Gemini API.

### Environment Variables

The application expects the Google Gemini API key to be available as an environment variable:

*   `process.env.API_KEY`: Your Google Gemini API Key.

**Important:** The application code directly references `process.env.API_KEY`. In a typical deployment (e.g., Vercel, Netlify, or a custom Node.js server serving the static files), you would set this environment variable in your hosting provider's settings or your server environment. For local development without a build process that injects environment variables, you might need to manually define `process.env.API_KEY` in your browser's console or use a tool that can serve static files with environment variable injection (though the current setup does not include such a tool).

The `/api/lyrics.ts` serverless function (intended for platforms like Vercel) also requires `API_KEY` to be set in its environment.

### Running the Application

1.  Ensure the `API_KEY` is accessible in the environment where the application will run (either client-side for direct API calls if `geminiService.ts` is used directly, or server-side if calls are routed through `/api/lyrics.ts`).
2.  Serve the `index.html` file using a simple HTTP server.
    *   Example using `npx serve`:
        ```bash
        npx serve .
        ```
3.  Open the application in your browser (usually `http://localhost:3000` or `http://localhost:5000` depending on the server).

## 📂 Project Structure

*   `index.html`: The main HTML entry point.
*   `index.tsx`: The main React application entry point, initializes Tailwind CSS custom theme.
*   `App.tsx`: The root React component, managing state, routing (implicitly), and main layout.
*   `metadata.json`: Basic application metadata.
*   `types.ts`: TypeScript type definitions.
*   **`components/`**: Reusable UI components.
    *   `ui/`: Shadcn UI-like primitive components (Button, Card, Input, ScrollArea).
    *   `skeletons/`: Skeleton loader components.
    *   Other specific components like `Footer.tsx`, `HistorySidebar.tsx`, `MarkdownRenderer.tsx`, `Modal.tsx`, `SearchInputArea.tsx`.
*   **`hooks/`**: Custom React hooks (e.g., `useLocalStorage.ts`).
*   **`pages/`**: Page-level components (e.g., `LyricsSearchPage.tsx`).
*   **`services/`**: Services for API calls and local data management.
    *   `geminiService.ts`: Handles communication with the Google Gemini API (client-side version).
    *   `indexedDBService.ts`: Manages IndexedDB operations for caching.
*   **`api/`**: Serverless function(s).
    *   `lyrics.ts`: A Vercel-style serverless function to proxy requests to the Gemini API. This helps protect the API key if client-side calls are not desired.

## 🚦 Rate Limiting

The application implements client-side rate limiting to prevent excessive API calls:
*   **Cooldown:** A 30-second cooldown period between consecutive API calls.
*   **Hourly Limit:** A maximum of 5 API calls per hour.
The UI provides feedback to the user when these limits are active.

## 🎨 Styling

*   **Tailwind CSS:** Used for utility-first styling.
*   **Shadcn UI-like Theme:** A custom dark theme is implemented using CSS variables, mimicking the style of Shadcn UI. Colors and border-radius are configurable via CSS variables injected in `index.tsx`.
*   **Custom Scrollbars:** Styled scrollbars for Webkit browsers to match the dark theme.
*   **Numbered Lyrics Display:** Custom CSS in `index.html` ensures lyrics are displayed with line numbers.

## 🔒 Privacy and Data

*   **Search Queries:** Sent to the Google Gemini API.
*   **Local Storage:** Search history and cached results are stored in the user's browser via IndexedDB. This data is not transmitted to any server owned by the application.
*   **Footer Links:** The footer contains links to modal dialogs for Privacy Policy, Cookie Policy, and Copyright Information (with placeholder content).

## 📝 Notes

*   The application uses `esm.sh` for CDN-based imports of React and other dependencies, simplifying the setup by avoiding a local `node_modules` folder and complex build configurations.
*   Lucide icons are manually included as SVG components to reduce dependency size and complexity.
*   The API key handling relies on `process.env.API_KEY`. Ensure this is correctly configured in your deployment environment.
*   The `geminiService.ts` makes direct client-side calls to the Gemini API. For production, it's often recommended to proxy API calls through a backend (like the provided `/api/lyrics.ts` serverless function) to protect the API key. The application currently uses the client-side service.

---

This README provides a comprehensive overview of Shrimple Lyric.
