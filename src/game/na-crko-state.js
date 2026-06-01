export const ALPHABET = [
  "A",
  "B",
  "C",
  "Č",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "Š",
  "T",
  "U",
  "V",
  "Z",
  "Ž"
];

export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 100 },
  { level: 3, minPoints: 250 },
  { level: 4, minPoints: 500 },
  { level: 5, minPoints: 900 },
  { level: 6, minPoints: 1400 },
  { level: 7, minPoints: 2000 },
  { level: 8, minPoints: 2800 },
  { level: 9, minPoints: 3800 },
  { level: 10, minPoints: 5000 }
];

export const MAX_LIVES = 5;
export const WORD_BASE_POINTS = 100;
export const UNUSED_MISTAKE_POINTS = 10;
export const LETTER_COMPLETE_BONUS = 250;
export const PERFECT_LETTER_BONUS = 150;

export const STAGE_CONFIGS = [
  {
    id: "stage-1",
    minCompletedLetters: 0,
    maxCompletedLetters: 0,
    categoriesPerLetter: 3,
    categoryPool: ["hrana", "zival", "predmet"],
    allowedDifficulties: ["easy"],
    fallbackDifficulties: ["easy", "medium"],
    maxAnswerLetters: 5,
    maxMistakes: 6
  },
  {
    id: "stage-2",
    minCompletedLetters: 1,
    maxCompletedLetters: 2,
    categoriesPerLetter: 4,
    categoryPool: ["hrana", "zival", "predmet", "mesto"],
    allowedDifficulties: ["medium"],
    fallbackDifficulties: ["easy", "medium"],
    maxMistakes: 5
  },
  {
    id: "stage-3",
    minCompletedLetters: 3,
    maxCompletedLetters: 4,
    categoriesPerLetter: 5,
    categoryPool: ["hrana", "zival", "predmet", "mesto", "poklic"],
    allowedDifficulties: ["hard"],
    fallbackDifficulties: ["easy", "medium", "hard"],
    maxMistakes: 5
  },
  {
    id: "stage-4",
    minCompletedLetters: 5,
    maxCompletedLetters: Number.POSITIVE_INFINITY,
    categoriesPerLetter: 6,
    categoryPool: ["hrana", "zival", "predmet", "mesto", "poklic", "drzava"],
    allowedDifficulties: ["hard"],
    fallbackDifficulties: ["easy", "medium", "hard"],
    maxMistakes: 4
  }
];

export function getStageConfig(completedLettersCount) {
  return (
    STAGE_CONFIGS.find(
      (entry) =>
        completedLettersCount >= entry.minCompletedLetters &&
        completedLettersCount <= entry.maxCompletedLetters
    ) || STAGE_CONFIGS[STAGE_CONFIGS.length - 1]
  );
}

export function createGameState(profile) {
  return {
    profile,
    run: {
      lives: MAX_LIVES,
      runPoints: 0,
      completedLettersCount: 0,
      usedAnswers: new Set(),
      carriedWrongGuessCount: 0,
      currentLetter: "",
      categoryCountForLetter: 3,
      selectedCategoryIds: [],
      categoryResults: [],
      currentCategoryIndex: 0,
      failedWordThisLetter: false,
      hintAvailableForLetter: true,
      hintUsedForCurrentLetter: false,
      difficultyMode: "normal",
      activeDifficulties: ["easy"]
    },
    round: {
      answer: "",
      categoryId: "",
      revealedLetters: new Set(),
      wrongLetters: new Set(),
      startingWrongGuessCount: 0,
      wrongGuessCount: 0,
      maxWrongGuesses: 6,
      status: "playing",
      pointsAwardedLastStep: 0,
      lastLetterBonus: 0,
      lastPerfectBonus: 0,
      lastLifeGained: false,
      hintRevealedLetter: "",
      finalSummary: null
    },
    effects: createEmptyEffects()
  };
}

export function createEmptyEffects() {
  return {
    correctLetter: "",
    wrongLetter: "",
    hintRevealedLetter: "",
    hintUnavailable: false,
    pulseMistakes: false,
    bumpStage: false,
    pulseBanner: false,
    pulseLife: false
  };
}

export function getCategoryCountForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).categoriesPerLetter;
}

export function getMaxWrongGuessesForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).maxMistakes;
}

export function getMaxAnswerLettersForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).maxAnswerLetters || Number.POSITIVE_INFINITY;
}

export function getAllowedDifficultiesForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).allowedDifficulties;
}

export function getFallbackDifficultiesForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).fallbackDifficulties;
}

export function getCategoryPoolForCompletedLetters(completedLettersCount) {
  return getStageConfig(completedLettersCount).categoryPool;
}

export function getLevelInfo(totalPoints) {
  const current = [...LEVEL_THRESHOLDS].reverse().find((entry) => totalPoints >= entry.minPoints) || LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find((entry) => entry.level === current.level + 1) || null;

  return {
    currentLevel: current.level,
    currentMin: current.minPoints,
    nextLevel: next?.level || null,
    nextMin: next?.minPoints || null,
    progressValue: totalPoints - current.minPoints,
    progressMax: next ? next.minPoints - current.minPoints : 1,
    progressPercent: next
      ? Math.min(100, ((totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100)
      : 100
  };
}

export function normalizeInput(value) {
  return (value || "").trim().toLocaleUpperCase("sl-SI");
}
