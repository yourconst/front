class Helpers {
    static getUnsignedModulo(value: number, base: number) {
        return ((value % base) + base) % base;
    }

    static isArraysEquals<T>(a1: T[], a2: T[], comparer = (e1: T, e2: T) => e1 === e2) {
        if (a1.length !== a2.length) {
            return false;
        }

        for (let i = 0; i < a1.length; ++i) {
            if (!comparer(a1[i], a2[i])) {
                return false;
            }
        }

        return true;
    }

    static getArrayDiffIndex<T>(a1: T[], a2: T[], i = 0) {
        while (i < a1.length && (a1[i] === a2[i])) {
            ++i;
        }

        return i;
    }
}

export type Axes = [number[], number[], number[]];

export class Step {
    constructor(public from: number, public to: number) { }

    set(from: number, to: number) {
        this.from = from;
        this.to = to;

        return this;
    }

    isEquals(step: Step) {
        return this.from === step.from && this.to === step.to;
    }

    getHash() {
        return `${this.from}${this.to}`;
    }
}

export class State {
    static createClassic(count = 3) {
        const originalCount = count;
        const left: number[] = [];

        while (count > 0) {
            left.push(count--);
        }

        return new State([left, [], []], originalCount);
    }
    static createFinal(count = 3) {
        const originalCount = count;
        const right: number[] = [];

        while (count > 0) {
            right.push(count--);
        }

        return new State([[], [], right], originalCount);
    }

    static createRandom(count = 3) {
        const originalCount = count;
        const axes: Axes = [[],[],[]];

        while (count > 0) {
            axes[Math.trunc(Math.random() * 3)].push(count--);
        }

        return new State(axes, originalCount);
    }

    static createFromReverseOrder(axes: Axes) {
        return new State(<Axes> axes.map(a => a.slice().reverse()));
    }

    static createFromReversePositions(pos: number[]) {
        const ringsCount = pos.length;
        const axes: Axes = [[], [], []];

        for (let i = 0; i < pos.length; ++i) {
            axes[pos[i]].push(ringsCount - i);
        }

        return new State(axes, ringsCount);
    }

    readonly ringsCount: number;

    constructor(readonly axes: Axes, ringsCount?: number) {
        this.ringsCount = ringsCount ?? this.getRingsCount();
    }

    getRingsCount() {
        return this.axes.reduce((acc, a) => acc + a.length, 0);
    }

    getHash() {
        // return JSON.stringify(this);
        return this.axes.map(a => a.join(',')).join('|');
    }

    clone() {
        return new State(<Axes>this.axes.map(a => a.slice()), this.ringsCount);
    }
    
    isValid() {
        for (const a of this.axes) {
            for (let i = 1; i < a.length; ++i) {
                if (a[i - 1] < a[i]) {
                    return false;
                }
            }
        }

        return true;
    }

    isFinish() {
        return !this.axes[0].length && !this.axes[1].length;
    }

    tryApplyStep(step: Step) {
        if (this.axes[step.from].length === 0) {
            return false;
        }

        if (this.axes[step.to].length && (
            this.axes[step.to].at(-1) < this.axes[step.from].at(-1)
        )) {
            return false;
        }

        this.axes[step.to].push(this.axes[step.from].pop());

        return true;
    }

    tryApplyStepsAndCheck(steps: Step[]) {
        for (const step of steps) {
            if (!this.tryApplyStep(step)) {
                return false;
            }
        }

        return this.isFinish();
    }

    isEquals(state: State) {
        for (let i = 0; i < 3; ++i) {
            if (!Helpers.isArraysEquals(state.axes[i], this.axes[i])) {
                return false;
            }
        }

        return true;
    }

    getReverseRingsPositions() {
        const result = new Array<number>(this.ringsCount);

        for (let i = 0; i < 3; ++i) {
            for (const ringIndex of this.axes[i]) {
                result[this.ringsCount - ringIndex] = i;
            }
        }

        return result;
    }
}

export class Classic {
    static getRingDirection(ringsCount: number, ringIndex: number) {
        return (ringsCount - ringIndex) % 2 ? 1 : -1;
    }

    static getRingModuloAbsolutePositionByPosition(ringsCount: number, ringIndex: number, position: number) {
        const direction = this.getRingDirection(ringsCount, ringIndex);

        return Helpers.getUnsignedModulo(direction * position, 3);
    }

    static getRingAbsolutePositionByStepIndex(stepIndex: number, ringIndex: number) {
        // const prepow = 1 << (ringIndex - 1);
        const prepow = 2 ** (ringIndex - 1);

        if (stepIndex < prepow) {
            return 0;
        }

        // return 1 + ((stepIndex - prepow) >> ringIndex);
        return 1 + ((stepIndex - prepow) / (2 * prepow));
    }

    static getRingPositionByStepIndex(ringsCount: number, stepIndex: number, ringIndex: number) {
        const direction = this.getRingDirection(ringsCount, ringIndex);

        // const prepow = 1 << (ringIndex - 1);
        const prepow = 2 ** (ringIndex - 1);

        if (stepIndex < prepow) {
            return 0;
        }

        // const posIndex = 1 + ((stepIndex - prepow) >> ringIndex);
        const posIndex = 1 + ((stepIndex - prepow) / (2 * prepow));

        return Helpers.getUnsignedModulo(direction * posIndex, 3);
    }

    static getRingIndexByStepIndex(stepIndex: number) {
        // TODO: think
        const ringPrepow = (stepIndex & (stepIndex - 1)) ^ stepIndex;

        return 1 + Math.log2(ringPrepow);
    }

    static getStepByStepIndex(ringsCount: number, stepIndex: number) {
        const ringIndex = this.getRingIndexByStepIndex(stepIndex);

        return new Step(
            this.getRingPositionByStepIndex(ringsCount, stepIndex - 1, ringIndex),
            this.getRingPositionByStepIndex(ringsCount, stepIndex, ringIndex),
        );
    }

    static getStateByStepIndex(ringsCount: number, stepIndex: number) {
        const axes: Axes = [[], [], []];

        let ringIndex = ringsCount;
        while (ringIndex > 0) {
            axes[this.getRingPositionByStepIndex(ringsCount, stepIndex, ringIndex)].push(ringIndex);
            --ringIndex;
        }

        return new State(axes, ringsCount);
    }

    static getStepsCountByRingsCount(ringsCount: number) {
        // return (1 << ringsCount) - 1;
        return (2 ** ringsCount) - 1;
    }

    static getStepIndexByRightState(state: State) {
        const ringsCount = state.ringsCount;
        const stepsCount = this.getStepsCountByRingsCount(ringsCount);
        const remainStepsCount = this.getStepsCountByRingsCount(state.axes[2].at(-1) - 1);
        
        return stepsCount - remainStepsCount;
    }

    static getStateInfo(state: State) {
        const ringsCount = state.ringsCount;
        const posMods = new Array<number>(ringsCount);
        const mins = new Array<number>(ringsCount).fill(0);

        for (let i = 0; i < 3; ++i) {
            for (const ringIndex of state.axes[i]) {
                posMods[ringsCount - ringIndex] = this.getRingModuloAbsolutePositionByPosition(
                    ringsCount, ringIndex, i,
                );
            }
        }

        const stepsCount = this.getStepsCountByRingsCount(ringsCount);
        const middleStepIndex = this.getStepsCountByRingsCount(ringsCount - 1);

        if (posMods[0] === 2) {
            return {
                isClassicState: false,
                closestStepIndex: middleStepIndex,
                closestState: this.getStateByStepIndex(ringsCount, middleStepIndex),
            };
        }

        mins[0] = posMods[0];
        let closestStepIndex = mins[0];
        let isClassicState = true;

        for (let i = 1; i < ringsCount; ++i) {
            const mod = posMods[i];
            const prev2 = mins[i - 1] * 2;
            const prev2Mod = prev2 % 3;
            mins[i] = prev2 + Helpers.getUnsignedModulo((mod - prev2Mod + 1), 3) - 1;
            closestStepIndex += mins[i];

            if (closestStepIndex > stepsCount) {
                closestStepIndex = middleStepIndex;
                break;
            }
        }

        const closestState = this.getStateByStepIndex(ringsCount, closestStepIndex);

        return {
            isClassicState: isClassicState && state.isEquals(closestState),
            closestStepIndex,
            closestState,
        };
    }

    static generateNextStepsFromStepIndex(ringsCount: number, baseStepIndex: number) {
        const stepsCount = this.getStepsCountByRingsCount(ringsCount);
        const result = new Array<Step>(stepsCount - baseStepIndex);
        ++baseStepIndex;

        for (let i = 0; i < result.length; ++i) {
            result[i] = this.getStepByStepIndex(ringsCount, baseStepIndex + i);
        }

        return result;
    }
}


interface CountingInfo {
    readonly ringsCount: number;
    cpos: number[];
    tpos: number[];
    stepIndex: number;
}

export class Recursive {
    static getOtherPosition(p1: number, p2: number) {
        return (3 - (p1 + p2)) % 3;
    }

    private static _getCountingInfo(source: State, target: State, stepIndex = 0): CountingInfo {
        return {
            ringsCount: source.ringsCount,
            cpos: source.getReverseRingsPositions(),
            tpos: target.getReverseRingsPositions(),
            stepIndex,
        };
    }

    private static _subRGSC(i: CountingInfo, ci: number, tp: number) {
        if (ci >= i.ringsCount) {
            return;
        }

        if (tp === i.cpos[ci]) {
            this._subRGSC(i, ci + 1, tp);
        } else {
            this._subRGSC(i, ci + 1, this.getOtherPosition(i.cpos[ci], tp));

            const ringIndex = i.ringsCount - ci;
            // const count = (1 << (ringIndex - 1));
            const count = (2 ** (ringIndex - 1));
            i.stepIndex += count;

            for (let k = ci; k < i.ringsCount; ++k) {
                i.cpos[k] = tp;
            }
        }
    }

    static recGetStepsCount(source: State, target: State) {
        const i = this._getCountingInfo(source, target);

        for (
            let ci = Helpers.getArrayDiffIndex(i.cpos, i.tpos);
            ci < i.ringsCount;
            ci = Helpers.getArrayDiffIndex(i.cpos, i.tpos, ++ci)
        ) {
            this._subRGSC(i, ci + 1, this.getOtherPosition(i.cpos[ci], i.tpos[ci]));
            i.cpos[ci] = i.tpos[ci];
            ++i.stepIndex;
        }

        return i.stepIndex;
    }

    private static _subRGSPBSI(i: CountingInfo, ci: number, tp: number): Step {
        if (ci >= i.ringsCount) {
            return null;
        }

        if (tp === i.cpos[ci]) {
            return this._subRGSPBSI(i, ci + 1, tp);
        }

        const res = this._subRGSPBSI(i, ci + 1, this.getOtherPosition(i.cpos[ci], tp));
        if (res) return res;

        const cp = i.cpos[ci];
        i.cpos[ci] = tp;
        --i.stepIndex;

        if (i.stepIndex < 1) {
            return new Step(cp, tp);
        }

        const ringIndex = i.ringsCount - ci;
        // const count = (1 << (ringIndex - 1)) - 1;
        const count = (2 ** (ringIndex - 1)) - 1;

        if (count > i.stepIndex) {
            return this._subRGSPBSI(i, ci + 1, tp);
        }

        i.stepIndex -= count;
        const curLastPos = i.cpos[i.ringsCount - 1];
        for (let k = ci + 1; k < i.ringsCount; ++k) {
            i.cpos[k] = tp;
        }

        if (i.stepIndex < 1) {
            const classicPreLastPos = Classic.getRingPositionByStepIndex(ringIndex - 1, count - 1, 1);
            return new Step(
                classicPreLastPos ? this.getOtherPosition(curLastPos, tp) : curLastPos,
                tp,
            );
        }

        return null;
    }

    static _recGetStepPositionsByStepIndex(source: State, target: State, stepIndex: number) {
        if (stepIndex < 1) {
            return {
                step: null,
                positions: source.getReverseRingsPositions(),
            };
        }

        const i = this._getCountingInfo(source, target, stepIndex);

        let step: Step;

        for (
            let ci = Helpers.getArrayDiffIndex(i.cpos, i.tpos);
            ci < i.ringsCount;
            ci = Helpers.getArrayDiffIndex(i.cpos, i.tpos, ++ci)
        ) {
            step = this._subRGSPBSI(i, ci + 1, this.getOtherPosition(i.cpos[ci], i.tpos[ci]));
            if (step) break;

            const cp = i.cpos[ci];
            i.cpos[ci] = i.tpos[ci];
            --i.stepIndex;

            if (i.stepIndex < 1) {
                step = new Step(cp, i.tpos[ci]);
                break;
            }
        }

        return {
            step,
            positions: i.cpos,
        };
    }

    static recGetStepStateByStepIndex(source: State, target: State, stepIndex: number) {
        const res = this._recGetStepPositionsByStepIndex(source, target, stepIndex);
        return {
            step: res.step,
            state: State.createFromReversePositions(res.positions),
        };
    }

    static recGetStepByStepIndex(source: State, target: State, stepIndex: number) {
        return this._recGetStepPositionsByStepIndex(source, target, stepIndex).step;
    }

    static recGetStateByStepIndex(source: State, target: State, stepIndex: number) {
        return State.createFromReversePositions(
            this._recGetStepPositionsByStepIndex(source, target, stepIndex).positions,
        );
    }

    static recGenerateNextStepsFromStepIndex(
        source: State, target: State,
        stepIndex: number,
        stepsCount = this.recGetStepsCount(source, target),
    ) {
        const steps: Step[] = [];

        for (let i = stepIndex; i < stepsCount; ++i) {
            steps.push(this.recGetStepByStepIndex(source, target, i + 1));
        }

        return steps;
    }

    private static _subRGSBSs(ci: number, tp: number, cpos: number[], steps: Step[], entryPoint = false) {
        const isNotLast = ci < cpos.length - 1;

        if (tp !== cpos[ci]) {
            isNotLast && this._subRGSBSs(ci + 1, this.getOtherPosition(cpos[ci], tp), cpos, steps);

            steps.push(new Step(cpos[ci], tp));
            cpos[ci] = tp;

            if (entryPoint) {
                return;
            }
        }

        isNotLast && this._subRGSBSs(ci + 1, tp, cpos, steps);
    }

    static recGenerateAllSteps(source: State, target: State) {
        const { ringsCount, cpos, tpos } = this._getCountingInfo(source, target);

        const steps: Step[] = [];

        for (
            let ci = Helpers.getArrayDiffIndex(cpos, tpos);
            ci < ringsCount;
            ci = Helpers.getArrayDiffIndex(cpos, tpos, ++ci)
        ) { 
           this._subRGSBSs(ci, tpos[ci], cpos, steps, true);
        }

        return steps;
    }
}
