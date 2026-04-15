/**
 * Utility function that flattens a nested object into a single-level object.
 * It recursively traverses nested structures and flattens them into the provided result map.
 * * Note: If multiple nested objects share the same key names, deeper keys will
 * overwrite previous ones in the resulting flat object.
 */
export const flattenObject = (
    sourceObject: Record<string, any>,
    accumulator: Record<string, any> = {},
): Record<string, any> => {
    Object.keys(sourceObject).forEach((key) => {
        const value = sourceObject[key];
        const isNestedObject =
            value && typeof value === 'object' && !Array.isArray(value);

        if (isNestedObject) flattenObject(value, accumulator);
        else accumulator[key] = value;
    });

    return accumulator;
};
