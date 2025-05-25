
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add Shadcn UI-like color variables to Tailwind's theme directly for this environment
// This is a workaround for not having a tailwind.config.js
if (typeof window !== 'undefined' && (window as any).tailwind) {
  (window as any).tailwind.config = {
    darkMode: "class", // or 'media' if you prefer
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },
  };

  // Inject CSS variables for Shadcn UI dark theme (Monochromatic: Dark and White)
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --background: 220 10% 4.9%; /* Dark Neutral Gray, slightly desaturated blueish tone for depth but not overtly blue */
      --foreground: 0 0% 98%;     /* Off-White */
      --card: 220 10% 4.9%;       /* Same as background */
      --card-foreground: 0 0% 98%; /* Same as foreground */
      --popover: 220 10% 4.9%;     /* Same as background */
      --popover-foreground: 0 0% 98%; /* Same as foreground */
      
      --primary: 0 0% 98%;             /* Off-White for primary actions */
      --primary-foreground: 220 10% 4.9%; /* Dark Neutral Gray for text on primary */
      
      --secondary: 0 0% 14%;             /* Neutral Dark Gray */
      --secondary-foreground: 0 0% 98%;  /* Off-White */
      
      --muted: 0 0% 14%;                 /* Neutral Dark Gray */
      --muted-foreground: 0 0% 60%;      /* Neutral Mid-Gray */
      
      --accent: 0 0% 14%;                /* Neutral Dark Gray */
      --accent-foreground: 0 0% 98%;     /* Off-White */
      
      --destructive: 0 62.8% 30.6%;      /* Dark Red (No change, standard for destructive) */
      --destructive-foreground: 0 0% 98%; /* Off-White */
      
      --border: 0 0% 20%;                /* Neutral Dark Gray for borders */
      --input: 0 0% 16%;                 /* Neutral Dark Gray for input backgrounds */
      --ring: 220 10% 4.9%;              /* Match background to make ring invisible (was 0 0% 40%) */
      
      --radius: 0.5rem;
    }
  `;
  document.head.appendChild(style);
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Ensure body has the correct background for Shadcn UI dark theme
document.body.classList.add('bg-background', 'text-foreground');


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
