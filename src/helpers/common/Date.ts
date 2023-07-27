export abstract class DateHelpers {
    static fromYYYYMMDD(date: string) {
        return new Date(date);
    }

    static fromSeconds(seconds: number) {
        return new Date(1000 * seconds);
    }

    static fromMilliseconds(ms: number) {
        return new Date(ms);
    }

    static isValid(d: Date) {
        return d instanceof Date && !isNaN(d.getTime());
    }

    static getYYYYMMDDString(d: Date) {
        if (DateHelpers.isValid(d)) {
            return d.toISOString().slice(0, 10);
        }
        return null;
    }
}
