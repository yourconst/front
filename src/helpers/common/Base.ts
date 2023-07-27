export class BaseHelpers {
    static readonly sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
    static readonly setImmediate = (callback: () => any) => setTimeout(callback);

    static readonly rand = (max: number, min = 0) => min + Math.random() * (max - min);
    static readonly randInt = (max: number, min = 0) => Math.trunc(BaseHelpers.rand(max, min));
    static readonly isPow2 = (n: number) => (n & (n - 1)) === 0;

    static readonly getbiti32 = (n: number, bitIndex: number) => !!(n & (1 << bitIndex));

    static readonly fract = (n: number) => n % 1;
    static readonly pnrandf = (seed: number) => (
        43758.5453 + (
            (seed % 123.456789) * 43758.5453
        ) % 1
    ) % 1;
    // (
    //     (
    //         seed + 43758.5453 + seed * 43758.5453
    //     ) % 123.456789
    // ) % 1;
    static readonly pnrandi30 = (seed: number) => (BaseHelpers.pnrandf(seed) * (1 << 30)) >> 0;
    static readonly psrandf = (s: string, seed = s.length) => {
        for (let i = 0; i < s.length; ++i) {
            seed = BaseHelpers.pnrandf(s.charCodeAt(i) + i * seed);
        }
        return seed;
    };
    static readonly psrandi30 = (s: string, seed = s.length) => {
        return (BaseHelpers.psrandf(s, seed) * (1 << 30)) >> 0;
        // for (let i = 0; i < s.length; ++i) {
        //     seed = BaseHelpers.pnrandi30(s.charCodeAt(i) + i * seed);
        // }
        // return seed;
    };

    static readonly randElement = <T>(elems: T[]) => elems[BaseHelpers.randInt(elems.length)];
    static readonly capitalizeFirstLetter = (s: string) => s.slice(0, 1).toUpperCase().concat(s.slice(1));
}
