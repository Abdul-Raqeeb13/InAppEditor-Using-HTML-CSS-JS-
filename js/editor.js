import { makeDraggable } from "./draggable.js";
import { enableSelection } from "./selection.js";
import { initPropertiesPanel } from "./properties.js";

document.addEventListener("DOMContentLoaded", () => {
  // Enable dragging/resizing
  document.querySelectorAll(".editable").forEach((el) => {
    makeDraggable(el);
  });

  // Enable selection + properties
  enableSelection();
  initPropertiesPanel();
});
