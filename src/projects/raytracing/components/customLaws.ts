export interface CustomLaw {
    readonly from: (value: number, min?: number, max?: number) => number;
    readonly to: (value: number, min?: number, max?: number) => number;
}

export const linear: CustomLaw = {
    from: v => v,
    to: v => v,
};

export const createPow = (pow: number): CustomLaw => ({
    from: (v, min, max) => min + Math.pow((v - min) / (max - min), pow) * (max - min),
    to: (v, min, max) => min + Math.pow((v - min) / (max - min), 1 / pow) * (max - min),
});
