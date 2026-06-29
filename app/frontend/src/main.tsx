import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ColorThemeProvider } from "./contexts/ColorThemeContext";
import "./globals.css";
import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ColorThemeProvider>
          <App />
        </ColorThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
