import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerEnvlePwa } from "./lib/pwa";

const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing");
createRoot(root).render(<App />);
void registerEnvlePwa();
