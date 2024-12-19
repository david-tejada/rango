import { createRoot } from "react-dom/client";
import { TabTree } from "./TabTree";

console.log("Sidebar loaded");

const root = document.querySelector("#root")!;

createRoot(root).render(<TabTree />);
