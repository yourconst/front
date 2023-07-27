interface NumberUnitFormatterUnit {
    name: string;
    value: number;
    countToNext?: number;
    decimals?: number;
}

export class NumberUnitFormatter {
    readonly units: NumberUnitFormatterUnit[];

    constructor(units: NumberUnitFormatterUnit[], options?: {
        countToNext?: number;
        baseToFormat?: number;
        decimals?: number;

    }) {
        if (!units.length) {
            throw new Error('Units is empty');
        }

        this.units = units.slice().sort((e1, e2) => e1.value - e2.value);

        for (const unit of this.units) {
            unit.countToNext ??= options?.countToNext ?? 1000;
            unit.decimals ??= options?.decimals;
        }
    }

    getInfo(value: number) {
        let rv = value;
        let ru: NumberUnitFormatterUnit;

        for (const unit of this.units) {
            rv = value / unit.value;

            if (Math.abs(rv) < unit.countToNext) {
                ru = unit;
                break;
            }
        }

        if (!ru) {
            ru = this.units.at(-1);
        }

        return {
            value: rv,
            unit: ru,
        };
    }

    format(value: number) {
        if (!isFinite(value)) {
            return `${value}`;
        }

        const info = this.getInfo(value);
        let strValue: string;

        if (typeof info.unit?.decimals === 'number') {
            strValue = info.value.toFixed(info.unit.decimals);
        } else {
            strValue = `${info.value}`;
        }

        return `${strValue}${info.unit.name}`;
    }
}
