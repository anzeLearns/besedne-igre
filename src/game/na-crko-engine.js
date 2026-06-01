import { naCrkoCategories } from "../data/na-crko-data.js";
import {
  LETTER_COMPLETE_BONUS,
  MAX_LIVES,
  PERFECT_LETTER_BONUS,
  UNUSED_MISTAKE_POINTS,
  WORD_BASE_POINTS,
  createEmptyEffects,
  getCategoryCountForCompletedLetters,
  getCategoryPoolForCompletedLetters,
  getMaxAnswerLettersForCompletedLetters,
  getMaxWrongGuessesForCompletedLetters,
  getAllowedDifficultiesForCompletedLetters,
  normalizeInput
} from "./na-crko-state.js";
import { saveProfile } from "./na-crko-storage.js";

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getHiddenLetters(state) {
  return [...new Set([...state.round.answer])].filter((letter) => {
    return letter !== " " && letter !== state.run.currentLetter && !state.round.revealedLetters.has(letter);
  });
}

function getCategoryById(categoryId) {
  return naCrkoCategories.find((category) => category.id === categoryId);
}

function getAnswersForLetter(category, letter, usedAnswers, allowedDifficulties, completedLettersCount) {
  const maxAnswerLetters = getMaxAnswerLettersForCompletedLetters(completedLettersCount);

  return category.answers.filter((entry) => {
    return (
      entry.word.startsWith(letter) &&
      entry.word.replaceAll(" ", "").length <= maxAnswerLetters &&
      allowedDifficulties.includes(entry.difficulty) &&
      !usedAnswers.has(entry.word)
    );
  });
}

function buildLetterCandidates(state, allowedDifficulties) {
  const categoryPool = getCategoryPoolForCompletedLetters(state.run.completedLettersCount);
  const neededCategories = getCategoryCountForCompletedLetters(state.run.completedLettersCount);
  const poolCategories = categoryPool.map((categoryId) => getCategoryById(categoryId)).filter(Boolean);
  const candidates = [];

  for (const letter of state.profileAlphabet) {
    const eligibleCategories = poolCategories.filter((category) => {
      return getAnswersForLetter(
        category,
        letter,
        state.run.usedAnswers,
        allowedDifficulties,
        state.run.completedLettersCount
      ).length > 0;
    });

    if (eligibleCategories.length >= neededCategories) {
      candidates.push({
        letter,
        eligibleCategories: eligibleCategories.slice(0, neededCategories)
      });
    }
  }

  return candidates;
}

function pickPlayableSetup(state, previousLetter = "") {
  const difficulties = getAllowedDifficultiesForCompletedLetters(state.run.completedLettersCount);
  const candidates = buildLetterCandidates(state, difficulties);

  if (candidates.length > 0) {
    const filtered = candidates.filter((candidate) => candidate.letter !== previousLetter);
    return {
      ...randomItem(filtered.length ? filtered : candidates),
      difficulties,
      mode: "normal"
    };
  }

  state.run.usedAnswers = new Set();
  const resetCandidates = buildLetterCandidates(state, difficulties);

  if (resetCandidates.length > 0) {
    const filtered = resetCandidates.filter((candidate) => candidate.letter !== previousLetter);
    return {
      ...randomItem(filtered.length ? filtered : resetCandidates),
      difficulties,
      mode: "reset"
    };
  }

  throw new Error("No playable setup available for Vislice Na črko.");
}

function buildNewWordRound(state) {
  const categoryId = state.run.selectedCategoryIds[state.run.currentCategoryIndex];
  const category = getCategoryById(categoryId);
  const options = getAnswersForLetter(
    category,
    state.run.currentLetter,
    state.run.usedAnswers,
    state.run.activeDifficulties,
    state.run.completedLettersCount
  );
  const selectedEntry = randomItem(options);
  const maxWrongGuesses = getMaxWrongGuessesForCompletedLetters(state.run.completedLettersCount);
  const startingWrongGuessCount = Math.min(state.run.carriedWrongGuessCount, maxWrongGuesses);

  state.round.answer = selectedEntry.word;
  state.round.categoryId = categoryId;
  state.round.revealedLetters = new Set([state.run.currentLetter]);
  state.round.wrongLetters = new Set();
  state.round.startingWrongGuessCount = startingWrongGuessCount;
  state.round.wrongGuessCount = startingWrongGuessCount;
  state.round.maxWrongGuesses = maxWrongGuesses;
  state.round.status = "playing";
  state.round.pointsAwardedLastStep = 0;
  state.round.lastLetterBonus = 0;
  state.round.lastPerfectBonus = 0;
  state.round.lastLifeGained = false;
  state.round.hintRevealedLetter = "";
  state.round.finalSummary = null;
  state.effects = createEmptyEffects();
}

function setupNextLetter(state, previousLetter = "") {
  state.run.categoryCountForLetter = getCategoryCountForCompletedLetters(state.run.completedLettersCount);
  const chosen = pickPlayableSetup(state, previousLetter);
  const selectedCategories = chosen.eligibleCategories.map((category) => category.id);

  state.run.currentLetter = chosen.letter;
  state.run.selectedCategoryIds = selectedCategories;
  state.run.categoryResults = selectedCategories.map(() => "pending");
  state.run.currentCategoryIndex = 0;
  state.run.carriedWrongGuessCount = 0;
  state.run.failedWordThisLetter = false;
  state.run.hintAvailableForLetter = true;
  state.run.hintUsedForCurrentLetter = false;
  state.run.difficultyMode = chosen.mode;
  state.run.activeDifficulties = [...chosen.difficulties];
  buildNewWordRound(state);
}

function isRoundSolved(state) {
  return [...state.round.answer].every((character) => {
    return character === " " || state.round.revealedLetters.has(character);
  });
}

function calculateWordPoints(state) {
  return WORD_BASE_POINTS + (state.round.maxWrongGuesses - state.round.wrongGuessCount) * UNUSED_MISTAKE_POINTS;
}

function commitGameOver(state) {
  const runPoints = state.run.runPoints;
  const completedLetters = state.run.completedLettersCount;
  const previousBestRun = state.profile.bestRunPoints;
  const previousBestLetters = state.profile.bestCompletedLetters;
  const profile = {
    totalPoints: state.profile.totalPoints + runPoints,
    bestRunPoints: Math.max(state.profile.bestRunPoints, runPoints),
    bestCompletedLetters: Math.max(state.profile.bestCompletedLetters, completedLetters)
  };

  state.profile = profile;
  state.round.status = "game-over";
  state.round.finalSummary = {
    runPoints,
    completedLetters,
    beatBestRun: runPoints > previousBestRun,
    beatBestLetters: completedLetters > previousBestLetters
  };

  saveProfile(profile);
}

export function prepareGame(state, alphabet) {
  state.profileAlphabet = alphabet;
  startNewRun(state);
}

export function startNewRun(state) {
  state.run.lives = MAX_LIVES;
  state.run.runPoints = 0;
  state.run.completedLettersCount = 0;
  state.run.usedAnswers = new Set();
  state.run.carriedWrongGuessCount = 0;
  state.run.hintAvailableForLetter = true;
  state.run.hintUsedForCurrentLetter = false;
  state.effects = createEmptyEffects();
  setupNextLetter(state);
}

export function clearEffects(state) {
  state.effects = createEmptyEffects();
}

export function guessLetter(state, rawLetter) {
  const letter = normalizeInput(rawLetter);
  if (state.round.status !== "playing") {
    return;
  }

  if (!letter || state.round.revealedLetters.has(letter) || state.round.wrongLetters.has(letter)) {
    return;
  }

  state.effects = createEmptyEffects();

  if (state.round.answer.includes(letter)) {
    state.effects.correctLetter = letter;
    state.round.revealedLetters.add(letter);

    if (isRoundSolved(state)) {
      const points = calculateWordPoints(state);
      state.round.pointsAwardedLastStep = points;
      state.run.runPoints += points;
      state.run.usedAnswers.add(state.round.answer);
      state.run.categoryResults[state.run.currentCategoryIndex] = "solved";
      state.round.status = "word-solved";
      state.effects.pulseBanner = true;
    }

    return;
  }

  state.round.wrongLetters.add(letter);
  state.round.wrongGuessCount = state.round.startingWrongGuessCount + state.round.wrongLetters.size;
  state.effects.wrongLetter = letter;
  state.effects.pulseMistakes = true;
  state.effects.bumpStage = true;

  if (state.round.wrongGuessCount >= state.round.maxWrongGuesses) {
    state.round.status = "word-failed";
    state.round.pointsAwardedLastStep = 0;
    state.run.lives = Math.max(0, state.run.lives - 1);
    state.run.carriedWrongGuessCount = 0;
    state.run.failedWordThisLetter = true;
    state.run.usedAnswers.add(state.round.answer);
    state.run.categoryResults[state.run.currentCategoryIndex] = "failed";
    state.effects.pulseLife = true;

    if (state.run.lives <= 0) {
      commitGameOver(state);
    }
  }
}

export function useHint(state) {
  if (state.round.status !== "playing") {
    return;
  }

  state.effects = createEmptyEffects();

  const hiddenLetters = getHiddenLetters(state);
  if (!state.run.hintAvailableForLetter || state.run.hintUsedForCurrentLetter || hiddenLetters.length === 0) {
    state.effects.hintUnavailable = true;
    return;
  }

  const revealedLetter = randomItem(hiddenLetters);
  state.run.hintAvailableForLetter = false;
  state.run.hintUsedForCurrentLetter = true;
  state.round.hintRevealedLetter = revealedLetter;
  state.effects.hintRevealedLetter = revealedLetter;
  state.round.revealedLetters.add(revealedLetter);

  if (isRoundSolved(state)) {
    const points = calculateWordPoints(state);
    state.round.pointsAwardedLastStep = points;
    state.run.runPoints += points;
    state.run.usedAnswers.add(state.round.answer);
    state.run.categoryResults[state.run.currentCategoryIndex] = "solved";
    state.round.status = "word-solved";
    state.effects.pulseBanner = true;
  }
}

export function advanceState(state) {
  if (state.round.status === "game-over") {
    startNewRun(state);
    return;
  }

  if (state.round.status === "word-solved" || state.round.status === "word-failed") {
    const isLastCategory = state.run.currentCategoryIndex >= state.run.selectedCategoryIds.length - 1;

    if (!isLastCategory) {
      if (state.round.status === "word-solved") {
        state.run.carriedWrongGuessCount = Math.max(0, state.round.wrongGuessCount - 2);
      } else {
        state.run.carriedWrongGuessCount = 0;
      }

      state.run.currentCategoryIndex += 1;
      buildNewWordRound(state);
      return;
    }

    const perfectBonus = state.run.failedWordThisLetter ? 0 : PERFECT_LETTER_BONUS;
    const bonusLifeBefore = state.run.lives;

    state.run.runPoints += LETTER_COMPLETE_BONUS + perfectBonus;
    state.run.completedLettersCount += 1;
    state.run.lives = Math.min(MAX_LIVES, state.run.lives + 1);
    state.round.lastLetterBonus = LETTER_COMPLETE_BONUS;
    state.round.lastPerfectBonus = perfectBonus;
    state.round.lastLifeGained = state.run.lives > bonusLifeBefore;
    state.round.status = "letter-complete";
    state.effects.pulseBanner = true;
    state.effects.pulseLife = state.run.lives > bonusLifeBefore;
    return;
  }

  if (state.round.status === "letter-complete") {
    const previousLetter = state.run.currentLetter;
    setupNextLetter(state, previousLetter);
  }
}

export function getCurrentCategory(state) {
  return getCategoryById(state.round.categoryId);
}

export function getSelectedCategories(state) {
  return state.run.selectedCategoryIds.map((categoryId) => getCategoryById(categoryId));
}
