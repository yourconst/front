import { PromiseManaged } from "./Promise";

export abstract class ArrayBufferHelpers {
    static toDataUrl(buffer: ArrayBuffer, mime?: string/*  = 'application/octet-binary' */) {
        const blob = new Blob([buffer], mime ? { type: mime } : undefined);
        const reader = new FileReader();

        const promise = new PromiseManaged<string>();

        reader.onload = (e) => {
            promise.resolve(<string> e.target.result);
        };
        reader.onerror = (e) => {
            promise.reject(e);
        };
        reader.readAsDataURL(blob);

        return promise.promise;
    }

    static concat(...buffers: ArrayBuffer[]) {
        const ui8a = new Uint8Array(
            buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0),
        );

        let offset = 0;

        for (const buffer of buffers) {
            ui8a.set(new Uint8Array(buffer), offset);

            offset += buffer.byteLength;
        }
        
        return ui8a.buffer;
    }
}
