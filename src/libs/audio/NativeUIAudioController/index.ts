import { MediaSessionController } from "./MediaSessionController";
import type { NativeUIAudioController } from "./types";

export abstract class NativeUIAudioControllerManager {
    private static _existing?: NativeUIAudioController;

    static get(): NativeUIAudioController {
        NativeUIAudioControllerManager._existing ??= new MediaSessionController();
        return NativeUIAudioControllerManager._existing;
    }
}
