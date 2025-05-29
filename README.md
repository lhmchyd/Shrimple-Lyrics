# Shrimple Lyric 🍤🎵

Shrimple Lyric is a web application designed to help users find song lyrics, artist information, and song meanings. It leverages the power of the Google Gemini API for comprehensive search results and features a sleek, dark-themed UI inspired by Shadcn UI. The application is built with React, TypeScript, and Tailwind CSS, and utilizes IndexedDB for client-side caching of search history and results, enabling offline access to previously fetched data.

## ✨ Features

*   **Comprehensive Lyric Search:** Find original, English, and Romanized lyrics.
*   **Artist & Song Insights:** Get artist bios and song meaning summaries.
*   **Google Search Grounding:** Results are enhanced by Google Search (sources cited).
*   **Offline Access:** Client-side caching via IndexedDB for history and results.
*   **Responsive Design:** Adapts seamlessly from mobile to desktop.
*   **Modern Dark Theme:** Aesthetically pleasing UI based on Shadcn UI principles.
*   **API Rate Limiting:** Client-side controls (30s cooldown, 5 calls/hour) with UI feedback.
*   **Rich History Management:** View, select, edit titles, delete, and search history.
*   **Lyrics Download:** Save lyrics as `.txt` files.
*   **Smooth Loading:** Skeleton placeholders for a better user experience.
*   **Accessibility:** ARIA attributes and keyboard navigation.
*   **Legal Modals:** Includes templates for Privacy, Cookies, and Copyright.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (with a Shadcn UI-like theme)
*   **API:** Google Gemini API (`@google/genai`)
    *   Model: `gemini-2.5-flash-preview-04-17`
*   **Local Storage:** IndexedDB
*   **Build/Dev:** ES Modules via `esm.sh` (no local build step required for basic use)
*   **Icons:** Lucide React (manually included SVGs)
*   **Markdown:** `react-markdown` with `remark-gfm`

## 🚀 Getting Started & Usage

This application can be run locally for testing or deployed to a static hosting provider.

### Prerequisites

1.  **A Modern Web Browser:** Chrome, Firefox, Edge, Safari.
2.  **Google Gemini API Key:** You'll need an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Understanding API Key Handling

The application needs your Gemini API Key. It expects this key to be available via `process.env.API_KEY`.

*   **Client-Side (Default for `geminiService.ts`):** The main lyric search service (`geminiService.ts`) currently makes calls directly from the browser to the Gemini API. This is simpler for quick local testing but is **not secure for production** as your API key can be exposed.
*   **Server-Side (Recommended for Production - using `api/lyrics.ts`):** The `api/lyrics.ts` file is a serverless function (e.g., for Vercel) that acts as a proxy. This keeps your API key secure on the server. To use this, you'd modify `geminiService.ts` to call this backend endpoint instead of Google directly.

### Option 1: Local Development (Client-Side API Key - Quick Test 🧪)

This method uses the default `geminiService.ts` which calls the Gemini API from the client.

1.  **Provide API Key (Choose one - TEMPORARY & INSECURE):**
    *   **In `index.html` (Easiest for testing):**
        Open `index.html`. Before the line `<script type="module" src="/index.tsx"></script>`, add:
        ```html
        <script>
          window.process = { env: { API_KEY: "YOUR_GEMINI_API_KEY_HERE" } };
        </script>
        ```
        Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.
        **⚠️ IMPORTANT: Remove this before committing your code or deploying! This method exposes your API key in the client-side code.**
    *   **In Browser Console (Per session):**
        Open your browser's developer console and execute:
        ```javascript
        window.process = { env: { API_KEY: "YOUR_GEMINI_API_KEY_HERE" } };
        ```
        You might need to refresh the page. This setting is lost when you close the tab/browser.

2.  **Serve the Files:**
    Use any simple HTTP server. If you have Node.js installed:
    ```bash
    npx serve .
    ```
    This will typically serve the application at `http://localhost:3000` or `http://localhost:5000`.

3.  **Access:** Open the URL from the previous step in your browser.

### Option 2: Local Development (Serverless Function - More Secure Setup 🛡️)

This method involves using the `api/lyrics.ts` serverless function locally, which is a better practice for API key security, and simulates a deployment environment.

1.  **Modify `geminiService.ts`:**
    You need to change `services/geminiService.ts` to make requests to your local serverless function endpoint (`/api/lyrics`) instead of calling the Google Gemini API directly.
    *   Locate the `searchLyrics` function in `services/geminiService.ts`.
    *   Replace the `ai.models.generateContent(...)` call with a `fetch` call to your API route.
        For example (conceptual change):
        ```typescript
        // Before:
        // const geminiResponse: GenerateContentResponse = await ai.models.generateContent({ ... });
        // return parseGeminiResponse(geminiResponse);

        // After:
        const response = await fetch(`/api/lyrics?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        const data: LyricSearchResult = await response.json();
        return data; // Assuming api/lyrics.ts returns LyricSearchResult
        ```
        *Note: The `parseGeminiResponse` part would be handled by `api/lyrics.ts`.*

2.  **Install Vercel CLI (if you don't have it):**
    ```bash
    npm install -g vercel
    ```

3.  **Create Local Environment File:**
    In the project root directory, create a file named `.env.development.local`. Add your API key to this file:
    ```env
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key. Vercel CLI will automatically load this.

4.  **Run Development Server with Vercel CLI:**
    ```bash
    vercel dev
    ```
    This command serves your `index.html`, runs the `api/lyrics.ts` function (making the `API_KEY` from your `.env` file available to it), and typically makes the app available at `http://localhost:3000`.

5.  **Access:** Open the URL provided by `vercel dev`.

### Option 3: Deployment (Server-Side API Key - Production ✨)

For deploying to a platform like Vercel, Netlify, or other hosts that support serverless functions and environment variables:

1.  **Ensure `geminiService.ts` Calls Your Backend:**
    Make sure `services/geminiService.ts` is modified (as described in "Option 2, Step 1") to call your serverless function endpoint (e.g., `/api/lyrics`) and NOT the Google Gemini API directly.

2.  **Configure Environment Variable on Hosting Provider:**
    In your hosting provider's settings (e.g., Vercel Project Settings > Environment Variables), set the `API_KEY` environment variable to your Google Gemini API Key. This key will be accessible to your serverless function (`api/lyrics.ts`).

3.  **Deploy:**
    Follow your hosting provider's instructions to deploy the project. If using Vercel, connecting your Git repository is often the easiest way. Vercel will automatically detect the `api` folder and deploy the serverless function.

## 📂 Project Structure

*   `index.html`: Main HTML file.
*   `index.tsx`: React app entry point, Tailwind CSS theme setup.
*   `App.tsx`: Root React component, state management, layout.
*   `metadata.json`: Basic app info.
*   `types.ts`: TypeScript definitions.
*   `api/`: Serverless functions.
    *   `lyrics.ts`: Backend proxy for Gemini API calls (recommended for production).
*   `components/`: UI components.
    *   `ui/`: Shadcn UI-inspired primitives (Button, Card, etc.).
    *   `skeletons/`: Loading state placeholders.
    *   Other functional components (`HistorySidebar.tsx`, `MarkdownRenderer.tsx`, etc.).
*   `hooks/`: Custom React hooks (`useLocalStorage.ts`).
*   `pages/`: Page components (`LyricsSearchPage.tsx`).
*   `services/`: Logic for API calls and local data.
    *   `geminiService.ts`: Client-side Gemini API interaction (default, consider modifying for production).
    *   `indexedDBService.ts`: IndexedDB cache management.

## 🔑 Key Functionalities Explained

### Rate Limiting
The app includes client-side rate limiting to manage API usage:
*   **Cooldown:** 30 seconds between API calls.
*   **Hourly Limit:** Max 5 calls per hour.
The UI provides feedback when these limits are active.

### Styling & UI
*   **Tailwind CSS:** For rapid, utility-first styling.
*   **Shadcn UI-inspired Theme:** A custom dark theme using CSS variables for a consistent and modern look.
*   **Custom Scrollbars & Numbered Lyrics:** Enhanced visual details for better usability.

### Privacy & Data Handling
*   **Search Queries:** Sent to the Google Gemini API (either directly from client or via your serverless function).
*   **Local Storage:** Search history and cached results are stored in the user's browser using IndexedDB. This data is not transmitted to any application-owned server.
*   **Legal Information:** The footer provides access to template Privacy Policy, Cookie Policy, and Copyright information modals.

## 📝 Development Notes

*   **ESM Imports:** The project uses `esm.sh` for CDN-based imports of React and other dependencies, simplifying setup by avoiding a local `node_modules` folder and complex build configurations for basic use.
*   **Lucide Icons:** Icons are manually included as SVG components for optimized delivery.
*   **API Key Security:**
    *   The default client-side API calls in `geminiService.ts` are convenient for quick local testing but **expose your API key**.
    *   For any deployment or more secure local development, modify `geminiService.ts` to route API calls through the `api/lyrics.ts` serverless function, which keeps your API key on the server-side, protected by environment variables.

---