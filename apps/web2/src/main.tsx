import { Root } from "@/routes/root";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
);
