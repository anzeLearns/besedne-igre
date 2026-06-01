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
let autoAdvanceTicker = 0;
let autoAdvance = null;

const AUTO_ADVANCE_DELAYS = {
  "word-solved": 2300,
  "word-failed": 2800,
  "letter-complete": 3200
};

function render() {
  renderApp(root, state, ALPHABET, {
    isIntroOpen: introOpen,
    isFirstVisit: !introSeen,
    categoryTransition,
    autoAdvance
  });

  document.body.classList.toggle("has-modal-open", introOpen || state.round.status === "game-over");

  if (introOpen) {
    const overlay = root.querySelector("[data-intro-overlay]");
    const primaryAction = overlay?.querySelector("[data-intro-primary]");
    const focusable = getIntroFocusableElements(overlay);
    (primaryAction || focusable[0])?.focus();
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
  window.clearInterval(autoAdvanceTicker);
  autoAdvanceTimer = 0;
  autoAdvanceTicker = 0;

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

function isLetterAdvanceTransition() {
  return state.round.status === "letter-complete";
}

function canAutoAdvance() {
  return (
    !introOpen &&
    !categoryTransition &&
    (isCategoryAdvanceTransition() || isLetterAdvanceTransition()) &&
    Boolean(AUTO_ADVANCE_DELAYS[state.round.status])
  );
}

function getAutoAdvanceStatus() {
  return isLetterAdvanceTransition() ? "next-letter" : "next-category";
}

function getAutoAdvanceCountdownText() {
  if (!autoAdvance?.active) {
    return "";
  }

  const remaining = Math.max(0, autoAdvance.endsAt - Date.now());
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  return `Čez ${seconds}s`;
}

function updateAutoAdvanceCountdown() {
  const countdownText = getAutoAdvanceCountdownText();
  const countdownElements = root.querySelectorAll("[data-auto-advance-countdown]");

  countdownElements.forEach((element) => {
    if (element.textContent !== countdownText) {
      element.textContent = countdownText;
    }
  });
}

function performAdvance() {
  if (isCategoryAdvanceTransition()) {
    runCategoryAdvanceTransition();
    return;
  }

  clearCategoryTransition();
  advanceState(state);
  renderWithEffectsReset();
}

function syncAutoAdvance() {
  if (!canAutoAdvance()) {
    clearAutoAdvance();
    return;
  }

  const delay = AUTO_ADVANCE_DELAYS[state.round.status];
  const now = Date.now();
  const nextAutoAdvance = {
    active: true,
    status: getAutoAdvanceStatus(),
    delay,
    startedAt: now,
    endsAt: now + delay
  };

  if (
    autoAdvance?.status !== nextAutoAdvance.status ||
    autoAdvance?.endsAt !== nextAutoAdvance.endsAt
  ) {
    autoAdvance = nextAutoAdvance;
    updateAutoAdvanceCountdown();
  }

  if (!autoAdvanceTicker) {
    autoAdvanceTicker = window.setInterval(() => {
      if (autoAdvance?.active) {
        updateAutoAdvanceCountdown();
      }
    }, 200);
  }

  if (!autoAdvanceTimer) {
    autoAdvanceTimer = window.setTimeout(() => {
      autoAdvanceTimer = 0;

      if (!canAutoAdvance()) {
        clearAutoAdvance();
        return;
      }

      clearAutoAdvance();
      performAdvance();
    }, delay);
  }
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

    performAdvance();
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
