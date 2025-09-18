class TemplateEditor {
  constructor() {
    this.selectedElement = null;
    this.isDragging = false;
    this.isResizing = false;
    this.dragOffset = { x: 0, y: 0 };
    this.history = [];
    this.historyIndex = -1;
    this.isUpdating = false;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.makeElementsEditable();
    this.updateLayersList();
    this.saveState();
    this.showDefaultControls();
  }

  showDefaultControls() {
    // Show background controls by default
    this.showControlGroup("backgroundControls");
  }

  showControlGroup(groupId) {
    // Hide all control groups first
    const controlGroups = [
      "backgroundControls",
      "textControls",
      "svgControls",
      "shapeControls",
      "generalControls",
      "typographyControls",
      "positionControls",
    ];
    controlGroups.forEach((id) => {
      document.getElementById(id).classList.add("hidden");
    });

    // Show the requested group
    document.getElementById(groupId).classList.remove("hidden");

    // Always show position controls for non-background elements
    if (
      this.selectedElement &&
      !this.selectedElement.classList.contains("background-image") &&
      !this.selectedElement.classList.contains("content-container")
    ) {
      document.getElementById("positionControls").classList.remove("hidden");
      document.getElementById("generalControls").classList.remove("hidden");
    }
  }

  setupEventListeners() {
    // Tool controls
    document
      .getElementById("addText")
      .addEventListener("click", () => this.addTextElement());
    document
      .getElementById("addShape")
      .addEventListener("click", () => this.addShapeElement());
    document
      .getElementById("addImage")
      .addEventListener("change", (e) => this.addImageElement(e));

    // Background style controls
    document.getElementById("bgColor").addEventListener("input", (e) => {
      if (!this.selectedElement) {
        // No element → canvas background
        this.updateCanvasBackground(e.target.value);
        return;
      }

      const type = this.selectedElement.getAttribute("data-type");

      if (
        type === "button" ||
        type === "shape" ||
        type === "text" ||
        type === "div"
      ) {
        // ✅ Allow buttons, shapes, text blocks, or generic divs
        this.updateStyle("backgroundColor", e.target.value);
      } else if (type === "svg") {
        // ❌ Skip svg background, svg uses fill only
        return;
      } else {
        // Default fallback → canvas background
        this.updateCanvasBackground(e.target.value);
      }
    });

    // Text color controls
    document
      .getElementById("textColor")
      .addEventListener("input", (e) =>
        this.updateStyle("color", e.target.value)
      );

    // SVG controls
    document
      .getElementById("svgFillColor")
      .addEventListener("input", (e) => this.updateSVGFill(e.target.value));
    document.getElementById("svgOpacity").addEventListener("input", (e) => {
      this.updateSVGOpacity(e.target.value / 100);
      document.getElementById("svgOpacityValue").textContent =
        e.target.value + "%";
    });

    // Shape controls
    document
      .getElementById("shapeColor")
      .addEventListener("input", (e) =>
        this.updateStyle("backgroundColor", e.target.value)
      );
    document.getElementById("borderRadius").addEventListener("input", (e) => {
      this.updateStyle("borderRadius", e.target.value + "px");
      document.getElementById("borderRadiusValue").textContent =
        e.target.value + "px";
    });

    // General opacity
    document.getElementById("opacity").addEventListener("input", (e) => {
      this.updateStyle("opacity", e.target.value / 100);
      document.getElementById("opacityValue").textContent =
        e.target.value + "%";
    });

    // Gradient controls
    document
      .getElementById("gradientBtn")
      .addEventListener("click", () => this.toggleGradientControls());
    document
      .getElementById("gradColor1")
      .addEventListener("input", () => this.updateCanvasGradient());
    document
      .getElementById("gradColor2")
      .addEventListener("input", () => this.updateCanvasGradient());
    document
      .getElementById("gradDirection")
      .addEventListener("change", () => this.updateCanvasGradient());

    // Typography controls
    document
      .getElementById("fontFamily")
      .addEventListener("change", (e) =>
        this.updateStyle("fontFamily", e.target.value)
      );
    document.getElementById("fontSize").addEventListener("input", (e) => {
      this.updateStyle("fontSize", e.target.value + "px");
      document.getElementById("fontSizeValue").textContent =
        e.target.value + "px";
    });
    document.getElementById("fontWeight").addEventListener("input", (e) => {
      this.updateStyle("fontWeight", e.target.value);
      document.getElementById("fontWeightValue").textContent = e.target.value;
    });
    document
      .getElementById("italicBtn")
      .addEventListener("click", () => this.toggleFontStyle());
    document
      .getElementById("underlineBtn")
      .addEventListener("click", () => this.toggleTextDecoration());
    document
      .getElementById("alignLeft")
      .addEventListener("click", () => this.updateStyle("textAlign", "left"));
    document
      .getElementById("alignCenter")
      .addEventListener("click", () => this.updateStyle("textAlign", "center"));

    // text shadow controls
    // Inside setupEventListeners()
    ["textShadowColor", "textShadowBlur", "textShadowX", "textShadowY"].forEach(
      (id) => {
        document.getElementById(id).addEventListener("input", () => {
          this.updateTextShadow();
        });
      }
    );

    ["boxShadowColor", "boxShadowBlur", "boxShadowX", "boxShadowY"].forEach(
      (id) => {
        document.getElementById(id).addEventListener("input", () => {
          this.updateBoxShadow();
        });
      }
    );

    // Position and size controls
    document
      .getElementById("posX")
      .addEventListener("input", (e) =>
        this.updatePosition("left", e.target.value + "px")
      );
    document
      .getElementById("posY")
      .addEventListener("input", (e) =>
        this.updatePosition("top", e.target.value + "px")
      );
    document
      .getElementById("width")
      .addEventListener("input", (e) =>
        this.updateSize("width", e.target.value + "px")
      );
    document
      .getElementById("height")
      .addEventListener("input", (e) =>
        this.updateSize("height", e.target.value + "px")
      );

    // Action buttons
    document
      .getElementById("duplicateBtn")
      .addEventListener("click", () => this.duplicateSelected());
    document
      .getElementById("deleteBtn")
      .addEventListener("click", () => this.deleteSelected());
    document
      .getElementById("bringForward")
      .addEventListener("click", () => this.bringForward());
    document
      .getElementById("sendBackward")
      .addEventListener("click", () => this.sendBackward());
    document
      .getElementById("undoBtn")
      .addEventListener("click", () => this.undo());
    document
      .getElementById("redoBtn")
      .addEventListener("click", () => this.redo());

    // File operations
    document
      .getElementById("exportBtn")
      .addEventListener("click", () => this.exportTemplate());
    document
      .getElementById("importFile")
      .addEventListener("change", (e) => this.importTemplate(e));

    // Canvas and document events
    document
      .getElementById("canvas")
      .addEventListener("click", (e) => this.handleCanvasClick(e));
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("contextmenu", (e) => this.handleContextMenu(e));
    document.addEventListener("click", (e) => this.hideContextMenu(e));
  }

  makeElementsEditable() {
    const elements = document.querySelectorAll(".editable");
    elements.forEach((element) => this.makeElementEditable(element));
  }

  makeElementEditable(element) {
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectElement(element);
    });

    element.addEventListener("mousedown", (e) => {
      if (e.target === element || element.contains(e.target)) {
        this.startDragging(e, element);
      }
    });

    element.addEventListener("dblclick", (e) => {
      if (element.hasAttribute("contenteditable")) {
        element.focus();
        this.selectAllText(element);
      }
    });
  }

  selectElement(element) {
    // Remove previous selection
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
      this.removeResizeHandles();
    }

    this.selectedElement = element;
    element.classList.add("selected");
    this.addResizeHandles(element);
    this.updateControlPanel();
    this.updateLayersList();
    this.showRelevantControls();
  }

  showRelevantControls() {
    if (!this.selectedElement) {
      this.showControlGroup("backgroundControls");
      return;
    }

    const elementType = this.selectedElement.getAttribute("data-type");

    switch (elementType) {
      case "text":
      case "logo":
        this.showControlGroup("textControls");
        document
          .getElementById("typographyControls")
          .classList.remove("hidden");

        // 👇 also allow background for text
        document
          .getElementById("backgroundControls")
          .classList.remove("hidden");
        break;

      case "button":
        this.showControlGroup("textControls");
        document
          .getElementById("typographyControls")
          .classList.remove("hidden");

        // 👇 buttons get background too
        document
          .getElementById("backgroundControls")
          .classList.remove("hidden");
        break;

      case "shape":
        this.showControlGroup("shapeControls");

        // 👇 shapes also can change background
        document
          .getElementById("backgroundControls")
          .classList.remove("hidden");
        break;

      case "div": // if you tag divs as data-type="div"
        this.showControlGroup("generalControls");

        // 👇 also allow background control
        document
          .getElementById("backgroundControls")
          .classList.remove("hidden");
        break;

      case "svg":
        this.showControlGroup("svgControls");
        break;

      case "image":
        if (this.selectedElement.classList.contains("background-image")) {
          this.showControlGroup("backgroundControls");
        } else {
          this.showControlGroup("generalControls");
        }
        break;

      default:
        this.showControlGroup("generalControls");
    }
  }

  updateCanvasBackground(color) {
    const canvas = document.getElementById("canvas");
    canvas.style.background = color;
    this.saveState();
  }

  updateCanvasGradient() {
    const color1 = document.getElementById("gradColor1").value;
    const color2 = document.getElementById("gradColor2").value;
    const direction = document.getElementById("gradDirection").value;

    let gradient;
    if (direction === "radial") {
      gradient = `radial-gradient(circle, ${color1}, ${color2})`;
    } else {
      gradient = `linear-gradient(${direction}, ${color1}, ${color2})`;
    }

    const canvas = document.getElementById("canvas");
    canvas.style.background = gradient;
    this.saveState();
  }

  updateSVGFill(color) {
    if (
      this.selectedElement &&
      this.selectedElement.getAttribute("data-type") === "svg"
    ) {
      const paths = this.selectedElement.querySelectorAll("path");
      paths.forEach((path) => {
        path.setAttribute("fill", color);
      });
      this.saveState();
    }
  }

  updateSVGOpacity(opacity) {
    if (
      this.selectedElement &&
      this.selectedElement.getAttribute("data-type") === "svg"
    ) {
      const paths = this.selectedElement.querySelectorAll("path");
      paths.forEach((path) => {
        path.setAttribute("opacity", opacity);
      });
      this.saveState();
    }
  }

  addResizeHandles(element) {
    // Skip resize handles for certain elements
    if (
      element.classList.contains("content-container") ||
      element.classList.contains("background-image")
    ) {
      return;
    }

    const handles = document.createElement("div");
    handles.className = "resize-handles";

    const handlePositions = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];
    handlePositions.forEach((position) => {
      const handle = document.createElement("div");
      handle.className = `resize-handle ${position}`;
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.startResizing(e, element, position);
      });
      handles.appendChild(handle);
    });

    element.appendChild(handles);
  }

  removeResizeHandles() {
    if (this.selectedElement) {
      const handles = this.selectedElement.querySelector(".resize-handles");
      if (handles) {
        handles.remove();
      }
    }
  }

  startDragging(e, element) {
    // Don't drag certain elements
    if (
      element.classList.contains("background-image") ||
      element.classList.contains("canvas") ||
      element.classList.contains("content-container")
    ) {
      return;
    }

    this.isDragging = true;
    const rect = element.getBoundingClientRect();
    const canvasRect = document
      .getElementById("canvas")
      .getBoundingClientRect();

    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;

    const mouseMoveHandler = (e) => {
      if (this.isDragging) {
        const x = e.clientX - canvasRect.left - this.dragOffset.x;
        const y = e.clientY - canvasRect.top - this.dragOffset.y;

        element.style.position = "absolute";
        element.style.left = x + "px";
        element.style.top = y + "px";

        this.updatePositionInputs();
      }
    };

    const mouseUpHandler = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.saveState();
      }
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  startResizing(e, element, position) {
    this.isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = element.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startLeft = parseInt(element.style.left || 0);
    const startTop = parseInt(element.style.top || 0);

    const mouseMoveHandler = (e) => {
      if (this.isResizing) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        // Calculate new dimensions based on handle position
        if (position.includes("e")) {
          newWidth = Math.max(20, startWidth + deltaX);
        }
        if (position.includes("s")) {
          newHeight = Math.max(20, startHeight + deltaY);
        }
        if (position.includes("w")) {
          newWidth = Math.max(20, startWidth - deltaX);
          newLeft = startLeft + deltaX;
        }
        if (position.includes("n")) {
          newHeight = Math.max(20, startHeight - deltaY);
          newTop = startTop + deltaY;
        }

        // Apply new dimensions
        element.style.width = newWidth + "px";
        element.style.height = newHeight + "px";
        element.style.left = newLeft + "px";
        element.style.top = newTop + "px";

        this.updatePositionInputs();
        this.updateSizeInputs();
      }
    };

    const mouseUpHandler = () => {
      if (this.isResizing) {
        this.isResizing = false;
        this.saveState();
      }
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  updateStyle(property, value) {
    if (this.selectedElement && !this.isUpdating) {
      if (
        property === "borderRadius" &&
        this.selectedElement.getAttribute("data-type") === "logo"
      ) {
        // apply to the image inside logo container
        const img = this.selectedElement.querySelector("img");
        if (img) img.style.borderRadius = value;
        this.selectedElement.style.overflow = "hidden"; // clip the image
      } else {
        this.selectedElement.style[property] = value;
      }
      this.saveState();
    }
  }

  updatePosition(property, value) {
    if (this.selectedElement && !this.isUpdating) {
      this.selectedElement.style[property] = value;
      this.saveState();
    }
  }

  updateSize(property, value) {
    if (this.selectedElement && !this.isUpdating) {
      this.selectedElement.style[property] = value;
      this.saveState();
    }
  }

  updateControlPanel() {
    if (!this.selectedElement) return;

    this.isUpdating = true;

    const computedStyle = getComputedStyle(this.selectedElement);
    const elementStyle = this.selectedElement.style;

    const elementType = this.selectedElement.getAttribute("data-type");

    if (
      elementType === "text" ||
      elementType === "logo" ||
      elementType === "button"
    ) {
      const target =
        elementType === "button" ? this.selectedElement : this.selectedElement;

      if (target.style.color) {
        document.getElementById("textColor").value = this.rgbToHex(
          target.style.color
        );
      } else if (elementType === "button" && elementStyle.backgroundColor) {
        document.getElementById("bgColor").value = this.rgbToHex(
          elementStyle.backgroundColor
        );
      }

      // 🔹 Update text shadow controls

      const shadow = getComputedStyle(target).textShadow;
      if (shadow && shadow !== "none") {
        const parts = shadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.*)/);
        if (parts) {
          document.getElementById("textShadowX").value = parseInt(parts[1]);
          document.getElementById("textShadowY").value = parseInt(parts[2]);
          document.getElementById("textShadowBlur").value = parseInt(parts[3]);
          document.getElementById("textShadowColor").value = this.rgbToHex(
            parts[4]
          );

          document.getElementById("textShadowXValue").textContent =
            parts[1] + "px";
          document.getElementById("textShadowYValue").textContent =
            parts[2] + "px";
          document.getElementById("textShadowBlurValue").textContent =
            parts[3] + "px";
        }
      } else {
        // Reset
        document.getElementById("textShadowX").value = 0;
        document.getElementById("textShadowY").value = 0;
        document.getElementById("textShadowBlur").value = 0;
        document.getElementById("textShadowColor").value = "#000000";
        document.getElementById("textShadowXValue").textContent = "0px";
        document.getElementById("textShadowYValue").textContent = "0px";
        document.getElementById("textShadowBlurValue").textContent = "0px";
      }
    }

    // Update box shadow controls
    const boxShadow = getComputedStyle(this.selectedElement).boxShadow;
    if (boxShadow && boxShadow !== "none") {
      const parts = boxShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.*)/);
      if (parts) {
        document.getElementById("boxShadowX").value = parseInt(parts[1]);
        document.getElementById("boxShadowY").value = parseInt(parts[2]);
        document.getElementById("boxShadowBlur").value = parseInt(parts[3]);
        document.getElementById("boxShadowColor").value = this.rgbToHex(
          parts[4]
        );

        document.getElementById("boxShadowXValue").textContent =
          parts[1] + "px";
        document.getElementById("boxShadowYValue").textContent =
          parts[2] + "px";
        document.getElementById("boxShadowBlurValue").textContent =
          parts[3] + "px";
      }
    } else {
      // Reset defaults
      document.getElementById("boxShadowX").value = 0;
      document.getElementById("boxShadowY").value = 0;
      document.getElementById("boxShadowBlur").value = 0;
      document.getElementById("boxShadowColor").value = "#000000";
    }

    // 🔹 Border Radius sync
    if (
      elementType === "shape" ||
      elementType === "div" ||
      elementType === "button" ||
      elementType === "image"
    ) {
      const borderRadius = parseInt(computedStyle.borderRadius) || 0;
      document.getElementById("borderRadius").value = borderRadius;
      document.getElementById("borderRadiusValue").textContent =
        borderRadius + "px";
    }

    // other element updates...
    if (elementType === "svg") {
      const path = this.selectedElement.querySelector("path");
      if (path) {
        const fillColor = path.getAttribute("fill") || "#3259E8";
        document.getElementById("svgFillColor").value = fillColor;

        const opacity = parseFloat(path.getAttribute("opacity") || 1) * 100;
        document.getElementById("svgOpacity").value = opacity;
        document.getElementById("svgOpacityValue").textContent = opacity + "%";
      }
    } else if (elementType === "shape") {
      if (elementStyle.backgroundColor) {
        document.getElementById("shapeColor").value = this.rgbToHex(
          elementStyle.backgroundColor
        );
      }
    }

    // General typography updates...
    const fontSize = parseInt(computedStyle.fontSize);
    if (fontSize) {
      document.getElementById("fontSize").value = fontSize;
      document.getElementById("fontSizeValue").textContent = fontSize + "px";
    }

    const fontWeight = computedStyle.fontWeight;
    if (fontWeight && !isNaN(fontWeight)) {
      document.getElementById("fontWeight").value = fontWeight;
      document.getElementById("fontWeightValue").textContent = fontWeight;
    }

    document
      .getElementById("italicBtn")
      .classList.toggle("active", computedStyle.fontStyle === "italic");
    document
      .getElementById("underlineBtn")
      .classList.toggle(
        "active",
        computedStyle.textDecoration.includes("underline")
      );

    // Update general opacity
    const opacity = parseFloat(elementStyle.opacity || 1) * 100;
    document.getElementById("opacity").value = opacity;
    document.getElementById("opacityValue").textContent = opacity + "%";

    this.updatePositionInputs();
    this.updateSizeInputs();

    this.isUpdating = false;
  }

  updatePositionInputs() {
    if (!this.selectedElement || this.isUpdating) return;

    const left = parseInt(this.selectedElement.style.left || 0);
    const top = parseInt(this.selectedElement.style.top || 0);

    document.getElementById("posX").value = left;
    document.getElementById("posY").value = top;
  }

  updateSizeInputs() {
    if (!this.selectedElement || this.isUpdating) return;

    const computedStyle = getComputedStyle(this.selectedElement);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);

    document.getElementById("width").value = width;
    document.getElementById("height").value = height;
  }

  toggleGradientControls() {
    const controls = document.getElementById("gradientControls");
    controls.classList.toggle("show");
    if (controls.classList.contains("show")) {
      this.updateCanvasGradient();
    }
  }

  toggleFontStyle() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.style.fontStyle;
    this.selectedElement.style.fontStyle =
      current === "italic" ? "normal" : "italic";
    document.getElementById("italicBtn").classList.toggle("active");
    this.saveState();
  }

  toggleTextDecoration() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.style.textDecoration;
    this.selectedElement.style.textDecoration =
      current === "underline" ? "none" : "underline";
    document.getElementById("underlineBtn").classList.toggle("active");
    this.saveState();
  }

  addTextElement() {
    const element = document.createElement("div");
    element.className = "editable text-element";
    element.contentEditable = true;
    element.textContent = "New Text";
    element.setAttribute("data-type", "text");
    element.style.position = "absolute";
    element.style.left = "100px";
    element.style.top = "100px";
    element.style.color = "#ffffff";
    element.style.fontSize = "24px";
    element.style.zIndex = "10";

    document.querySelector(".content-container").appendChild(element);
    this.makeElementEditable(element);
    this.selectElement(element);
    this.updateLayersList();
    this.saveState();
  }

  addShapeElement() {
    const element = document.createElement("div");
    element.className = "editable shape-element";
    element.setAttribute("data-type", "shape");
    element.style.position = "absolute";
    element.style.left = "100px";
    element.style.top = "100px";
    element.style.width = "100px";
    element.style.height = "100px";
    element.style.backgroundColor = "#3498db";
    element.style.borderRadius = "10px";
    element.style.zIndex = "10";

    document.querySelector(".content-container").appendChild(element);
    this.makeElementEditable(element);
    this.selectElement(element);
    this.updateLayersList();
    this.saveState();
  }

  addImageElement(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const element = document.createElement("img");
      element.className = "editable image-element";
      element.src = e.target.result;
      element.setAttribute("data-type", "image");
      element.style.position = "absolute";
      element.style.left = "100px";
      element.style.top = "100px";
      element.style.maxWidth = "300px";
      element.style.maxHeight = "200px";
      element.style.zIndex = "10";

      document.querySelector(".content-container").appendChild(element);
      this.makeElementEditable(element);
      this.selectElement(element);
      this.updateLayersList();
      this.saveState();
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  }

  duplicateSelected() {
    if (!this.selectedElement) return;

    const clone = this.selectedElement.cloneNode(true);
    clone.classList.remove("selected");

    // Remove resize handles from clone
    const handles = clone.querySelector(".resize-handles");
    if (handles) handles.remove();

    // Offset position
    const currentLeft = parseInt(this.selectedElement.style.left || 0);
    const currentTop = parseInt(this.selectedElement.style.top || 0);
    clone.style.left = currentLeft + 20 + "px";
    clone.style.top = currentTop + 20 + "px";

    this.selectedElement.parentNode.appendChild(clone);
    this.makeElementEditable(clone);
    this.selectElement(clone);
    this.updateLayersList();
    this.saveState();
  }

  deleteSelected() {
    if (
      this.selectedElement &&
      !this.selectedElement.classList.contains("background-image") &&
      !this.selectedElement.classList.contains("content-container")
    ) {
      this.selectedElement.remove();
      this.selectedElement = null;
      this.showDefaultControls();
      this.updateLayersList();
      this.saveState();
    }
  }

  bringForward() {
    if (!this.selectedElement) return;
    const currentZ = parseInt(this.selectedElement.style.zIndex) || 0;
    this.selectedElement.style.zIndex = currentZ + 1;
    this.saveState();
  }

  sendBackward() {
    if (!this.selectedElement) return;
    const currentZ = parseInt(this.selectedElement.style.zIndex) || 0;
    this.selectedElement.style.zIndex = Math.max(0, currentZ - 1);
    this.saveState();
  }

  handleCanvasClick(e) {
    if (e.target.id === "canvas") {
      this.deselectElement();
    }
  }

  deselectElement() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
      this.removeResizeHandles();
      this.selectedElement = null;
      this.showDefaultControls();
      this.updateLayersList();
    }
  }

  handleKeyDown(e) {
    if (!this.selectedElement) return;

    switch (e.key) {
      case "Delete":
      case "Backspace":
        if (
          !this.selectedElement.hasAttribute("contenteditable") ||
          document.activeElement !== this.selectedElement
        ) {
          this.deleteSelected();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        this.moveElement(0, -1);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.moveElement(0, 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.moveElement(-1, 0);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.moveElement(1, 0);
        break;
      case "c":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.duplicateSelected();
        }
        break;
    }
  }

  moveElement(deltaX, deltaY) {
    if (!this.selectedElement) return;

    const currentLeft = parseInt(this.selectedElement.style.left) || 0;
    const currentTop = parseInt(this.selectedElement.style.top) || 0;

    this.selectedElement.style.left = Math.max(0, currentLeft + deltaX) + "px";
    this.selectedElement.style.top = Math.max(0, currentTop + deltaY) + "px";

    this.updatePositionInputs();
    this.saveState();
  }

  handleContextMenu(e) {
    if (
      e.target.classList.contains("editable") ||
      e.target.closest(".editable")
    ) {
      e.preventDefault();
      const element = e.target.classList.contains("editable")
        ? e.target
        : e.target.closest(".editable");
      this.selectElement(element);
      this.showContextMenu(e.clientX, e.clientY);
    }
  }

  showContextMenu(x, y) {
    const menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
  }

  hideContextMenu(e) {
    const menu = document.getElementById("contextMenu");
    if (!menu.contains(e.target)) {
      menu.style.display = "none";
    }
  }

  updateLayersList() {
    const layersList = document.getElementById("layersList");
    layersList.innerHTML = "";

    const elements = document.querySelectorAll(".editable");
    elements.forEach((element) => {
      const layerItem = document.createElement("div");
      layerItem.className = "layer-item";
      if (element === this.selectedElement) {
        layerItem.classList.add("active");
      }

      const type = element.getAttribute("data-type");
      const elementName = element.getAttribute("data-element") || "Element";

      let icon = "";
      let name = "";

      switch (type) {
        case "text":
        case "logo":
        case "button":
          icon = '<i class="fas fa-font"></i>';
          name = elementName.charAt(0).toUpperCase() + elementName.slice(1);
          break;
        case "image":
          icon = '<i class="fas fa-image"></i>';
          name = elementName === "background" ? "Background" : "Image";
          break;
        case "svg":
          icon = '<i class="fas fa-draw-polygon"></i>';
          name = "Shape";
          break;
        case "shape":
          icon = '<i class="fas fa-square"></i>';
          name = "Shape";
          break;
        default:
          icon = '<i class="fas fa-cube"></i>';
          name = "Element";
      }

      layerItem.innerHTML = `${icon} ${name}`;
      layerItem.addEventListener("click", () => {
        this.selectElement(element);
      });

      layersList.appendChild(layerItem);
    });
  }

  selectAllText(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  rgbToHex(rgb) {
    if (rgb.startsWith("#")) return rgb;

    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return "#000000";

    return (
      "#" +
      result
        .slice(0, 3)
        .map((x) => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  // updated text shadow
  updateTextShadow() {
    if (
      !this.selectedElement ||
      !["text", "logo", "button"].includes(
        this.selectedElement.getAttribute("data-type")
      )
    ) {
      return;
    }

    const color = document.getElementById("textShadowColor").value;
    const blur = document.getElementById("textShadowBlur").value;
    const offsetX = document.getElementById("textShadowX").value;
    const offsetY = document.getElementById("textShadowY").value;

    // Live labels
    document.getElementById("textShadowBlurValue").textContent = blur + "px";
    document.getElementById("textShadowXValue").textContent = offsetX + "px";
    document.getElementById("textShadowYValue").textContent = offsetY + "px";

    // ✅ Apply shadow to the element itself (works for <button> text too)
    this.selectedElement.style.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;

    this.saveState();
  }

  // updatebox shdaoe
  updateBoxShadow() {
    if (!this.selectedElement) return;

    const x = document.getElementById("boxShadowX").value || 0;
    const y = document.getElementById("boxShadowY").value || 0;
    const blur = document.getElementById("boxShadowBlur").value || 0;
    const color = document.getElementById("boxShadowColor").value || "#000000";

    this.selectedElement.style.boxShadow = `${x}px ${y}px ${blur}px ${color}`;

    document.getElementById("boxShadowXValue").textContent = `${x}px`;
    document.getElementById("boxShadowYValue").textContent = `${y}px`;
    document.getElementById("boxShadowBlurValue").textContent = `${blur}px`;

    this.saveState();
  }

  // History Management
  saveState() {
    if (this.isUpdating) return;

    const canvas = document.getElementById("canvas");
    const state = canvas.outerHTML;

    // Remove states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);

    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  restoreState(state) {
    const canvasArea = document.querySelector(".canvas-area");
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = state;
    const newCanvas = tempDiv.firstChild;

    const oldCanvas = document.getElementById("canvas");
    canvasArea.replaceChild(newCanvas, oldCanvas);

    this.selectedElement = null;
    this.makeElementsEditable();
    this.updateLayersList();
    this.showDefaultControls();
  }

  // Export/Import functionality
  exportTemplate() {
    const canvas = document.getElementById("canvas");
    const templateData = {
      html: canvas.outerHTML,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(templateData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "template_" + Date.now() + ".json";
    a.click();

    URL.revokeObjectURL(url);
  }

  importTemplate(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target.result);

        if (templateData.html) {
          const canvasArea = document.querySelector(".canvas-area");
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = templateData.html;
          const newCanvas = tempDiv.firstChild;

          const oldCanvas = document.getElementById("canvas");
          canvasArea.replaceChild(newCanvas, oldCanvas);

          this.selectedElement = null;
          this.makeElementsEditable();
          this.updateLayersList();
          this.showDefaultControls();
          this.saveState();

          alert("Template imported successfully!");
        } else {
          alert("Invalid template file format");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import template");
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  }
}

// Initialize editor when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const editor = new TemplateEditor();

  // Context menu event listeners
  document.getElementById("editText").addEventListener("click", () => {
    if (
      editor.selectedElement &&
      editor.selectedElement.hasAttribute("contenteditable")
    ) {
      editor.selectedElement.focus();
    }
    document.getElementById("contextMenu").style.display = "none";
  });

  document.getElementById("duplicate").addEventListener("click", () => {
    editor.duplicateSelected();
    document.getElementById("contextMenu").style.display = "none";
  });

  document.getElementById("delete").addEventListener("click", () => {
    editor.deleteSelected();
    document.getElementById("contextMenu").style.display = "none";
  });

  document.getElementById("bringToFront").addEventListener("click", () => {
    if (editor.selectedElement) {
      editor.selectedElement.style.zIndex = "1000";
      editor.saveState();
    }
    document.getElementById("contextMenu").style.display = "none";
  });

  document.getElementById("sendToBack").addEventListener("click", () => {
    if (editor.selectedElement) {
      editor.selectedElement.style.zIndex = "1";
      editor.saveState();
    }
    document.getElementById("contextMenu").style.display = "none";
  });
});
