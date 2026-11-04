import type { ScoringCriterion } from '@/lib/types';

export const DEFAULT_CRITERIA: ScoringCriterion[] = [
    { key: 'tajweed', label: 'Tajweed', max: 30, weight: 30 },
    { key: 'memorization', label: 'Memorization', max: 70, weight: 70 },
];

const CRITERION_KEY = /^[a-z0-9_]+$/;

export function normalizeCriteria(raw: unknown): ScoringCriterion[] {
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_CRITERIA.map((c) => ({ ...c }));

    const seen = new Set<string>();
    const criteria: ScoringCriterion[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') return DEFAULT_CRITERIA.map((c) => ({ ...c }));
        const record = item as Record<string, unknown>;
        const key = typeof record.key === 'string' ? record.key.trim().toLowerCase() : '';
        const label = typeof record.label === 'string' ? record.label.trim() : '';
        const max = Number(record.max);
        const weight = Number(record.weight);
        if (!CRITERION_KEY.test(key) || seen.has(key) || !label) {
            return DEFAULT_CRITERIA.map((c) => ({ ...c }));
        }
        if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(weight) || weight < 0) {
            return DEFAULT_CRITERIA.map((c) => ({ ...c }));
        }
        seen.add(key);
        criteria.push({ key, label, max, weight });
    }
    return criteria;
}

export function criteriaFor(competition: { scoringCriteria: unknown }): ScoringCriterion[] {
    return normalizeCriteria(competition.scoringCriteria);
}

export function scoreMaximum(criteria: ScoringCriterion[], mode: 'FIXED' | 'PERCENT'): number {
    if (mode === 'PERCENT') return 100;
    return criteria.reduce((sum, criterion) => sum + criterion.max, 0);
}

export function sanitizeCriteriaInput(raw: unknown): { criteria: ScoringCriterion[]; error?: string } {
    if (!Array.isArray(raw) || raw.length === 0) {
        return { criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })), error: 'At least one scoring criterion is required' };
    }

    const seen = new Set<string>();
    const criteria: ScoringCriterion[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') return { criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })), error: 'Invalid criterion' };
        const record = item as Record<string, unknown>;
        const key = typeof record.key === 'string' ? record.key.trim().toLowerCase() : '';
        const label = typeof record.label === 'string' ? record.label.trim() : '';
        const max = Number(record.max);
        const weight = Number(record.weight);
        if (!CRITERION_KEY.test(key)) return { criteria, error: `Invalid criterion key "${key}"` };
        if (seen.has(key)) return { criteria, error: `Duplicate criterion key "${key}"` };
        if (!label) return { criteria, error: 'Criterion label is required' };
        if (!Number.isFinite(max) || max <= 0) return { criteria, error: `Maximum for "${label}" must be greater than 0` };
        if (!Number.isFinite(weight) || weight < 0) return { criteria, error: `Weight for "${label}" must be 0 or more` };
        seen.add(key);
        criteria.push({ key, label, max, weight });
    }

    return { criteria };
}

export function calculateScore(
    criteria: ScoringCriterion[],
    mode: 'FIXED' | 'PERCENT',
    values: Record<string, number>,
): { points: number; breakdown: Record<string, number>; maxPoints: number } {
    if (!values || typeof values !== 'object') throw new Error('criteria scores are required');

    const breakdown: Record<string, number> = {};
    let total = 0;
    const weightSum = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

    for (const criterion of criteria) {
        const value = Number(values[criterion.key]);
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`Invalid score for ${criterion.label}`);
        }

        if (mode === 'PERCENT') {
            if (value > 100) throw new Error(`Score for ${criterion.label} cannot exceed 100%`);
            const normalizedWeight = weightSum > 0 ? criterion.weight / weightSum : 1 / criteria.length;
            total += value * normalizedWeight;
        } else {
            if (value > criterion.max) {
                throw new Error(`Score for ${criterion.label} cannot exceed ${criterion.max}`);
            }
            total += value;
        }
        breakdown[criterion.key] = round2(value);
    }

    return {
        points: round2(total),
        breakdown,
        maxPoints: scoreMaximum(criteria, mode),
    };
}

export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export function averagePoints(points: number[]): number | null {
    if (points.length === 0) return null;
    return round2(points.reduce((sum, value) => sum + value, 0) / points.length);
}

export function participantProgress(submittedCount: number, judgeCount: number) {
    return {
        submittedCount,
        judgeCount,
        complete: judgeCount > 0 && submittedCount >= judgeCount,
    };
}
