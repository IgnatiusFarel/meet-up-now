import "./index.css";
import App from "./App.jsx";
import { StrictMode } from "react";
import { App as AntdApp } from "antd";
import "@ant-design/v5-patch-for-react-19";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ThemeProvider from "./theme/CustomizeTheme.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AntdApp>
          <App />
        </AntdApp>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
