import { PromiseManaged, PromiseManagedTimeouted } from './Promise';
import { ArrayBufferHelpers } from "./ArrayBuffer";
import { DateHelpers } from "./Date";
import { ExecutionHelpers } from "./Execution";
import { NumberUnitFormatter } from "./NumberUnitFormatter";
import { SleeperChanging } from './SleeperChanging';
import { FetchHelpers } from './Fetch';
import { BaseHelpers } from './Base';
import { PeriodCountLimiterRunner } from './PeriodCountLimiterRunner';
import { PlatformHelpers } from './Platform';
import { CanvasHelpers } from './Canvas';
import { Algorithms } from '../../libs/algorithms';

export abstract class Helpers {
    static readonly Base = BaseHelpers;
    static readonly PromiseManaged = PromiseManaged;
    static readonly PromiseManagedTimeouted = PromiseManagedTimeouted;
    static readonly SleeperChanging = SleeperChanging;
    static readonly NumberUnitFormatter = NumberUnitFormatter;
    static readonly Date = DateHelpers;
    static readonly ArrayBuffer = ArrayBufferHelpers;
    static readonly Execution = ExecutionHelpers;
    static readonly Fetch = FetchHelpers;
    static readonly PeriodCountLimiterRunner = PeriodCountLimiterRunner;
    static readonly Platform = PlatformHelpers;
    static readonly Canvas = CanvasHelpers;
    static readonly Algorithms = Algorithms;

    static readonly sleep = BaseHelpers.sleep;
    static readonly rand = BaseHelpers.rand;
    static readonly randInt = BaseHelpers.randInt;
    static readonly isPow2 = BaseHelpers.isPow2;
    static readonly getbiti32 = BaseHelpers.getbiti32;
    static readonly fract = BaseHelpers.fract;
    static readonly pnrandf = BaseHelpers.pnrandf;
    static readonly pnrandi30 = BaseHelpers.pnrandi30;
    static readonly psrandf = BaseHelpers.psrandf;
    static readonly psrandi30 = BaseHelpers.psrandi30;
    static readonly randElement = BaseHelpers.randElement;
    static readonly capitalizeFirstLetter = BaseHelpers.capitalizeFirstLetter;
}

globalThis['Helpers'] = Helpers;
