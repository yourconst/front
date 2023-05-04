import { Helpers } from '../../../helpers/common';
import InfoComponent from './InfoComponent.svelte';

export class Info {
    private component: InfoComponent;
    readonly sleeper: typeof Helpers['SleeperChanging']['prototype'];
    private _untilNext = false;

    constructor(options?: {
        target?: HTMLElement;
        style?: string;
        duration?: number;
    }) {
        this.component = new InfoComponent({
            target: options?.target || document.body,
            props: {
                style: options?.style,
            },
        });

        this.sleeper = new Helpers.SleeperChanging(options?.duration || 3000);
    }

    destroy() {
        this.component.$destroy();
        this.component = null;
    }

    show(text: string, untilNext = false) {
        this._untilNext = untilNext;
        this.component?.show(text);

        if (this.component && !this._untilNext) {
            if (this.sleeper.isActive) {
                this.sleeper.extend();
            } else {
                this.sleeper.sleep().then(() => {
                    if (!this._untilNext) {
                        this.component?.hide();
                    }
                });
            }
        }
    }

    hideUntilNext() {
        this.component?.hide();
    }
}

