import { doc, runTransaction, serverTimestamp, Firestore } from 'firebase/firestore';

// --- Configuration Constants ---
// Curve: XP = BASE * (LEVEL ^ EXPONENT)
const BASE_XP = 500; // XP needed for Level 1 -> 2
const EXPONENT = 1.5; // Steepness of the curve

export const XP_SOURCES = {
    QUIZ_COMPLETION: 50,
    CORRECT_ANSWER: 10,
    PERFECT_SCORE_BONUS: 100,
    SPEED_RUN_BONUS: 2, // Multiplier per second remaining? Or flat bonus?
    STREAK_BONUS_PER_DAY: 10, // XP per day of active streak
    STREAK_BONUS_CAP: 100,    // max streak bonus
    DIFFICULTY_MULTIPLIER: {
        'Fácil': 1,
        'Normal': 1.5,
        'Difícil': 2.0,
        'Experto': 3.0
    }
};

export interface LevelInfo {
    level: number;
    currentXP: number;
    nextLevelXP: number; // XP threshold for next level
    progress: number; // 0 to 100 for current level
}

/**
 * Calculates level details from total XP using an exponential curve.
 * Inverse Formula: Level = (TotalXP / BASE) ^ (1 / EXP)
 */
export const calculateLevelInfo = (totalXP: number): LevelInfo => {
    // 1. Calculate raw level (floor)
    // We add 1 because 0 XP is Level 1
    // Formula: Level = Math.floor( (XP / BASE)^(1/EXP) ) + 1

    if (totalXP < 0) totalXP = 0;

    const level = Math.floor(Math.pow(totalXP / BASE_XP, 1 / EXPONENT)) + 1;

    // 2. Calculate XP bounds for this level
    // XP for current level start: BASE * ((Level-1)^EXP)
    const currentLevelBaseXP = Math.floor(BASE_XP * Math.pow(level - 1, EXPONENT));

    // XP for next level start: BASE * (Level^EXP)
    const nextLevelBaseXP = Math.floor(BASE_XP * Math.pow(level, EXPONENT));

    // 3. Calculate progress
    const xpInLevel = totalXP - currentLevelBaseXP;
    const xpNeededForNext = nextLevelBaseXP - currentLevelBaseXP;

    const progress = xpNeededForNext > 0 ? (xpInLevel / xpNeededForNext) * 100 : 100;

    return {
        level,
        currentXP: totalXP,
        nextLevelXP: nextLevelBaseXP,
        progress: Math.min(100, Math.max(0, progress))
    };
};

/**
 * Transactionally adds XP to a user's profile.
 * Creates the field if it doesn't exist.
 */
export const addXP = async (db: Firestore | null, userId: string, amount: number, source: string) => {
    if (!userId || !db) return;

    const userRef = doc(db, 'users', userId, 'profile', 'main');

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                // If profile doesn't exist, create it with initial XP
                transaction.set(userRef, {
                    experience: amount,
                    displayName: 'Usuario Nexus', // Default fallback
                    updatedAt: serverTimestamp()
                });
                return;
            }

            const currentXP = userDoc.data().experience || 0;
            const currentStats = userDoc.data().stats || {};
            const newXP = currentXP + amount;

            // Optional: Update simplified level field for quick reads
            const levelInfo = calculateLevelInfo(newXP);

            transaction.update(userRef, {
                experience: newXP,
                level: levelInfo.level, // Store calculated level for easy querying
                updatedAt: serverTimestamp(),
                [`xpHistory.${Date.now()}`]: { amount, source } // Audit log (careful with size limits long term)
            });
        });
        console.log(`[XP System] Added ${amount} XP to user ${userId}. Source: ${source}`);
    } catch (error) {
        console.error("[XP System] Transaction failed: ", error);
        throw error;
    }
};
