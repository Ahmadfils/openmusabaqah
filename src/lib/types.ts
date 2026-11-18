export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'JUDGE';

export type SessionUser = {
    id: string;
    username: string;
    role: UserRole;
    displayName: string | null;
    organizationId: string | null;
    sessionVersion: number;
};

export type ScoringCriterion = {
    key: string;
    label: string;
    max: number;
    weight: number;
};

export type LeaderboardVisibility = 'PUBLIC' | 'PRIVATE' | 'HIDDEN_POINTS';

export type LeaderboardRow = {
    id: string;
    name: string;
    registrationCode: string;
    groupName: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedCount: number;
    judgeCount: number;
    complete: boolean;
    average: number | null;
    pointsVisible: boolean;
    rank: number | null;
};

export type ScoreSummary = {
    points: number;
    submittedAt: string;
    judgeId: string;
};
