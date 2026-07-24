import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

console.log("main.jsx executing ✅");
const el = document.getElementById("root");
if (!el) {
  document.body.insertAdjacentHTML("afterbegin", "<pre>❌ #root not found</pre>");
} else {
  createRoot(el).render(<App />);
}
