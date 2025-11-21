import React from "react";
import ReactDOM from "react-dom/client";
import WidgetApp from "./WidgetApp";

declare global {
  interface Window {
    renderStudentWidget: (elementId: string, props?: any) => void;
  }
}

window.renderStudentWidget = (elementId, props = {}) => {
  const container = document.getElementById(elementId);
  if (!container) return console.error("Element not found:", elementId);

  ReactDOM.createRoot(container).render(<WidgetApp {...props} />);
};
