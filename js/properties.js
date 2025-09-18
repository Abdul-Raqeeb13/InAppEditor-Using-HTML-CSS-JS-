let panel, content;

export function initPropertiesPanel() {
  panel = document.getElementById("properties-panel");
  content = document.getElementById("properties-content");

  document.addEventListener("elementSelected", (e) => {
    const el = e.detail;
    showProperties(el);
  });
}

function showProperties(el) {
  content.innerHTML = "";

  // Color
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = rgbToHex(el.style.color || "#000000");
  colorInput.oninput = () => (el.style.color = colorInput.value);
  content.appendChild(makeRow("Text Color", colorInput));

  // Font size
  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.value = parseInt(el.style.fontSize) || 16;
  sizeInput.oninput = () => (el.style.fontSize = sizeInput.value + "px");
  content.appendChild(makeRow("Font Size", sizeInput));

  if (el.dataset.type === "shape") {
    const path = el.querySelector("path");
    const fillInput = document.createElement("input");
    fillInput.type = "color";
    fillInput.value = rgbToHex(path.getAttribute("fill"));
    fillInput.oninput = () => path.setAttribute("fill", fillInput.value);
    content.appendChild(makeRow("Fill Color", fillInput));

    const opacityInput = document.createElement("input");
    opacityInput.type = "range";
    opacityInput.min = 0;
    opacityInput.max = 1;
    opacityInput.step = 0.1;
    opacityInput.value = path.getAttribute("opacity") || 1;
    opacityInput.oninput = () =>
      path.setAttribute("opacity", opacityInput.value);
    content.appendChild(makeRow("Opacity", opacityInput));
  }

  // Background (for button)
  if (el.tagName === "BUTTON" || el.dataset.type === "button") {
    const bgInput = document.createElement("input");
    bgInput.type = "color";
    bgInput.value = rgbToHex(el.style.backgroundColor || "#ffffff");
    bgInput.oninput = () => (el.style.backgroundColor = bgInput.value);
    content.appendChild(makeRow("Background", bgInput));

    const radiusInput = document.createElement("input");
    radiusInput.type = "range";
    radiusInput.min = 0;
    radiusInput.max = 100;
    radiusInput.value = parseInt(el.style.borderRadius) || 0;
    radiusInput.oninput = () =>
      (el.style.borderRadius = radiusInput.value + "px");
    content.appendChild(makeRow("Border Radius", radiusInput));
  }
}

function makeRow(label, input) {
  const row = document.createElement("div");
  row.style.margin = "5px 0";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  lbl.style.display = "block";
  row.appendChild(lbl);
  row.appendChild(input);
  return row;
}

function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  const result = rgb.match(/\d+/g);
  if (!result) return "#000000";
  return (
    "#" +
    result
      .slice(0, 3)
      .map((x) => ("0" + parseInt(x).toString(16)).slice(-2))
      .join("")
  );
}
