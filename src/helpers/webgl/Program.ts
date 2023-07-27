import type { Gl2Utils } from "./Gl2Utils";

export interface Gl2ProgramOptions<
    Attributes extends string,
    Uniforms extends string = null,
    UBOs extends string = null,
> {
    shaders: {
        vertex: string[];
        fragment?: string[];
    };
    attributes: Attributes[];
    uniforms?: Uniforms[];
    ubos?: UBOs[];
}

export class Gl2Program<
    Attributes extends string,
    Uniforms extends string = null,
    UBOs extends string = null,
> {
    program: WebGLProgram;
    readonly shaders = {
        vertex: <WebGLShader[]> [],
        fragment: <WebGLShader[]> [],
    };
    readonly locations = {
        attribute: <Record<Attributes, number>>{},
        uniform: <Record<Uniforms, WebGLUniformLocation>>{},
        ubo: <Record<UBOs, WebGLBuffer>>{},
    };

    constructor(public ut: Gl2Utils, options: Gl2ProgramOptions<Attributes, Uniforms, UBOs>) {
        for (const vs of options.shaders.vertex) {
            this.shaders.vertex.push(this.ut.compileShader(vs, this.ut.gl.VERTEX_SHADER));
        }
        for (const fs of (options.shaders?.fragment || [])) {
            this.shaders.fragment.push(this.ut.compileShader(fs, this.ut.gl.FRAGMENT_SHADER));
        }

        this.program = this.ut.createProgram({
            use: true,
            shaders: [
                ...this.shaders.vertex,
                ...this.shaders.fragment,
            ],
        });

        this._updateLocations(options);

        this.ut.programs.add(this);
    }

    get gl() { return this.ut.gl; }

    private _updateLocations(options?: {
        attributes?: Attributes[];
        uniforms?: Uniforms[];
        ubos?: UBOs[];
    }) {
        for (const an of (options?.attributes || Object.keys(this.locations.attribute))) {
            this.locations.attribute[an] = this.ut.getAttribLocation(this.program, an);
        }

        for (const un of (options?.uniforms || Object.keys(this.locations.uniform))) {
            this.locations.uniform[un] = this.ut.getUniformLocation(this.program, un);
        }

        for (const ubn of (options?.ubos || Object.keys(this.locations.ubo))) {
            this.locations.ubo[ubn] = this.ut.getUniformBuffer(this.program, ubn);
        }
    }

    use() {
        this.ut.gl.useProgram(this.program);
        // this._updateLocations();
        return this;
    }

    destroy() {
        this.ut.gl.deleteProgram(this.program);
        this.ut.programs.delete(this);
        this.program = null;
        this.shaders.vertex = [];
        this.shaders.fragment = [];
        this.locations.attribute = <any> {};
        this.locations.uniform = <any> {};
        this.locations.ubo = <any> {};
    }
}
