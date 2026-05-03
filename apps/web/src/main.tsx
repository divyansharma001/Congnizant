import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import "@/shared/styles/app.css";

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import("@/mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Root container was not found");
  }

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <AppProviders router={router} />
    </React.StrictMode>,
  );
}

void bootstrap();
