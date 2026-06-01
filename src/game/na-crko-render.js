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

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Š", "Ž"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Č"],
  ["Y", "X", "C", "V", "B", "N", "M"]
];

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
          return `<span class="letter-slot${isVisible ? " revealed" : ""}${isClue ? " clue" : ""}${isHit ? " hit" : ""}${isHintHit ? " hint-hit" : ""}"${style}>${isVisible ? `${escapeHtml(letter)}${isHit ? '<span class="slot-spark" aria-hidden="true"></span>' : ""}` : ""}</span>`;
        })
        .join("");

      return `<div class="word-row">${slots}</div>`;
    })
    .join('<div class="space-slot" aria-hidden="true"></div>');
}

function renderHintButton(state, compact = false) {
  const hiddenLetters = getHiddenLetters(state);
  const isPlaying = state.round.status === "playing";
  const isUsed = state.run.hintUsedForCurrentLetter || !state.run.hintAvailableForLetter;
  const isUnneeded = hiddenLetters.length === 0;
  const disabled = !isPlaying || isUsed || isUnneeded;
  const label = isUnneeded && !isUsed
    ? "💡 Pomoč ni več potrebna"
    : isUsed
      ? "💡 Pomoč uporabljena"
      : "💡 Pomoč 1x";

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

function getStatusContent(state) {
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

  if (state.round.status === "word-solved") {
    return {
      className: "status-banner success pulse",
      kicker: "PRAVILNO",
      title: `+${state.round.pointsAwardedLastStep} točk`,
      text: state.effects.hintRevealedLetter
        ? `Pomoč je razkrila črko: ${state.effects.hintRevealedLetter}`
        : "Beseda je rešena. Nadaljuj na naslednjo kategorijo."
    };
  }

  if (state.round.status === "word-failed") {
    return {
      className: "status-banner failure pulse",
      kicker: "NI USPELO",
      title: `Pravilna beseda: ${escapeHtml(state.round.answer)}`,
      text: "Izgubil si eno življenje. Nadaljuješ na naslednjo kategorijo."
    };
  }

  if (state.round.status === "letter-complete") {
    const perfectText = state.round.lastPerfectBonus ? ` + ${state.round.lastPerfectBonus} popolna črka` : "";
    return {
      className: "status-banner reward pulse",
      kicker: `Črka ${state.run.currentLetter} zaključena`,
      title: `+${state.round.lastLetterBonus}${perfectText}`,
      text: "Dobiš bonus, eno življenje nazaj in novo črko."
    };
  }

  return {
    className: "status-banner neutral",
    kicker: "Na potezi",
    title: "Ugibaj črke",
    text: `Pri tej besedi imaš ${state.round.maxWrongGuesses} napak.`
  };
}

function getMobileStatusText(state) {
  if (state.round.status === "playing" && state.effects.hintRevealedLetter) {
    return `Pomoč je razkrila črko: ${state.effects.hintRevealedLetter}`;
  }

  if (state.round.status === "playing" && state.effects.hintUnavailable) {
    return "Pomoč ni več potrebna.";
  }

  if (state.round.status === "playing" && state.effects.wrongLetter) {
    return `Ni te črke · ${state.effects.wrongLetter} ni v besedi`;
  }

  if (state.round.status === "word-solved") {
    return state.effects.hintRevealedLetter
      ? `Pomoč je razkrila črko: ${state.effects.hintRevealedLetter}`
      : `Pravilno · +${state.round.pointsAwardedLastStep} točk`;
  }

  if (state.round.status === "word-failed") {
    return `Ni uspelo · Pravilna beseda: ${state.round.answer}`;
  }

  if (state.round.status === "letter-complete") {
    const perfect = state.round.lastPerfectBonus ? ` · +${state.round.lastPerfectBonus}` : "";
    return `Črka zaključena · +${state.round.lastLetterBonus}${perfect}`;
  }

  return `Ugibaj črke · ${state.round.maxWrongGuesses} napak`;
}

function getActionContent(state) {
  if (state.round.status === "word-solved") {
    return {
      label: "Naslednja kategorija",
      hint: "Kategorija je zaključena. Poberi točke in nadaljuj."
    };
  }

  if (state.round.status === "word-failed") {
    return {
      label: "Naslednja kategorija",
      hint: "Beseda je razkrita. Premakni se naprej."
    };
  }

  if (state.round.status === "game-over") {
    return {
      label: "Nova igra",
      hint: "Tek je končan. Začni nov poskus."
    };
  }

  return {
    label: "Začni znova",
    hint: `Preostale napake v tej besedi: ${state.round.maxWrongGuesses - state.round.wrongGuessCount}.`
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
      <div class="drawing-top drawing-top-solo">
        <div class="mistake-pill${state.effects.pulseMistakes ? " pulse" : ""}">
          Napake: <strong>${state.round.wrongGuessCount} / ${state.round.maxWrongGuesses}</strong>
        </div>
      </div>
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
        ${
          state.round.wrongGuessCount === 0
            ? '<p class="stage-placeholder">Risba se začne ob prvi napaki.</p>'
            : ""
        }
      </div>
    </div>
  `;
}

function getCategoryAccentClass(categoryId) {
  return `category-accent-${categoryId || "predmet"}`;
}

function renderMobileCategorySpotlight(state, category, progressCurrent, progressTotal) {
  return `
    <section class="mobile-category-spotlight ${getCategoryAccentClass(category.id)}" aria-label="Trenutna kategorija">
      <div class="mobile-category-head">
        <div>
          <span class="panel-label">KATEGORIJA</span>
          <h2 class="mobile-category-name">${escapeHtml(category.label)}</h2>
        </div>
        <div class="mobile-category-icon" aria-hidden="true">${category.icon}</div>
      </div>
      <div class="mobile-category-meta">
        <span class="mobile-letter-chip">Črka ${state.run.currentLetter}</span>
        <span class="mobile-category-step">${progressCurrent} / ${progressTotal}</span>
      </div>
    </section>
  `;
}

function renderActionRow(state, action, compact = false, autoAdvance = null) {
  const isActivePlay = state.round.status === "playing";
  const isSolvedReward = state.round.status === "word-solved";
  return `
    <div class="action-row${compact ? " action-row-compact" : ""}${isActivePlay ? " action-row-active" : ""}${isSolvedReward ? " action-row-reward" : ""}">
      <p class="action-hint">${action.hint}</p>
      ${autoAdvance?.active ? `<p class="action-auto-hint">${autoAdvance.text}</p>` : ""}
      <button
        class="${isActivePlay ? "secondary-button restart-button" : "primary-button"}"
        type="button"
        data-action="${isActivePlay ? "restart" : "advance"}"
      >
        ${action.label}
      </button>
    </div>
  `;
}

function renderRulesPanel() {
  return `
    <details class="rules-panel">
      <summary>Točkovanje</summary>
      <div class="rules-panel-content">
        <div class="summary-grid">
          <div class="summary-item"><span>Rešena beseda</span><strong>+100 + bonus napak</strong></div>
          <div class="summary-item"><span>Črka zaključena</span><strong>+250</strong></div>
          <div class="summary-item"><span>Popolna črka</span><strong>+150</strong></div>
          <div class="summary-item"><span>Življenje po črki</span><strong>+1 do največ 5</strong></div>
        </div>
      </div>
    </details>
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
      <span aria-hidden="true">?</span>
      <span class="help-button-label">Pravila</span>
    </button>
  `;
}

function renderOverlay(state) {
  if (state.round.status !== "letter-complete" && state.round.status !== "game-over") {
    return "";
  }

  if (state.round.status === "letter-complete") {
    const pointsGained = state.round.lastLetterBonus + state.round.lastPerfectBonus;

    return `
      <div class="overlay reward-overlay" role="dialog" aria-modal="true" aria-labelledby="letter-complete-title" aria-describedby="letter-complete-text" data-letter-complete-dialog>
        <section class="overlay-card reward-modal">
          <span class="reward-modal-spark" aria-hidden="true">★</span>
          <h2 class="overlay-title reward-modal-title" id="letter-complete-title">Bravo!</h2>
          <p class="overlay-text reward-modal-text" id="letter-complete-text">Črka ${state.run.currentLetter} je zaključena.</p>
          <p class="reward-modal-secondary">Nova črka te čaka.</p>
          <div class="reward-modal-bonuses">
            ${state.round.lastLifeGained ? '<span class="reward-chip">+1 življenje</span>' : ""}
            ${pointsGained ? `<span class="reward-chip">+${pointsGained} točk</span>` : ""}
          </div>
          <button class="primary-button reward-modal-button" type="button" data-action="advance">Naprej</button>
        </section>
      </div>
    `;
  }

  const summary = state.round.finalSummary;

  return `
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <section class="overlay-card">
        <span class="overlay-kicker">Konec igre</span>
        <h2 class="overlay-title" id="overlay-title">Tek je končan</h2>
        <p class="overlay-text">
          Življenja so pošla. Rezultat se je shranil v dolgoročne statistike.
          ${summary.beatBestRun || summary.beatBestLetters ? " Dosežen je nov osebni rekord." : ""}
        </p>
        <div class="overlay-bonuses">
          <div class="bonus-pill"><span>Točke v tem teku</span><strong>${summary.runPoints}</strong></div>
          <div class="bonus-pill"><span>Zaključene črke</span><strong>${summary.completedLetters}</strong></div>
          <div class="bonus-pill"><span>Najboljši tek</span><strong>${state.profile.bestRunPoints}</strong></div>
          <div class="bonus-pill"><span>Največ črk</span><strong>${state.profile.bestCompletedLetters}</strong></div>
        </div>
        <button class="primary-button" type="button" data-action="advance">Nova igra</button>
      </section>
    </div>
  `;
}

export function renderApp(root, state, alphabet, options = {}) {
  const { isIntroOpen = false, isFirstVisit = false, categoryTransition = null, autoAdvance = null } = options;
  const visibleTotalPoints = state.profile.totalPoints + state.run.runPoints;
  const levelInfo = getLevelInfo(visibleTotalPoints);
  const currentCategory = getCurrentCategory(state);
  const status = getStatusContent(state);
  const mobileStatusText = getMobileStatusText(state);
  const action = getActionContent(state);
  const revealAll = state.round.status !== "playing" && state.round.status !== "word-solved";
  const isSolvedReveal = state.round.status === "word-solved";
  const isFailedReveal = state.round.status === "word-failed";
  const progressCurrent = state.run.currentCategoryIndex + 1;
  const progressTotal = state.run.selectedCategoryIds.length || state.run.categoryCountForLetter;
  const keyboard = renderKeyboard(state);
  const mobileKeyboard = renderMobileKeyboard(state);
  const categoryProgress = renderCategoryProgress(state);
  const transitionPhase = categoryTransition?.phase || "";
  const shellTransitionClass = transitionPhase ? ` category-transition-${transitionPhase}` : "";
  const highlightedLetter = state.effects.correctLetter || state.effects.hintRevealedLetter;
  const highlightedKind = state.effects.hintRevealedLetter ? "hint" : "correct";

  root.innerHTML = `
    <div class="shell-glow"></div>
    <main class="game-shell${shellTransitionClass}">
      ${renderAmbientSparks()}

      <section class="mobile-layout">
        <header class="mobile-hud" aria-label="Statistika igre">
          <div class="mobile-hud-hearts" aria-label="Življenja">
            ${renderHearts(state.run.lives, state.effects.pulseLife, state.round.status)}
          </div>
          <div class="mobile-hud-challenge">${escapeHtml(currentCategory.label)} · ${progressCurrent}/${progressTotal}</div>
          <div class="mobile-hud-points">${visibleTotalPoints} točk</div>
          ${renderRulesButton(true)}
        </header>

        <section class="mobile-main-play">
          ${renderMobileCategorySpotlight(state, currentCategory, progressCurrent, progressTotal)}

          <section class="word-board mobile-word-board${isSolvedReveal ? " word-board-solved" : ""}" aria-live="polite" aria-label="Skrita beseda">
            <div class="word-tools">
              ${renderHintButton(state, true)}
            </div>
            <div class="word-display${isFailedReveal ? " word-display-revealed" : ""}">
              ${renderWord(state.round.answer, state.round.revealedLetters, revealAll, state.run.currentLetter, highlightedLetter, highlightedKind)}
            </div>
          </section>

          <div class="${status.className} mobile-status-banner">
            <p class="mobile-status-copy">${mobileStatusText}</p>
          </div>

          <section class="mobile-drawing-panel">
            ${renderDrawingCard(state, currentCategory.id, true, categoryTransition)}
          </section>
        </section>

        <section class="mobile-control-zone">
          <section class="keyboard-card mobile-keyboard-card">
            <div class="mobile-keyboard-grid" role="group" aria-label="Tipkovnica">
              ${mobileKeyboard}
            </div>
          </section>

          ${state.round.status !== "letter-complete" ? renderActionRow(state, action, true, autoAdvance) : ""}
        </section>

        <section class="mobile-lower-meta">
          <section class="summary-card mobile-progress-card">
            <span class="summary-label">Kategorije</span>
            <div class="category-progress-strip" aria-label="Kategorije v trenutni črki">
              ${categoryProgress}
            </div>
          </section>

          ${renderRulesPanel()}
        </section>
      </section>

      <section class="desktop-layout">
        <header class="hero-header">
          <section class="brand-card">
            <div class="brand-head">
              <div class="brand-copy">
                <h1 class="brand-title">Vislice Na črko</h1>
                <p class="brand-subtitle">Preživi niz kategorij, lovi bonus za popolno črko in zgradi čim višjo stopnjo.</p>
              </div>
              ${renderRulesButton()}
            </div>
          </section>

          <section class="hud-grid" aria-label="Statistika igre">
            <article class="hud-card level-card">
              <span class="hud-label">Stopnja</span>
              <div class="hud-main">
                <strong class="hud-value">${levelInfo.currentLevel}</strong>
                <span class="hud-icon" aria-hidden="true">⭐</span>
              </div>
            </article>

            <article class="hud-card points-card">
              <span class="hud-label">Skupne točke</span>
              <div class="hud-main">
                <strong class="hud-value">${visibleTotalPoints}</strong>
                <span class="hud-icon" aria-hidden="true">🏆</span>
              </div>
            </article>

            <article class="hud-card">
              <span class="hud-label">Napredek do naslednje stopnje</span>
              <div class="progress-bar-shell" aria-hidden="true">
                <div class="progress-bar-fill" style="width: ${levelInfo.progressPercent}%"></div>
              </div>
              <div class="progress-bar-meta">
                <span>${levelInfo.progressValue} / ${levelInfo.progressMax}</span>
                <span>${levelInfo.nextLevel ? `Stopnja ${levelInfo.nextLevel}` : "Najvišja stopnja"}</span>
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
        </header>

        <section class="main-grid">
          <div class="left-stack">
            <section class="game-panel">
              ${renderDrawingCard(state, currentCategory.id, false, categoryTransition)}
            </section>

            <section class="summary-card">
              <span class="summary-label">Kategorije</span>
              <div class="category-progress-strip" aria-label="Kategorije v trenutni črki">
                ${categoryProgress}
              </div>
            </section>
          </div>

          <div class="right-stack">
            <section class="game-panel">
              <div class="letter-card">
                ${renderAmbientSparks("letter-fireflies")}
                <span class="panel-label">Črka</span>
                <div class="current-letter">${state.run.currentLetter}</div>
              </div>

              <div class="category-card ${getCategoryAccentClass(currentCategory.id)}">
                <div class="category-header">
                  <div>
                    <span class="panel-label">KATEGORIJA</span>
                    <h2 class="category-name">${escapeHtml(currentCategory.label)}</h2>
                  </div>
                  <div class="category-icon" aria-hidden="true">${currentCategory.icon}</div>
                </div>
                <div class="category-step">${progressCurrent} / ${progressTotal}</div>
              </div>

              <div class="word-board word-board-focused${isSolvedReveal ? " word-board-solved" : ""}${isFailedReveal ? " word-board-revealed" : ""}" aria-live="polite" aria-label="Skrita beseda">
                <div class="word-tools">
                  ${renderHintButton(state)}
                </div>
                <div class="word-display${isFailedReveal ? " word-display-revealed" : ""}">
                  ${renderWord(state.round.answer, state.round.revealedLetters, revealAll, state.run.currentLetter, highlightedLetter, highlightedKind)}
                </div>
              </div>

              <div class="${status.className}">
                <span class="status-kicker">${status.kicker}</span>
                <h3 class="status-title">${status.title}</h3>
                <p class="status-text">${status.text}</p>
              </div>

              <div class="keyboard-card">
                <span class="panel-label">Slovenska tipkovnica</span>
                <div class="keyboard-grid" role="group" aria-label="Tipkovnica">
                  ${keyboard}
                </div>
              </div>

              ${state.round.status !== "letter-complete" ? renderActionRow(state, action, false, autoAdvance) : ""}
            </section>

            <section class="progress-card progress-card-collapsible">
              ${renderRulesPanel()}
            </section>
          </div>
        </section>
      </section>

      ${renderOverlay(state)}
      ${isIntroOpen ? renderIntroOverlay(isFirstVisit) : ""}
    </main>
  `;
}
