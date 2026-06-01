import { normalizeInput } from "./na-crko-state.js";

export function bindKeyboardHandlers(root, alphabet, onGuess, onAction) {
  root.addEventListener("click", (event) => {
    const key = event.target.closest("[data-key]")?.dataset.key;
    if (key) {
      onGuess(key);
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action) {
      onAction(action);
    }
  });

  window.addEventListener("keydown", (event) => {
    const wasHandled = onAction(event);
    if (wasHandled === true) {
      return;
    }

    const letter = normalizeInput(event.key);
    if (!alphabet.includes(letter)) {
      return;
    }

    event.preventDefault();
    onGuess(letter);
  });
}
