interface ToleranceRange {
    minTolerance: number;
    maxTolerance: number;
}

export const createRandomValueWithTolerance = ({
    minTolerance,
    maxTolerance,
}: ToleranceRange): number => {
    const maxVariation = minTolerance + maxTolerance;
    return maxVariation * Math.random() - minTolerance;
};
