import { advanceState, clearEffects, guessLetter, prepareGame, useHint } from "./game/na-crko-engine.js";
import { bindKeyboardHandlers } from "./game/na-crko-keyboard.js";
import { renderApp } from "./game/na-crko-render.js";
import { ALPHABET, createGameState } from "./game/na-crko-state.js";
import { loadIntroSeen, resetProfile, saveIntroSeen } from "./game/na-crko-storage.js";
import { getIntroFocusableElements } from "./ui/intro-overlay.js";

const root = document.querySelector("#app");
const state = createGameState(resetProfile());

let introSeen = loadIntroSeen();
let introOpen = !introSeen;
let clearEffectsTimer = 0;
let categoryTransitionTimer = 0;
let categoryTransition = null;
let autoAdvanceTimer = 0;
let autoAdvance = null;

const AUTO_ADVANCE_DELAYS = {
  "word-solved": 2300,
  "word-failed": 2800
};

function render() {
  renderApp(root, state, ALPHABET, {
    isIntroOpen: introOpen,
    isFirstVisit: !introSeen,
    categoryTransition,
    autoAdvance
  });

  const letterCompleteDialog = root.querySelector("[data-letter-complete-dialog]");
  document.body.classList.toggle("has-modal-open", introOpen || Boolean(letterCompleteDialog));

  if (introOpen) {
    const overlay = root.querySelector("[data-intro-overlay]");
    const primaryAction = overlay?.querySelector("[data-intro-primary]");
    const focusable = getIntroFocusableElements(overlay);
    (primaryAction || focusable[0])?.focus();
  } else {
    letterCompleteDialog?.querySelector("[data-action='advance']")?.focus();
  }
}

function renderWithEffectsReset() {
  render();
  window.clearTimeout(clearEffectsTimer);

  const hasEffects = Object.values(state.effects).some(Boolean);
  if (!hasEffects) {
    return;
  }

  const effectsDelay = state.effects.hintRevealedLetter || state.effects.hintUnavailable ? 1400 : 420;
  clearEffectsTimer = window.setTimeout(() => {
    clearEffects(state);
    render();
  }, effectsDelay);
}

function clearCategoryTransition() {
  window.clearTimeout(categoryTransitionTimer);
  categoryTransition = null;
}

function clearAutoAdvance(shouldRender = false) {
  window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = 0;

  if (!autoAdvance) {
    return;
  }

  autoAdvance = null;

  if (shouldRender) {
    render();
  }
}

function isCategoryAdvanceTransition() {
  if (state.round.status !== "word-solved" && state.round.status !== "word-failed") {
    return false;
  }

  return state.run.currentCategoryIndex < state.run.selectedCategoryIds.length - 1;
}

function canAutoAdvance() {
  return (
    !introOpen &&
    !categoryTransition &&
    isCategoryAdvanceTransition() &&
    Boolean(AUTO_ADVANCE_DELAYS[state.round.status])
  );
}

function syncAutoAdvance() {
  if (!canAutoAdvance()) {
    clearAutoAdvance();
    return;
  }

  const delay = AUTO_ADVANCE_DELAYS[state.round.status];
  const nextAutoAdvance = {
    active: true,
    status: state.round.status,
    text: "Samodejno nadaljevanje …"
  };

  if (autoAdvance?.status !== nextAutoAdvance.status) {
    autoAdvance = nextAutoAdvance;
  }

  if (autoAdvanceTimer) {
    return;
  }

  autoAdvanceTimer = window.setTimeout(() => {
    autoAdvanceTimer = 0;

    if (!canAutoAdvance()) {
      clearAutoAdvance();
      return;
    }

    autoAdvance = null;
    runCategoryAdvanceTransition();
  }, delay);
}

function runCategoryAdvanceTransition() {
  const previousCategoryId = state.round.categoryId;
  clearAutoAdvance();
  clearCategoryTransition();
  window.clearTimeout(clearEffectsTimer);
  categoryTransition = {
    phase: "out",
    previousCategoryId
  };
  render();

  categoryTransitionTimer = window.setTimeout(() => {
    advanceState(state);
    categoryTransition = {
      phase: "in",
      previousCategoryId
    };
    renderWithEffectsReset();

    categoryTransitionTimer = window.setTimeout(() => {
      categoryTransition = null;
      render();
    }, 360);
  }, 150);
}

function handleGuess(letter) {
  if (introOpen || categoryTransition) {
    return;
  }

  clearAutoAdvance();
  guessLetter(state, letter);
  renderWithEffectsReset();
  syncAutoAdvance();
}

function trapIntroFocus(event) {
  if (!introOpen) {
    return false;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    if (!introSeen) {
      return true;
    }

    introOpen = false;
    render();
    return true;
  }

  if (event.key !== "Tab") {
    return false;
  }

  const focusable = getIntroFocusableElements(root.querySelector("[data-intro-overlay]"));
  if (focusable.length === 0) {
    event.preventDefault();
    return true;
  }

  const currentIndex = focusable.indexOf(document.activeElement);
  const nextIndex = event.shiftKey
    ? (currentIndex <= 0 ? focusable.length : currentIndex) - 1
    : (currentIndex + 1) % focusable.length;

  event.preventDefault();
  focusable[nextIndex]?.focus();
  return true;
}

function handleAction(actionOrEvent) {
  if (typeof actionOrEvent !== "string") {
    return trapIntroFocus(actionOrEvent);
  }

  if (actionOrEvent === "open-intro") {
    clearAutoAdvance();
    introOpen = true;
    render();
    return;
  }

  if (actionOrEvent === "dismiss-intro") {
    clearAutoAdvance();
    introOpen = false;
    render();
    return;
  }

  if (actionOrEvent === "accept-intro") {
    clearAutoAdvance();
    introSeen = true;
    introOpen = false;
    saveIntroSeen(true);
    render();
    return;
  }

  if (introOpen) {
    return;
  }

  if (actionOrEvent === "restart") {
    clearAutoAdvance();
    clearCategoryTransition();
    prepareGame(state, ALPHABET);
    render();
    return;
  }

  if (actionOrEvent === "hint") {
    clearAutoAdvance();
    if (categoryTransition) {
      return;
    }

    useHint(state);
    renderWithEffectsReset();
    syncAutoAdvance();
    return;
  }

  if (actionOrEvent === "advance") {
    clearAutoAdvance();

    if (categoryTransition) {
      return;
    }

    if (isCategoryAdvanceTransition()) {
      runCategoryAdvanceTransition();
      return;
    }

    clearCategoryTransition();
    advanceState(state);
    renderWithEffectsReset();
  }
}

prepareGame(state, ALPHABET);
render();
bindKeyboardHandlers(root, ALPHABET, handleGuess, handleAction);

window.addEventListener("beforeunload", () => {
  window.clearTimeout(clearEffectsTimer);
  clearCategoryTransition();
  clearAutoAdvance();
});
