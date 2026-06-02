import { MAX_LIVES, getLevelInfo } from "./na-crko-state.js";
import { getCurrentCategory, getSelectedCategories } from "./na-crko-engine.js";
import { renderHangmanScene } from "../ui/na-crko-svg.js";
import { renderIntroOverlay } from "../ui/intro-overlay.js";

const CATEGORY_SCENE_IMAGES = {
  predmet: "./assets/scenes/predmet.webp",
  mesto: "./assets/scenes/mesto.webp",
  drzava: "./assets/scenes/drzava.webp",
  zival: "./assets/scenes/zival.webp",
  poklic: "./assets/scenes/poklic.webp",
  hrana: "./assets/scenes/hrana.webp"
};

const CATEGORY_THUMBNAIL_IMAGES = {
  predmet: "./assets/category_images/predmet.webp",
  mesto: "./assets/category_images/mesto.webp",
  drzava: "./assets/category_images/drzava.webp",
  zival: "./assets/category_images/zival.webp",
  poklic: "./assets/category_images/poklic.webp",
  hrana: "./assets/category_images/hrana.webp"
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Š", "Ž"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Č"],
  ["Y", "X", "C", "V", "B", "N", "M"]
];

let categoryImagesPreloaded = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHearts(lives, pulse, status = "playing") {
  return Array.from({ length: MAX_LIVES }, (_, index) => {
    const isFilled = index < lives;
    const isLifeLost = pulse && status === "word-failed" && !isFilled && index === lives;
    const isLifeGained = pulse && status === "letter-complete" && isFilled && index === lives - 1;
    const className = `heart${isFilled ? "" : " empty"}${isLifeGained ? " gained" : ""}${isLifeLost ? " lost" : ""}`;
    return `<span class="${className}" aria-hidden="true">❤</span>`;
  }).join("");
}

function getHiddenLetters(state) {
  return [...new Set([...state.round.answer])].filter((letter) => {
    return letter !== " " && letter !== state.run.currentLetter && !state.round.revealedLetters.has(letter);
  });
}

function renderWord(answer, revealedLetters, revealAll, clueLetter, highlightedLetter = "", highlightedKind = "correct") {
  const words = answer.split(" ");
  let hitIndex = 0;
  let slotIndex = 0;

  return words
    .map((word) => {
      const slots = [...word]
        .map((letter) => {
          const isVisible = revealAll || revealedLetters.has(letter);
          const isClue = isVisible && letter === clueLetter;
          const isHit = isVisible && highlightedLetter && letter === highlightedLetter;
          const isHintHit = isHit && highlightedKind === "hint";
          const staggerIndex = isHit ? hitIndex++ : -1;
          const styles = [`--slot-order: ${slotIndex++}`];

          if (isHit) {
            styles.push(`--slot-stagger: ${staggerIndex * 70}ms`);
          }

          const style = ` style="${styles.join("; ")}"`;
          return `<span class="letter-slot${isVisible ? " revealed" : ""}${isClue ? " clue" : ""}${isHit ? " hit" : ""}${isHintHit ? " hint-hit" : ""}" data-letter="${escapeHtml(letter)}"${style}>${isVisible ? `${escapeHtml(letter)}${isHit ? '<span class="slot-spark" aria-hidden="true"></span>' : ""}` : ""}</span>`;
        })
        .join("");

      return `<div class="word-row">${slots}</div>`;
    })
    .join('<div class="space-slot" aria-hidden="true"></div>');
}

function getWordLengthClass(answer) {
  const compactLength = answer.replaceAll(" ", "").length;

  if (compactLength >= 11) {
    return "word-length-very-long";
  }

  if (compactLength >= 9) {
    return "word-length-long";
  }

  if (compactLength >= 6) {
    return "word-length-medium";
  }

  return "word-length-short";
}

function renderHintButton(state, compact = false) {
  const hiddenLetters = getHiddenLetters(state);
  const isPlaying = state.round.status === "playing";
  const isUsed = state.run.hintUsedForCurrentLetter || !state.run.hintAvailableForLetter;
  const isUnneeded = hiddenLetters.length === 0;
  const disabled = !isPlaying || isUsed || isUnneeded;
  const label = "💡 Pomoč";

  return `
    <button
      class="hint-button${compact ? " hint-button-compact" : ""}${state.effects.hintRevealedLetter ? " hint-button-used-now" : ""}"
      type="button"
      data-action="hint"
      aria-label="Uporabi pomoč za razkritje ene črke"
      ${disabled ? "disabled" : ""}
    >
      ${label}
    </button>
  `;
}

function preloadCategoryImages() {
  if (categoryImagesPreloaded || typeof Image === "undefined") {
    return;
  }

  categoryImagesPreloaded = true;
  [...Object.values(CATEGORY_SCENE_IMAGES), ...Object.values(CATEGORY_THUMBNAIL_IMAGES)].forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}

function getPlayingStatusContent(state) {
  if (state.round.status === "playing" && state.effects.hintRevealedLetter) {
    return {
      className: "status-banner neutral hint pulse",
      kicker: "Pomoč",
      title: `Razkrita črka: ${state.effects.hintRevealedLetter}`,
      text: `Pomoč je razkrila črko: ${state.effects.hintRevealedLetter}`
    };
  }

  if (state.round.status === "playing" && state.effects.hintUnavailable) {
    return {
      className: "status-banner neutral hint",
      kicker: "Pomoč",
      title: "Pomoč ni več potrebna.",
      text: "V tej besedi ni več skritih črk za pomoč."
    };
  }

  if (state.round.status === "playing" && state.effects.wrongLetter) {
    return {
      className: "status-banner neutral warning pulse",
      kicker: "Napaka",
      title: "Ni te črke.",
      text: `Črka ${state.effects.wrongLetter} ni v besedi. Poskusi znova.`
    };
  }

  return {
    className: "status-banner neutral",
    kicker: "Na potezi",
    title: "Ugibaj črke",
    text: `Pri tej besedi imaš ${state.round.maxWrongGuesses} napak.`
  };
}

function renderKeyButton(letter, state) {
  const disabled = state.round.status !== "playing";
  const isCorrect = state.round.revealedLetters.has(letter);
  const isWrong = state.round.wrongLetters.has(letter);
  const isClue = letter === state.run.currentLetter && isCorrect;
  const isUsed = isCorrect || isWrong;
  const className = [
    "key-button",
    isCorrect ? "correct" : "",
    state.effects.correctLetter === letter ? "correct-hit" : "",
    isWrong ? "wrong" : "",
    isClue ? "clue" : "",
    isUsed ? "locked" : "",
    state.effects.wrongLetter === letter ? "shake" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      class="${className}"
      type="button"
      data-key="${letter}"
      ${disabled || isUsed ? "disabled" : ""}
      aria-label="Ugibaj črko ${letter}"
    >
      ${letter}
    </button>
  `;
}

function renderKeyboard(state) {
  return KEYBOARD_ROWS.map(
    (row) => `
      <div class="keyboard-row">
        ${row.map((letter) => renderKeyButton(letter, state)).join("")}
      </div>
    `
  ).join("");
}

function renderMobileKeyboard(state) {
  return KEYBOARD_ROWS.map(
    (row) => `
      <div class="mobile-keyboard-row">
        ${row.map((letter) => renderKeyButton(letter, state)).join("")}
      </div>
    `
  ).join("");
}

function renderAmbientSparks(className = "ambient-sparks") {
  return `
    <div class="${className}" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
}

function renderCategoryProgress(state) {
  const categories = getSelectedCategories(state);

  return categories
    .map((category, index) => {
      const result = state.run.categoryResults[index];
      const isCurrent = index === state.run.currentCategoryIndex && state.round.status !== "letter-complete";
      const isSolved = result === "solved";
      const isFailed = result === "failed";
      const isLocked = !isSolved && !isFailed && !isCurrent;
      const className = [
        "category-chip",
        isSolved ? "resolved" : "",
        isFailed ? "missed" : "",
        isCurrent ? "current" : "",
        isLocked ? "locked" : ""
      ]
        .filter(Boolean)
        .join(" ");

      const status = isSolved ? "Rešeno" : isFailed ? "Zgrešeno" : isCurrent ? "Trenutno" : "Zaklenjeno";
      const badge = isSolved ? "✓" : isFailed ? "✕" : isCurrent ? "●" : "🔒";

      return `
        <div class="${className}">
          <div class="chip-topline">
            <div class="chip-icon" aria-hidden="true">${category.icon}</div>
            <span class="chip-badge" aria-hidden="true">${badge}</span>
          </div>
          <div class="chip-copy">
            <span class="chip-title" title="${escapeHtml(category.label)}">${escapeHtml(category.label)}</span>
            <span class="chip-status">${status}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function getDrawingSceneImage(categoryId) {
  return CATEGORY_SCENE_IMAGES[categoryId] || CATEGORY_SCENE_IMAGES.predmet;
}

function renderDrawingCard(state, categoryId, compact = false, transition = null) {
  const sceneImage = getDrawingSceneImage(categoryId);
  const previousSceneImage = transition?.previousCategoryId ? getDrawingSceneImage(transition.previousCategoryId) : "";
  const showPreviousScene = transition?.phase === "in" && previousSceneImage && previousSceneImage !== sceneImage;
  const transitionClass = transition?.phase ? ` drawing-transition-${transition.phase}` : "";

  return `
    <div class="drawing-card${compact ? " drawing-card-compact" : ""}">
      ${compact ? "" : `<div class="drawing-top drawing-top-solo">
        <div class="mistake-pill${state.effects.pulseMistakes ? " pulse" : ""}">
          Napake: <strong>${state.round.wrongGuessCount} / ${state.round.maxWrongGuesses}</strong>
        </div>
      </div>`}
      <div class="svg-frame${state.effects.bumpStage ? " bump" : ""}${compact ? " svg-frame-compact" : ""}${transitionClass}">
        <div class="drawing-background" style="--scene-image: url('${sceneImage}')" aria-hidden="true"></div>
        ${showPreviousScene ? `<div class="drawing-background drawing-background-previous" style="--scene-image: url('${previousSceneImage}')" aria-hidden="true"></div>` : ""}
        ${renderAmbientSparks("drawing-fireflies")}
        ${renderHangmanScene(
          state.round.wrongGuessCount,
          state.round.maxWrongGuesses,
          state.effects.bumpStage,
          compact ? "mobile" : "desktop"
        )}
        ${state.round.wrongGuessCount === 0 ? '<p class="stage-placeholder">Risba se začne ob prvi napaki.</p>' : ""}
      </div>
    </div>
  `;
}

function getCategoryAccentClass(categoryId) {
  return `category-accent-${categoryId || "predmet"}`;
}

function renderMobileCategorySpotlight(state, category, progressCurrent, progressTotal) {
  const thumbnailImage = CATEGORY_THUMBNAIL_IMAGES[category.id] || CATEGORY_THUMBNAIL_IMAGES.predmet;

  return `
    <section class="mobile-category-spotlight ${getCategoryAccentClass(category.id)}" aria-label="Trenutna kategorija">
      <div class="mobile-category-thumbnail" style="--category-thumbnail: url('${thumbnailImage}')" aria-hidden="true"></div>
      <div class="mobile-category-copy">
        <h2 class="mobile-category-name">${escapeHtml(category.label)}</h2>
        <p class="mobile-category-meta">
          <span>Črka <strong>${state.run.currentLetter}</strong></span>
          <span class="mobile-category-meta-divider" aria-hidden="true">•</span>
          <span>${progressCurrent}/${progressTotal}</span>
        </p>
      </div>
    </section>
  `;
}

function renderDesktopCategorySpotlight(state, category, progressCurrent, progressTotal) {
  const thumbnailImage = CATEGORY_THUMBNAIL_IMAGES[category.id] || CATEGORY_THUMBNAIL_IMAGES.predmet;

  return `
    <section class="desktop-category-spotlight ${getCategoryAccentClass(category.id)}" aria-label="Trenutna kategorija">
      <div class="desktop-category-thumbnail" style="--category-thumbnail: url('${thumbnailImage}')" aria-hidden="true"></div>
      <div class="desktop-category-copy">
        <span class="panel-label">Kategorija</span>
        <h2 class="desktop-category-name">${escapeHtml(category.label)}</h2>
        <p class="desktop-category-meta">
          <span>Črka <strong>${state.run.currentLetter}</strong></span>
          <span aria-hidden="true">•</span>
          <span>${progressCurrent}/${progressTotal}</span>
        </p>
      </div>
    </section>
  `;
}

function getAutoAdvanceUi(autoAdvance) {
  if (!autoAdvance?.active) {
    return { seconds: null };
  }

  const remaining = Math.max(0, autoAdvance.endsAt - Date.now());
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  return { seconds };
}

function getResultActionContent(state, autoAdvance) {
  const { seconds } = getAutoAdvanceUi(autoAdvance);
  const countdown = seconds == null ? "" : `Čez ${seconds}s`;

  if (state.round.status === "word-solved") {
    return {
      className: "result-action-panel success",
      headline: `✅ Pravilno · +${state.round.pointsAwardedLastStep} točk`,
      countdown,
      details: "",
      showButton: true
    };
  }

  if (state.round.status === "word-failed") {
    return {
      className: "result-action-panel failure",
      headline: `💔 Ni uspelo · ${escapeHtml(state.round.answer)}`,
      countdown,
      details: "",
      showButton: true
    };
  }

  if (state.round.status === "letter-complete") {
    const details = [];

    if (state.round.lastPerfectBonus) {
      details.push(`+${state.round.lastPerfectBonus} bonus`);
    }

    if (state.round.lastLifeGained) {
      details.push("+1 življenje");
    }

    return {
      className: "result-action-panel reward",
      headline: `⭐ Črka ${state.run.currentLetter} zaključena · +${state.round.lastLetterBonus} točk`,
      countdown,
      details: details.join(" • "),
      showButton: true
    };
  }

  const status = getPlayingStatusContent(state);

  return {
    className: "result-action-panel idle",
    headline: status.title,
    countdown: "",
    details: status.text,
    showButton: false
  };
}

function renderResultActionPanel(state, autoAdvance = null, compact = false) {
  const content = getResultActionContent(state, autoAdvance);
  const buttonClassName = `primary-button result-action-button${content.showButton ? "" : " result-action-button-hidden"}`;
  const detailsHidden = content.details ? "" : ' hidden aria-hidden="true"';
  const countdownHidden = content.showButton ? "" : ' hidden aria-hidden="true"';

  return `
    <section class="${content.className}${compact ? " result-action-panel-compact" : ""}" aria-live="polite">
      <div class="result-action-copy">
        <p class="result-action-headline" data-result-headline>${content.headline}</p>
        <p class="result-action-details" data-result-details${detailsHidden}>${content.details}</p>
        <p class="result-action-countdown" data-auto-advance-countdown${countdownHidden}>${content.countdown}</p>
      </div>
      <button class="${buttonClassName}" type="button" data-action="advance" ${content.showButton ? "" : 'tabindex="-1" aria-hidden="true"'}>Naprej</button>
    </section>
  `;
}

function renderRulesButton(compact = false) {
  return `
    <button
      class="help-button${compact ? " compact" : ""}"
      type="button"
      data-action="open-intro"
      aria-label="Odpri pravila igre"
      title="Pravila"
    >
      <span class="help-button-icon" aria-hidden="true">?</span>
      <span class="help-button-label">Pravila</span>
    </button>
  `;
}

function renderOverlay(state) {
  if (state.round.status !== "game-over") {
    return "";
  }

  const summary = state.round.finalSummary;

  return `
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <section class="overlay-card">
        <span class="overlay-kicker">Konec igre</span>
        <h2 class="overlay-title" id="overlay-title">Tek je končan</h2>
        <p class="overlay-text">
          Življenja so pošla. Rezultat se je shranil v dolgoročno statistiko.
          ${summary.beatBestRun || summary.beatBestLetters ? " Dosežen je nov osebni rekord." : ""}
        </p>
        <div class="overlay-bonuses">
          <div class="bonus-pill"><span>Točke v tem poskusu</span><strong>${summary.runPoints}</strong></div>
          <div class="bonus-pill"><span>Zaključene črke</span><strong>${summary.completedLetters}</strong></div>
          <div class="bonus-pill"><span>Najboljši poskus</span><strong>${state.profile.bestRunPoints}</strong></div>
          <div class="bonus-pill"><span>Največ črk</span><strong>${state.profile.bestCompletedLetters}</strong></div>
        </div>
        <button class="primary-button overlay-restart-button" type="button" data-action="restart">Nova igra</button>
      </section>
    </div>
  `;
}

function getRenderContext(state, autoAdvance = null) {
  const visibleTotalPoints = state.profile.totalPoints + state.run.runPoints;
  const levelInfo = getLevelInfo(visibleTotalPoints);
  const currentCategory = getCurrentCategory(state);
  const status = getPlayingStatusContent(state);
  const revealAll = state.round.status !== "playing" && state.round.status !== "word-solved";
  const isSolvedReveal = state.round.status === "word-solved";
  const isFailedReveal = state.round.status === "word-failed";
  const progressCurrent = state.run.currentCategoryIndex + 1;
  const progressTotal = state.run.selectedCategoryIds.length || state.run.categoryCountForLetter;
  const keyboard = renderKeyboard(state);
  const mobileKeyboard = renderMobileKeyboard(state);
  const categoryProgress = renderCategoryProgress(state);
  const highlightedLetter = state.effects.correctLetter || state.effects.hintRevealedLetter;
  const highlightedKind = state.effects.hintRevealedLetter ? "hint" : "correct";

  return {
    visibleTotalPoints,
    levelInfo,
    currentCategory,
    status,
    revealAll,
    isSolvedReveal,
    isFailedReveal,
    progressCurrent,
    progressTotal,
    keyboard,
    mobileKeyboard,
    categoryProgress,
    highlightedLetter,
    highlightedKind,
    autoAdvance
  };
}

function updateHintButtonElement(button, state, compact = false) {
  if (!button) {
    return;
  }

  const hiddenLetters = getHiddenLetters(state);
  const isPlaying = state.round.status === "playing";
  const isUsed = state.run.hintUsedForCurrentLetter || !state.run.hintAvailableForLetter;
  const isUnneeded = hiddenLetters.length === 0;
  const disabled = !isPlaying || isUsed || isUnneeded;
  const className = `hint-button${compact ? " hint-button-compact" : ""}${state.effects.hintRevealedLetter ? " hint-button-used-now" : ""}`;

  if (button.className !== className) {
    button.className = className;
  }

  if (button.disabled !== disabled) {
    button.disabled = disabled;
  }

  if (button.getAttribute("aria-label") !== "Uporabi pomoč za razkritje ene črke") {
    button.setAttribute("aria-label", "Uporabi pomoč za razkritje ene črke");
  }

  if (button.textContent !== "💡 Pomoč") {
    button.textContent = "💡 Pomoč";
  }
}

function updateWordDisplayElement(element, state, context, wordMarkup) {
  const slots = [...element.querySelectorAll(".letter-slot")];
  const answerLetters = [...state.round.answer].filter((letter) => letter !== " ");

  if (slots.length !== answerLetters.length) {
    if (element.innerHTML !== wordMarkup) {
      element.innerHTML = wordMarkup;
    }
    return;
  }

  let hitIndex = 0;
  let slotIndex = 0;

  slots.forEach((slot, index) => {
    const letter = answerLetters[index];
    const isVisible = context.revealAll || state.round.revealedLetters.has(letter);
    const isClue = isVisible && letter === state.run.currentLetter;
    const isHit = isVisible && context.highlightedLetter && letter === context.highlightedLetter;
    const isHintHit = isHit && context.highlightedKind === "hint";
    const className = `letter-slot${isVisible ? " revealed" : ""}${isClue ? " clue" : ""}${isHit ? " hit" : ""}${isHintHit ? " hint-hit" : ""}`;

    if (slot.className !== className) {
      slot.className = className;
    }

    const slotOrder = String(slotIndex++);
    if (slot.style.getPropertyValue("--slot-order") !== slotOrder) {
      slot.style.setProperty("--slot-order", slotOrder);
    }

    if (isHit) {
      const stagger = `${hitIndex++ * 70}ms`;
      if (slot.style.getPropertyValue("--slot-stagger") !== stagger) {
        slot.style.setProperty("--slot-stagger", stagger);
      }
    } else if (slot.style.getPropertyValue("--slot-stagger")) {
      slot.style.removeProperty("--slot-stagger");
    }

    if (slot.dataset.letter !== letter) {
      slot.dataset.letter = letter;
    }

    const desiredText = isVisible ? letter : "";
    const firstNode = slot.firstChild;
    if (firstNode?.nodeType === Node.TEXT_NODE) {
      if (firstNode.textContent !== desiredText) {
        firstNode.textContent = desiredText;
      }
    } else if (desiredText) {
      slot.prepend(document.createTextNode(desiredText));
    }

    const spark = slot.querySelector(".slot-spark");
    if (isHit && !spark) {
      const sparkElement = document.createElement("span");
      sparkElement.className = "slot-spark";
      sparkElement.setAttribute("aria-hidden", "true");
      slot.append(sparkElement);
    } else if (!isHit && spark) {
      spark.remove();
    }

    if (!isVisible && slot.firstChild?.nodeType === Node.TEXT_NODE && slot.firstChild.textContent) {
      slot.firstChild.textContent = "";
    }
  });
}

function updateNodeText(root, selector, text) {
  root.querySelectorAll(selector).forEach((element) => {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  });
}

function updateHeartsContainers(root, state) {
  const heartsMarkup = renderHearts(state.run.lives, state.effects.pulseLife, state.round.status);
  root.querySelectorAll(".mobile-hud-hearts, .lives-row").forEach((element) => {
    if (element.innerHTML !== heartsMarkup) {
      element.innerHTML = heartsMarkup;
    }
  });
}

function updateHud(root, state, context) {
  updateHeartsContainers(root, state);
  root.querySelectorAll(".mobile-hud-points").forEach((element) => {
    const nextMarkup = `<span aria-hidden="true">⭐</span> ${context.visibleTotalPoints} točk`;
    if (element.innerHTML !== nextMarkup) {
      element.innerHTML = nextMarkup;
    }
  });
  updateNodeText(root, ".points-card .hud-value", String(context.visibleTotalPoints));
  updateNodeText(root, ".level-card .hud-value", String(context.levelInfo.currentLevel));

  const progressMeta = root.querySelectorAll(".progress-bar-meta");
  progressMeta.forEach((meta) => {
    const spans = meta.querySelectorAll("span");
    if (spans[0]) {
      spans[0].textContent = `${context.levelInfo.progressValue} / ${context.levelInfo.progressMax}`;
    }
    if (spans[1]) {
      spans[1].textContent = context.levelInfo.nextLevel
        ? `Stopnja ${context.levelInfo.nextLevel}`
        : "Najvišja stopnja";
    }
  });

  root.querySelectorAll(".progress-bar-fill").forEach((element) => {
    const width = `${context.levelInfo.progressPercent}%`;
    if (element.style.width !== width) {
      element.style.width = width;
    }
  });

  const runValues = root.querySelectorAll(".run-mini strong");
  if (runValues[0]) {
    runValues[0].textContent = String(state.run.runPoints);
  }
  if (runValues[1]) {
    runValues[1].textContent = String(state.run.completedLettersCount);
  }
  if (runValues[2]) {
    runValues[2].textContent = String(state.profile.bestRunPoints);
  }
}

function updateWordBoards(root, state, context) {
  const wordMarkup = renderWord(
    state.round.answer,
    state.round.revealedLetters,
    context.revealAll,
    state.run.currentLetter,
    context.highlightedLetter,
    context.highlightedKind
  );

  const mobileBoard = root.querySelector(".mobile-word-board");
  if (mobileBoard) {
    mobileBoard.className = `word-board mobile-word-board${context.isSolvedReveal ? " word-board-solved" : ""}${context.isFailedReveal ? " word-board-revealed" : ""}`;
  }

  const desktopBoard = root.querySelector(".word-board-focused");
  if (desktopBoard) {
    desktopBoard.className = `word-board word-board-focused${context.isSolvedReveal ? " word-board-solved" : ""}${context.isFailedReveal ? " word-board-revealed" : ""}`;
  }

  root.querySelectorAll(".word-display").forEach((element) => {
    element.className = `word-display${context.isFailedReveal ? " word-display-revealed" : ""}`;
    updateWordDisplayElement(element, state, context, wordMarkup);
  });
}

function updateHintButtons(root, state) {
  const mobileFooter = root.querySelector(".mobile-word-footer");
  if (mobileFooter) {
    const helper = mobileFooter.querySelector(".mobile-word-helper");
    const helperText = `Preostale napake: ${state.round.maxWrongGuesses}`;
    if (helper && helper.textContent !== helperText) {
      helper.textContent = helperText;
    }
    updateHintButtonElement(mobileFooter.querySelector(".hint-button"), state, true);
  }

  const desktopTools = root.querySelector(".word-tools");
  if (desktopTools) {
    updateHintButtonElement(desktopTools.querySelector(".hint-button"), state, false);
  }
}

function updateKeyboardButtons(root, state) {
  root.querySelectorAll("[data-key]").forEach((button) => {
    const letter = button.dataset.key;
    const isCorrect = state.round.revealedLetters.has(letter);
    const isWrong = state.round.wrongLetters.has(letter);
    const isClue = letter === state.run.currentLetter && isCorrect;
    const isUsed = isCorrect || isWrong;
    const className = [
      "key-button",
      isCorrect ? "correct" : "",
      state.effects.correctLetter === letter ? "correct-hit" : "",
      isWrong ? "wrong" : "",
      isClue ? "clue" : "",
      isUsed ? "locked" : "",
      state.effects.wrongLetter === letter ? "shake" : ""
    ]
      .filter(Boolean)
      .join(" ");

    if (button.className !== className) {
      button.className = className;
    }

    const disabled = state.round.status !== "playing" || isUsed;
    if (button.disabled !== disabled) {
      button.disabled = disabled;
    }
  });
}

function updateDrawingPanels(root, state) {
  root.querySelectorAll(".scene-part").forEach((stageElement) => {
    const stageNumber = Number(stageElement.dataset.stage || 0);
    const visible = state.round.wrongGuessCount >= stageNumber;
    const newest = state.effects.bumpStage && state.round.wrongGuessCount === stageNumber;
    const baseClasses = stageElement.getAttribute("class").split(" ").filter((className) => {
      return className !== "visible" && className !== "stage-new";
    });
    if (visible) {
      baseClasses.push("visible");
    }
    if (newest) {
      baseClasses.push("stage-new");
    }
    const nextClassName = baseClasses.join(" ");
    if (stageElement.getAttribute("class") !== nextClassName) {
      stageElement.setAttribute("class", nextClassName);
    }
  });

  root.querySelectorAll(".stage-placeholder").forEach((element) => {
    element.style.display = state.round.wrongGuessCount === 0 ? "" : "none";
  });

  root.querySelectorAll(".mistake-pill").forEach((element) => {
    element.className = `mistake-pill${state.effects.pulseMistakes ? " pulse" : ""}`;
    element.innerHTML = `Napake: <strong>${state.round.wrongGuessCount} / ${state.round.maxWrongGuesses}</strong>`;
  });

  root.querySelectorAll(".svg-frame").forEach((element) => {
    const classParts = element.className.split(" ").filter((className) => className !== "bump");
    if (state.effects.bumpStage) {
      classParts.push("bump");
    }
    element.className = classParts.join(" ");
  });
}

function updateResultPanels(root, state, autoAdvance) {
  const content = getResultActionContent(state, autoAdvance);
  root.querySelectorAll(".result-action-panel").forEach((panel) => {
    const compact = panel.classList.contains("result-action-panel-compact");
    const nextClassName = `${content.className}${compact ? " result-action-panel-compact" : ""}`;
    if (panel.className !== nextClassName) {
      panel.className = nextClassName;
    }

    const headline = panel.querySelector("[data-result-headline]");
    if (headline && headline.textContent !== content.headline) {
      headline.textContent = content.headline;
    }

    const details = panel.querySelector("[data-result-details]");
    if (details) {
      details.hidden = !content.details;
      details.setAttribute("aria-hidden", content.details ? "false" : "true");
      if (details.textContent !== content.details) {
        details.textContent = content.details;
      }
    }

    const countdown = panel.querySelector("[data-auto-advance-countdown]");
    if (countdown) {
      countdown.hidden = !content.showButton;
      countdown.setAttribute("aria-hidden", content.showButton ? "false" : "true");
      if (countdown.textContent !== content.countdown) {
        countdown.textContent = content.countdown;
      }
    }

    const button = panel.querySelector("[data-action=\"advance\"]");
    if (button) {
      const buttonClassName = `primary-button result-action-button${content.showButton ? "" : " result-action-button-hidden"}`;
      if (button.className !== buttonClassName) {
        button.className = buttonClassName;
      }
      if (content.showButton) {
        button.removeAttribute("tabindex");
        button.setAttribute("aria-hidden", "false");
      } else {
        button.setAttribute("tabindex", "-1");
        button.setAttribute("aria-hidden", "true");
      }
    }
  });
}

function updateDesktopCategoryProgress(root, context) {
  root.querySelectorAll(".desktop-layout .category-progress-strip").forEach((element) => {
    if (element.innerHTML !== context.categoryProgress) {
      element.innerHTML = context.categoryProgress;
    }
  });
}

export function renderApp(root, state, alphabet, options = {}) {
  const { isIntroOpen = false, isFirstVisit = false, categoryTransition = null, autoAdvance = null } = options;
  preloadCategoryImages();
  const context = getRenderContext(state, autoAdvance);
  const transitionPhase = categoryTransition?.phase || "";
  const shellTransitionClass = transitionPhase ? ` category-transition-${transitionPhase}` : "";

  root.innerHTML = `
    <div class="shell-glow"></div>
    <main class="game-shell${shellTransitionClass}">
      ${renderAmbientSparks()}

      <section class="mobile-layout">
        <header class="mobile-hud" aria-label="Statistika igre">
          <div class="mobile-hud-hearts" aria-label="Življenja">
            ${renderHearts(state.run.lives, state.effects.pulseLife, state.round.status)}
          </div>
          <div class="mobile-hud-points"><span aria-hidden="true">⭐</span> ${context.visibleTotalPoints} točk</div>
          ${renderRulesButton(true)}
        </header>

        <section class="mobile-main-play">
          ${renderMobileCategorySpotlight(state, context.currentCategory, context.progressCurrent, context.progressTotal)}

          <section class="word-board mobile-word-board${context.isSolvedReveal ? " word-board-solved" : ""}${context.isFailedReveal ? " word-board-revealed" : ""}" aria-live="polite" aria-label="Skrita beseda">
            <div class="word-display${context.isFailedReveal ? " word-display-revealed" : ""}">
              ${renderWord(state.round.answer, state.round.revealedLetters, context.revealAll, state.run.currentLetter, context.highlightedLetter, context.highlightedKind)}
            </div>
            <div class="mobile-word-footer">
              <p class="mobile-word-helper">${state.round.maxWrongGuesses} napak v tej besedi</p>
              ${renderHintButton(state, true)}
            </div>
          </section>

          <section class="mobile-drawing-panel">
            ${renderDrawingCard(state, context.currentCategory.id, true, categoryTransition)}
          </section>
        </section>

        <section class="mobile-control-zone">
          <section class="keyboard-card mobile-keyboard-card">
            <div class="mobile-keyboard-grid" role="group" aria-label="Tipkovnica">
              ${context.mobileKeyboard}
            </div>
          </section>

          ${renderResultActionPanel(state, autoAdvance, true)}
        </section>
      </section>

      <section class="desktop-layout">
        <header class="hero-header">
          <section class="hud-unified">
            <section class="brand-card">
              <div class="brand-copy">
                <h1 class="brand-title">Vislice na črko</h1>
                <p class="brand-subtitle">Preživi niz kategorij, lovi bonus za popolno črko in zgradi čim višjo stopnjo.</p>
              </div>
            </section>

            <section class="hud-grid" aria-label="Statistika igre">
              <article class="hud-card level-card">
                <span class="hud-label">Stopnja</span>
                <div class="hud-main">
                  <strong class="hud-value">${context.levelInfo.currentLevel}</strong>
                  <span class="hud-icon" aria-hidden="true">⭐</span>
                </div>
              </article>

              <article class="hud-card points-card">
                <span class="hud-label">Skupne točke</span>
                <div class="hud-main">
                  <strong class="hud-value">${context.visibleTotalPoints}</strong>
                  <span class="hud-icon" aria-hidden="true">🏆</span>
                </div>
              </article>

              <article class="hud-card">
                <span class="hud-label">Napredek do naslednje stopnje</span>
                <div class="progress-bar-shell" aria-hidden="true">
                  <div class="progress-bar-fill" style="width: ${context.levelInfo.progressPercent}%"></div>
                </div>
                <div class="progress-bar-meta">
                  <span>${context.levelInfo.progressValue} / ${context.levelInfo.progressMax}</span>
                  <span>${context.levelInfo.nextLevel ? `Stopnja ${context.levelInfo.nextLevel}` : "Najvišja stopnja"}</span>
                </div>
              </article>

              <article class="hud-card">
                <span class="hud-label">Življenja</span>
                <div class="lives-row" aria-label="Preostala življenja">
                  ${renderHearts(state.run.lives, state.effects.pulseLife, state.round.status)}
                </div>
              </article>

              <article class="hud-card hud-card-compact">
                <span class="hud-label">Tek</span>
                <div class="run-mini-grid">
                  <div class="run-mini">
                    <span class="hud-label">Ta igra</span>
                    <strong>${state.run.runPoints}</strong>
                  </div>
                  <div class="run-mini">
                    <span class="hud-label">Črke</span>
                    <strong>${state.run.completedLettersCount}</strong>
                  </div>
                  <div class="run-mini">
                    <span class="hud-label">Rekord</span>
                    <strong>${state.profile.bestRunPoints}</strong>
                  </div>
                </div>
              </article>
            </section>

            <div class="hud-rules">
              ${renderRulesButton()}
            </div>
          </section>
        </header>

        <section class="main-grid">
          <div class="left-stack">
            <section class="game-panel">
              ${renderDrawingCard(state, context.currentCategory.id, false, categoryTransition)}
            </section>
          </div>

          <div class="right-stack">
            <section class="game-panel">
              ${renderDesktopCategorySpotlight(state, context.currentCategory, context.progressCurrent, context.progressTotal)}

              <div class="word-board word-board-focused ${getWordLengthClass(state.round.answer)}${context.isSolvedReveal ? " word-board-solved" : ""}${context.isFailedReveal ? " word-board-revealed" : ""}" aria-live="polite" aria-label="Skrita beseda">
                <div class="word-tools">
                  <span class="word-tools-spacer" aria-hidden="true"></span>
                  ${renderHintButton(state)}
                </div>
                <div class="word-display${context.isFailedReveal ? " word-display-revealed" : ""}">
                  ${renderWord(state.round.answer, state.round.revealedLetters, context.revealAll, state.run.currentLetter, context.highlightedLetter, context.highlightedKind)}
                </div>
              </div>

              <div class="keyboard-card">
                <span class="panel-label">Slovenska tipkovnica</span>
                <div class="keyboard-grid" role="group" aria-label="Tipkovnica">
                  ${context.keyboard}
                </div>
              </div>

              ${renderResultActionPanel(state, autoAdvance, false)}
            </section>
          </div>
        </section>
      </section>

      ${renderOverlay(state)}
      ${isIntroOpen ? renderIntroOverlay(isFirstVisit) : ""}
    </main>
  `;
}

export function updateAppInPlace(root, state, options = {}) {
  const { autoAdvance = null } = options;
  const context = getRenderContext(state, autoAdvance);

  updateHud(root, state, context);
  updateWordBoards(root, state, context);
  updateHintButtons(root, state);
  updateKeyboardButtons(root, state);
  updateDrawingPanels(root, state);
  updateResultPanels(root, state, autoAdvance);
  updateDesktopCategoryProgress(root, context);
}
