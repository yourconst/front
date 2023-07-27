import { CustomAudioNode } from "./CustomAudioNode";
import { ChangeableSource } from "./Source/ChangeableSource";

export class Actx extends CustomAudioNode {
    static tryGetActx(context: AudioContext) {
        if (context instanceof Actx) {
            return context;
        }
        if (context['actx'] instanceof Actx) {
            return context['actx'];
        }
        return null;
    }

    constructor() {
        super(new AudioContext());
        this.context['actx'] = this;
    }

    async destructor() {
        await this.context.close();
        this.destination.disconnect();
    }

    protected getNodeIn() {
        return this.destination;
    }
    protected getNodeOut;


    createChangeableSource() {
        return new ChangeableSource(this.context);
    }


    get destination() { return this.context.destination; }
    get state() { return this.context.state; }

    async resume() {
        if (this.state !== 'running') {
            return;
        }
        await this.context.resume();
    }
    async suspend() {
        await this.context.suspend();
    }
}
