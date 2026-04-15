const functionTypes = ['linear', 'curve', 'parabolic'] as const;
export type FunctionType = (typeof functionTypes)[number];

export interface Pattern {
    id?: string;
    name: string;
    fType: FunctionType;
    duration: number; // in seconds
    initValue: number;
    endValue: number;
    minTolerance: number;
    maxTolerance: number;
}
