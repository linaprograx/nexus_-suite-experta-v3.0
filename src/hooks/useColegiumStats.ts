import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Firestore } from 'firebase/firestore';
import { ColegiumResult } from '../types';

export interface TopicMastery {
    topic: string;
    games: number;
    correct: number;
    total: number;
    accuracy: number; // 0-100
}

export interface ColegiumStats {
    results: ColegiumResult[];
    gamesPlayed: number;
    totalCorrect: number;      // sum of all correct answers (aka "puntaje total")
    totalQuestions: number;
    avgAccuracy: number;       // 0-100
    recentAccuracy: number;    // 0-100 over the last 5 games (for adaptive difficulty)
    perfectGames: number;
    bestAccuracy: number;      // 0-100
    currentStreak: number;     // consecutive days played
    playedToday: boolean;
    lastScores: { name: string; score: number; accuracy: number }[]; // most recent first -> for sparkline (oldest..newest)
    masteryByTopic: TopicMastery[];
    loading: boolean;
}

/** Normalizes a Firestore Timestamp / Date / number to a midnight-aligned day index. */
const toDayNumber = (createdAt: any): number | null => {
    if (!createdAt) return null;
    let d: Date;
    if (typeof createdAt?.toDate === 'function') d = createdAt.toDate();
    else if (typeof createdAt?.seconds === 'number') d = new Date(createdAt.seconds * 1000);
    else if (createdAt instanceof Date) d = createdAt;
    else if (typeof createdAt === 'number') d = new Date(createdAt);
    else return null;
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
};

/**
 * Real-time aggregation of the user's Colegium quiz history.
 * Replaces all the hardcoded stats that used to live in the view.
 */
export const useColegiumStats = (db: Firestore | null, userId: string | null): ColegiumStats => {
    const [results, setResults] = useState<ColegiumResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId) {
            setLoading(false);
            return;
        }
        const ref = collection(db, `users/${userId}/colegium-results`);
        const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            setResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as ColegiumResult)));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [db, userId]);

    return useMemo(() => {
        const gamesPlayed = results.length;
        const totalCorrect = results.reduce((s, r) => s + (r.score || 0), 0);
        const totalQuestions = results.reduce((s, r) => s + (r.total || 0), 0);
        const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const perfectGames = results.filter(r => r.total > 0 && r.score === r.total).length;

        const accuracies = results.map(r => r.total > 0 ? (r.score / r.total) * 100 : 0);
        const bestAccuracy = accuracies.length ? Math.round(Math.max(...accuracies)) : 0;

        // Recent accuracy over last 5 games (results are desc → first 5)
        const recent5 = results.slice(0, 5);
        const recentCorrect = recent5.reduce((s, r) => s + (r.score || 0), 0);
        const recentTotal = recent5.reduce((s, r) => s + (r.total || 0), 0);
        const recentAccuracy = recentTotal > 0 ? Math.round((recentCorrect / recentTotal) * 100) : 0;

        // Daily streak: count consecutive days back from today (or yesterday) with activity
        const days = new Set<number>();
        for (const r of results) {
            const d = toDayNumber(r.createdAt);
            if (d !== null) days.add(d);
        }
        const today = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() / 86400000);
        const playedToday = days.has(today);
        let currentStreak = 0;
        // Streak stays alive if played today OR yesterday
        let cursor = playedToday ? today : (days.has(today - 1) ? today - 1 : null);
        while (cursor !== null && days.has(cursor)) {
            currentStreak++;
            cursor--;
        }

        // Last scores oldest..newest for the sparkline (take 7 most recent, reverse)
        const recent = results.slice(0, 7).reverse();
        const lastScores = recent.map((r, i) => ({
            name: `P${i + 1}`,
            score: r.score || 0,
            accuracy: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
        }));

        // Mastery by topic
        const topicMap = new Map<string, { games: number; correct: number; total: number }>();
        for (const r of results) {
            const t = r.topic || 'General';
            const cur = topicMap.get(t) || { games: 0, correct: 0, total: 0 };
            cur.games += 1;
            cur.correct += r.score || 0;
            cur.total += r.total || 0;
            topicMap.set(t, cur);
        }
        const masteryByTopic: TopicMastery[] = Array.from(topicMap.entries())
            .map(([topic, v]) => ({
                topic,
                games: v.games,
                correct: v.correct,
                total: v.total,
                accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
            }))
            .sort((a, b) => b.games - a.games);

        return {
            results,
            gamesPlayed,
            totalCorrect,
            totalQuestions,
            avgAccuracy,
            recentAccuracy,
            perfectGames,
            bestAccuracy,
            currentStreak,
            playedToday,
            lastScores,
            masteryByTopic,
            loading,
        };
    }, [results, loading]);
};

export type Difficulty = 'Fácil' | 'Normal' | 'Difícil' | 'Experto';
const DIFFICULTY_LADDER: Difficulty[] = ['Fácil', 'Normal', 'Difícil', 'Experto'];

/**
 * Legacy adaptive-only suggestion (kept for compatibility).
 */
export const suggestDifficulty = (recentAccuracy: number, gamesPlayed: number): Difficulty => {
    if (gamesPlayed < 2) return 'Normal';
    if (recentAccuracy >= 85) return 'Difícil';
    if (recentAccuracy <= 50) return 'Fácil';
    return 'Normal';
};

/** Base difficulty floor that rises with the player's level. */
export const getLevelDifficultyTier = (level: number): number => {
    if (level >= 10) return 3; // Experto
    if (level >= 6) return 2;  // Difícil
    if (level >= 3) return 1;  // Normal
    return 0;                  // Fácil
};

/**
 * Progressive difficulty = level floor ± recent-performance adjustment.
 * As you level up, the floor rises so quizzes genuinely get harder; within a
 * level, doing great bumps you up and struggling eases you down.
 */
export const getProgressiveDifficulty = (level: number, recentAccuracy: number, gamesPlayed: number): Difficulty => {
    const tier = getLevelDifficultyTier(level);
    let adjust = 0;
    if (gamesPlayed >= 2) {
        if (recentAccuracy >= 85) adjust = 1;
        else if (recentAccuracy <= 50) adjust = -1;
    }
    const idx = Math.max(0, Math.min(DIFFICULTY_LADDER.length - 1, tier + adjust));
    return DIFFICULTY_LADDER[idx];
};

/** Maps a user level number to a cocktail-master rank title. */
export const getRankTitle = (level: number): string => {
    if (level >= 30) return 'Leyenda del Nexus';
    if (level >= 20) return 'Maestro Mixólogo';
    if (level >= 12) return 'Bartender Élite';
    if (level >= 7) return 'Mixólogo Senior';
    if (level >= 4) return 'Bartender';
    if (level >= 2) return 'Aprendiz Avanzado';
    return 'Aprendiz';
};
