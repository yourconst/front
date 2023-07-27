import type { Actx } from "./Actx";

type Direction = 'in' | 'out';

// export interface CustomAudioNode {
//     getNodeIn?(): AudioNode;
//     getNodeOut?(): AudioNode;
// }

export abstract class CustomAudioNode extends EventTarget implements AudioNode {
    static isAudioNode(node: AudioNode) {
        return (node instanceof AudioNode) || (<any> node instanceof CustomAudioNode);
    }

    static tryGetRealAudioNode(node: AudioNode, dir: Direction) {
        while (node instanceof CustomAudioNode) {
            node = dir === 'in' ? node.nodeIn : node.nodeOut;
        }
        if (node instanceof AudioNode) return node;
        return null;
    }

    private _destructed = false;
    get destructed() { return this._destructed; }

    constructor(public readonly context: AudioContext) {
        super();
    }

    destructor() {
        this.disconnect();
        this._destructed = true;
    }

    get actx(): Actx { return this.context['actx']; }

    // protected abstract _contructor?(): void;

    protected abstract getNodeIn?(): AudioNode;
    protected abstract getNodeOut?(): AudioNode;
    
    get nodeIn() {
        const node = this.getNodeIn?.();
        if (!node) {
            throw new Error(`Node ${this.constructor.name} has no inputs`);
        }
        return node;
    }
    get nodeOut() {
        const node = this.getNodeOut?.();
        if (!node) {
            throw new Error(`Node ${this.constructor.name} has no outputs`);
        }
        return node;
    }

    getNodeAny(tryFirst: Direction) {
        if (tryFirst === 'in') {
            return this.getNodeIn?.() || this.getNodeOut?.();
        }
        return this.getNodeOut?.() || this.getNodeIn?.();
    }

    connect(destinationNode: AudioNode, output?: number, input?: number): AudioNode;
    connect(destinationParam: AudioParam, output?: number): void;
    connect(...params: [any, any]): void | AudioNode {
        return this.nodeOut.connect(...params);
    }
    
    disconnect(): void;
    disconnect(output: number): void;
    disconnect(destinationNode: AudioNode): void;
    disconnect(destinationNode: AudioNode, output: number): void;
    disconnect(destinationNode: AudioNode, output: number, input: number): void;
    disconnect(destinationParam: AudioParam): void;
    disconnect(destinationParam: AudioParam, output: number): void;
    disconnect(...params: []): void {
        this.getNodeOut()?.disconnect(...params);
    }

    get channelCount() { return this.getNodeAny('out').channelCount; }
    set channelCount(v) { this.getNodeAny('out').channelCount = v; }
    get channelCountMode() { return this.getNodeAny('out').channelCountMode; }
    set channelCountMode(v) { this.getNodeAny('out').channelCountMode = v; }
    get channelInterpretation() { return this.getNodeAny('out').channelInterpretation; }
    set channelInterpretation(v) { this.getNodeAny('out').channelInterpretation = v; }

    get numberOfInputs() { return this.getNodeIn?.().numberOfInputs || 0; }
    get numberOfOutputs() { return this.getNodeOut?.().numberOfOutputs || 0; }

    emit(type: string, dict?: {}) {
        this.dispatchEvent(new Event(type));
        return this;
    }
}

AudioNode.prototype['_connect'] ??= AudioNode.prototype.connect;
AudioNode.prototype['_disconnect'] ??= AudioNode.prototype.disconnect;

var _ignoreThisCall = false;

AudioNode.prototype.connect = function (node, ...params) {
    const realNode = CustomAudioNode.tryGetRealAudioNode(node, 'in') || node;
    this['_connect'](realNode, ...params);
    return node;
};
AudioNode.prototype.disconnect = function (...params) {
    const node = params[0];
    if (node) {
        params[0] = CustomAudioNode.tryGetRealAudioNode(node, 'in') || node;
    }
    this['_disconnect'](...params);
};
