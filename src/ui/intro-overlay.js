const INTRO_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

const FIREFLY_COUNT = 14;

function renderRuleItem(icon, title, items) {
  return `
    <article class="intro-rule-card">
      <div class="intro-rule-head">
        <span class="intro-rule-icon" aria-hidden="true">${icon}</span>
        <h3 class="intro-rule-title">${title}</h3>
      </div>
      <ul class="intro-rule-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderFireflies() {
  return Array.from({ length: FIREFLY_COUNT }, (_, index) => {
    return `<span class="intro-firefly intro-firefly-${index + 1}" aria-hidden="true"></span>`;
  }).join("");
}

export function renderIntroOverlay(isFirstVisit) {
  return `
    <div
      class="overlay intro-overlay"
      data-intro-overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-describedby="intro-subtitle"
    >
      <div class="intro-forest-scene" aria-hidden="true">
        <span class="intro-heart intro-heart-1">♥</span>
        <span class="intro-heart intro-heart-2">♥</span>
        <span class="intro-heart intro-heart-3">♥</span>
        <span class="intro-heart intro-heart-4">♥</span>
        <span class="intro-heart intro-heart-5">♥</span>
        ${renderFireflies()}
      </div>

      <section class="overlay-card intro-card">
        <button
          class="intro-close-button"
          type="button"
          data-action="dismiss-intro"
          aria-label="Zapri pravila"
        >
          ×
        </button>

        <header class="intro-header">
          <h2 class="overlay-title intro-title" id="intro-title">
            <span>Vislice</span>
            <span>Na črko</span>
          </h2>
          <p class="overlay-text intro-subtitle" id="intro-subtitle">
            Ugibaj besede po kategorijah in preživi čim dlje.
          </p>
        </header>

        <div class="intro-sections">
          ${renderRuleItem("📖", "Kako igraš?", [
            "Dobiš črko in kategorijo.",
            "Beseda se začne na prikazano črko.",
            "Ugibaj črke s tipkovnico.",
            "Če uganeš besedo, greš na naslednjo kategorijo.",
            "Ko zaključiš vse kategorije pri isti črki, dobiš novo črko."
          ])}
          ${renderRuleItem("❤️", "Življenja in napake", [
            "Začneš s 5 življenji.",
            "Vsaka beseda ima omejeno število napak.",
            "Če besede ne rešiš, izgubiš 1 življenje.",
            "Ko zaključiš celo črko, dobiš +1 življenje, največ do 5."
          ])}
          ${renderRuleItem("🏆", "Točke", [
            "Rešena beseda: +100 točk.",
            "Manj napak pomeni več bonus točk.",
            "Zaključena črka: +250 točk.",
            "Popolna črka prinese dodaten bonus."
          ])}
        </div>

        <div class="intro-actions">
          <button
            class="primary-button intro-primary-button"
            type="button"
            data-action="accept-intro"
            data-intro-primary
          >
            Začni igrati
          </button>
          <button class="intro-secondary-link" type="button" data-action="dismiss-intro">
            ${isFirstVisit ? "Prikaži pravila kasneje" : "Zapri pravila"}
          </button>
        </div>
      </section>
    </div>
  `;
}

export function getIntroFocusableElements(container) {
  if (!container) {
    return [];
  }

  return [...container.querySelectorAll(INTRO_FOCUSABLE_SELECTOR)].filter((element) => {
    return !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true";
  });
}
