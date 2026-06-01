const SCENE_PRESETS = {
  mobile: {
    width: 520,
    height: 320,
    gallowsTransform: "translate(8 6) scale(0.94)"
  },
  desktop: {
    width: 520,
    height: 384,
    gallowsTransform: "translate(8 18) scale(1.04)"
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

function renderPart(partName) {
  switch (partName) {
    case "base":
      return `
        <g class="hangman-wood">
          <rect x="138" y="244" width="44" height="44" rx="10" fill="#8f571f" stroke="#5e340f" stroke-width="3"></rect>
          <rect x="132" y="282" width="56" height="12" rx="5" fill="#6b3c14"></rect>
          <path d="M156 282 L104 312" fill="none" stroke="#8f571f" stroke-width="18" stroke-linecap="round"></path>
          <path d="M164 282 L214 312" fill="none" stroke="#8f571f" stroke-width="18" stroke-linecap="round"></path>
          <path d="M108 314 L124 314" fill="none" stroke="#5d340f" stroke-width="12" stroke-linecap="round"></path>
          <path d="M196 314 L214 314" fill="none" stroke="#5d340f" stroke-width="12" stroke-linecap="round"></path>
          <path d="M152 244 L152 286" fill="none" stroke="#c78a3c" stroke-width="6" stroke-linecap="round" opacity="0.7"></path>
        </g>
      `;
    case "pole":
      return `
        <g class="hangman-wood">
          <rect x="146" y="54" width="34" height="236" rx="12" fill="#9f6329" stroke="#613812" stroke-width="4"></rect>
          <path d="M163 60 L163 286" fill="none" stroke="#bf8640" stroke-width="5" stroke-linecap="round" opacity="0.52"></path>
          <circle cx="163" cy="98" r="4.5" fill="#5f3612"></circle>
          <circle cx="163" cy="146" r="4.5" fill="#5f3612"></circle>
          <circle cx="163" cy="198" r="4.5" fill="#5f3612"></circle>
        </g>
      `;
    case "beam":
      return `
        <g class="hangman-wood">
          <rect x="156" y="64" width="210" height="26" rx="12" fill="#a4672c" stroke="#633811" stroke-width="4"></rect>
          <path d="M166 76 H356" fill="none" stroke="#c68a42" stroke-width="5" stroke-linecap="round" opacity="0.55"></path>
          <circle cx="182" cy="77" r="4.5" fill="#694019"></circle>
          <circle cx="250" cy="77" r="4" fill="#694019"></circle>
          <circle cx="318" cy="77" r="4" fill="#694019"></circle>
        </g>
      `;
    case "support":
      return `
        <g class="hangman-wood">
          <path d="M174 168 L256 82" fill="none" stroke="#8f561f" stroke-width="22" stroke-linecap="round"></path>
          <path d="M174 168 L256 82" fill="none" stroke="#6d4016" stroke-width="7" stroke-linecap="round" opacity="0.34"></path>
        </g>
      `;
    case "rope":
      return `
        <g class="hangman-rope">
          <path d="M334 80 V124" fill="none" stroke="#ddb56f" stroke-width="11" stroke-linecap="round"></path>
          <path d="M328 78 C334 88 338 98 340 108" fill="none" stroke="#c9964f" stroke-width="4" stroke-linecap="round" opacity="0.7"></path>
          <path d="M328 110 C334 118 338 126 340 134" fill="none" stroke="#c9964f" stroke-width="4" stroke-linecap="round" opacity="0.55"></path>
        </g>
      `;
    case "head":
      return `
        <g class="hangman-figure">
          <path d="M334 124 V136" fill="none" stroke="#d3a25b" stroke-width="7" stroke-linecap="round"></path>
          <circle cx="334" cy="154" r="27" fill="#faf4df" stroke="#504135" stroke-width="4.5"></circle>
        </g>
      `;
    case "torso":
      return `
        <g class="hangman-figure">
          <path d="M334 181 V246" fill="none" stroke="#fff7e8" stroke-width="10" stroke-linecap="round"></path>
        </g>
      `;
    case "arms":
      return `
        <g class="hangman-figure">
          <path d="M334 205 L302 236" fill="none" stroke="#fff7e8" stroke-width="9" stroke-linecap="round"></path>
          <path d="M334 205 L366 236" fill="none" stroke="#fff7e8" stroke-width="9" stroke-linecap="round"></path>
        </g>
      `;
    case "legs":
      return `
        <g class="hangman-figure">
          <path d="M334 246 L308 292" fill="none" stroke="#fff7e8" stroke-width="9" stroke-linecap="round"></path>
          <path d="M334 246 L360 292" fill="none" stroke="#fff7e8" stroke-width="9" stroke-linecap="round"></path>
        </g>
      `;
    case "face":
      return `
        <g class="hangman-figure-face">
          <path d="M322 147 L329 154" fill="none" stroke="#1f231f" stroke-width="4" stroke-linecap="round"></path>
          <path d="M329 147 L322 154" fill="none" stroke="#1f231f" stroke-width="4" stroke-linecap="round"></path>
          <path d="M339 147 L346 154" fill="none" stroke="#1f231f" stroke-width="4" stroke-linecap="round"></path>
          <path d="M346 147 L339 154" fill="none" stroke="#1f231f" stroke-width="4" stroke-linecap="round"></path>
          <path d="M320 171 Q334 182 348 171" fill="none" stroke="#1f231f" stroke-width="3.8" stroke-linecap="round"></path>
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
      viewBox="0 0 ${scene.width} ${scene.height}"
      preserveAspectRatio="${mode === "mobile" ? "xMidYMid slice" : "xMidYMax slice"}"
      role="img"
      aria-label="Risba vislic"
    >
      <g transform="${scene.gallowsTransform}">
        ${stageMarkup}
      </g>
    </svg>
  `;
}
