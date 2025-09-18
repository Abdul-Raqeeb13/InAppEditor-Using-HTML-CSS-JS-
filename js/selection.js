let selected = null;

export function enableSelection() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("editable")) {
      if (selected) selected.classList.remove("selected");
      selected = e.target;
      selected.classList.add("selected");

      const event = new CustomEvent("elementSelected", { detail: selected });
      document.dispatchEvent(event);
    }
  });
}
