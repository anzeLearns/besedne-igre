const SCENE_PRESETS = {
  mobile: {
    viewBox: "0 0 520 320",
    gallowsTransform: "translate(8 6) scale(0.94)"
  },
  desktop: {
    viewBox: "55 -14 400 361",
    gallowsTransform: "translate(8 -80) scale(1.04 1.34)"
  }
};

function getStageDefinitions(maxWrongGuesses) {
  if (maxWrongGuesses === 6) {
    return [
      { id: "stage-1", parts: ["base"] },
      { id: "stage-2", parts: ["pole", "beam", "support"] },
      { id: "stage-3", parts: ["rope"] },
      { id: "stage-4", parts: ["head"] },
      { id: "stage-5", parts: ["torso", "arms"] },
      { id: "stage-6", parts: ["legs", "face"] }
    ];
  }

  if (maxWrongGuesses === 5) {
    return [
      { id: "stage-1", parts: ["base"] },
      { id: "stage-2", parts: ["pole", "beam", "support"] },
      { id: "stage-3", parts: ["rope", "head"] },
      { id: "stage-4", parts: ["torso", "arms"] },
      { id: "stage-5", parts: ["legs", "face"] }
    ];
  }

  return [
    { id: "stage-1", parts: ["base", "pole"] },
    { id: "stage-2", parts: ["beam", "support", "rope"] },
    { id: "stage-3", parts: ["head", "torso"] },
    { id: "stage-4", parts: ["arms", "legs", "face"] }
  ];
}

function renderFigureLine(path, className = "") {
  return `
    <path class="hangman-figure-outline ${className}" d="${path}"></path>
    <path class="hangman-figure-line ${className}" d="${path}"></path>
  `;
}

function renderPart(partName) {
  switch (partName) {
    case "base":
      return `
        <g class="hangman-part hangman-base">
          <path class="hangman-wood-outline" d="M92 312 H232"></path>
          <path class="hangman-wood-main" d="M92 312 H232"></path>
          <path class="hangman-wood-highlight" d="M106 305 H218"></path>
          <rect class="hangman-wood-block" x="137" y="273" width="48" height="31" rx="8"></rect>
          <path class="hangman-grass" d="M116 308 C116 295 110 290 106 285 M120 308 C120 291 126 285 132 280 M124 308 C126 298 134 296 142 294"></path>
        </g>
      `;
    case "pole":
      return `
        <g class="hangman-part hangman-pole">
          <rect class="hangman-wood-block" x="145" y="62" width="38" height="242" rx="10"></rect>
          <path class="hangman-wood-highlight" d="M158 76 V289"></path>
          <path class="hangman-wood-grain" d="M172 88 C162 118 176 144 166 174 C158 202 174 228 166 266"></path>
          <circle class="hangman-bolt" cx="164" cy="112" r="5"></circle>
          <circle class="hangman-bolt" cx="164" cy="246" r="5"></circle>
        </g>
      `;
    case "beam":
      return `
        <g class="hangman-part hangman-beam">
          <rect class="hangman-wood-block" x="154" y="58" width="220" height="38" rx="12"></rect>
          <path class="hangman-wood-highlight" d="M170 72 H358"></path>
          <path class="hangman-wood-grain" d="M198 84 C232 73 266 84 300 76 C324 70 342 80 358 76"></path>
          <circle class="hangman-bolt" cx="178" cy="77" r="5"></circle>
        </g>
      `;
    case "support":
      return `
        <g class="hangman-part hangman-support">
          <path class="hangman-wood-outline" d="M177 178 L266 88"></path>
          <path class="hangman-wood-main" d="M177 178 L266 88"></path>
          <path class="hangman-wood-highlight" d="M184 166 L255 94"></path>
        </g>
      `;
    case "rope":
      return `
        <g class="hangman-part hangman-rope">
          <path class="hangman-rope-outline" d="M342 92 V142"></path>
          <path class="hangman-rope-main" d="M342 92 V142"></path>
          <path class="hangman-rope-twist" d="M337 100 L347 108 M337 114 L347 122 M337 128 L347 136"></path>
          <circle class="hangman-rope-knot" cx="342" cy="143" r="8"></circle>
          <g class="hangman-rope-sparkles">
            <path d="M376 116 V130 M369 123 H383"></path>
            <path d="M311 132 V140 M307 136 H315"></path>
          </g>
        </g>
      `;
    case "head":
      return `
        <g class="hangman-part hangman-head">
          <path class="hangman-neck-outline" d="M342 143 V150"></path>
          <path class="hangman-neck" d="M342 143 V150"></path>
          <circle class="hangman-head-outline" cx="342" cy="177" r="31"></circle>
          <circle class="hangman-head-fill" cx="342" cy="177" r="27"></circle>
          <circle class="hangman-cheek" cx="324" cy="187" r="4"></circle>
          <circle class="hangman-cheek" cx="360" cy="187" r="4"></circle>
          <g class="hangman-neutral-face">
            <circle cx="332" cy="173" r="3.2"></circle>
            <circle cx="352" cy="173" r="3.2"></circle>
            <path d="M333 188 Q342 194 351 188"></path>
          </g>
        </g>
      `;
    case "torso":
      return `
        <g class="hangman-part hangman-torso">
          ${renderFigureLine("M342 207 V265")}
        </g>
      `;
    case "arms":
      return `
        <g class="hangman-part hangman-arms">
          ${renderFigureLine("M342 222 L309 250", "hangman-arm-left")}
          ${renderFigureLine("M342 222 L375 250", "hangman-arm-right")}
        </g>
      `;
    case "legs":
      return `
        <g class="hangman-part hangman-legs">
          ${renderFigureLine("M342 265 L316 308", "hangman-leg-left")}
          ${renderFigureLine("M342 265 L368 308", "hangman-leg-right")}
        </g>
      `;
    case "face":
      return `
        <g class="hangman-part hangman-final-face">
          <circle class="hangman-face-reset" cx="342" cy="177" r="23"></circle>
          <path d="M329 168 L336 175 M336 168 L329 175"></path>
          <path d="M348 168 L355 175 M355 168 L348 175"></path>
          <path d="M331 191 Q342 183 353 191"></path>
          <path class="hangman-motion-line" d="M389 164 Q399 169 400 181"></path>
          <path class="hangman-motion-line" d="M394 151 Q408 158 410 171"></path>
          <path class="hangman-motion-line" d="M296 292 Q286 301 292 311"></path>
          <path class="hangman-motion-line" d="M289 286 Q275 297 282 315"></path>
        </g>
      `;
    default:
      return "";
  }
}

export function renderHangmanScene(wrongGuessCount, maxWrongGuesses, animateNewestStage = false, mode = "desktop") {
  const scene = SCENE_PRESETS[mode] || SCENE_PRESETS.desktop;
  const stages = getStageDefinitions(maxWrongGuesses);

  const stageMarkup = stages
    .map((stage, index) => {
      const stageNumber = index + 1;
      const isVisible = wrongGuessCount >= stageNumber;
      const isNewest = animateNewestStage && wrongGuessCount === stageNumber;
      const className = `scene-part ${stage.id}${isVisible ? " visible" : ""}${isNewest ? " stage-new" : ""}`;

      return `
        <g class="${className}" data-stage="${stageNumber}">
          ${stage.parts.map((partName) => renderPart(partName)).join("")}
        </g>
      `;
    })
    .join("");

  return `
    <svg
      class="hangman-scene"
      viewBox="${scene.viewBox}"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="Risba vislic"
    >
      <g transform="${scene.gallowsTransform}">
        ${stageMarkup}
      </g>
    </svg>
  `;
}
