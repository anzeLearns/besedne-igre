const STORAGE_KEY = "vislice-na-crko-profile-v1";
const INTRO_SEEN_KEY = "visliceIntroSeen";

export function createDefaultProfile() {
  return {
    totalPoints: 0,
    bestRunPoints: 0,
    bestCompletedLetters: 0
  };
}

export function loadProfile() {
  const fallback = createDefaultProfile();

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...fallback,
      ...(stored || {})
    };
  } catch (error) {
    return fallback;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function resetProfile() {
  const profile = createDefaultProfile();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures and still reset the in-memory profile.
  }

  return profile;
}

export function loadIntroSeen() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch (error) {
    return false;
  }
}

export function saveIntroSeen(seen) {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, seen ? "true" : "false");
  } catch (error) {
    // Ignore storage write failures and keep the session usable.
  }
}
