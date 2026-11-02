import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Globally prevent mouse wheel from changing input[type="number"] values across the entire application
if (typeof window !== "undefined") {
  window.addEventListener(
    "wheel",
    (e) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur();
      }
      if (e.target instanceof HTMLInputElement && e.target.type === "number") {
        e.target.blur();
      }
    },
    { passive: true }
  );
}

createRoot(document.getElementById("root")!).render(<App />);
