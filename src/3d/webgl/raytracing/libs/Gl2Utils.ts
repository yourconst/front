type Gl2ShaderType = WebGL2RenderingContext['VERTEX_SHADER'] |
    WebGL2RenderingContext['FRAGMENT_SHADER'];

export class Gl2Utils {
    constructor(public gl: WebGL2RenderingContext) { }


    compileShader(source: string, type: Gl2ShaderType) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source.trim());
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log(this.gl.getShaderInfoLog(shader));
            throw "Shader compile failed with: " + this.gl.getShaderInfoLog(shader);
        }

        return shader;
    }

    createProgram(options = {
        shaders: <WebGLShader[]>[],
        use: true,
    }) {
        const program = this.gl.createProgram();

        if (options.shaders) {
            for (const shader of options.shaders) {
                this.gl.attachShader(program, shader);
            }
        }

        this.gl.linkProgram(program);

        if (options.use) {
            this.gl.useProgram(program);
        }

        return program;
    }

    getAttribLocation(program: WebGLProgram, name: string) {
        const attributeLocation = this.gl.getAttribLocation(program, name);
        if (attributeLocation === -1) {
          throw "Cannot find attribute " + name + ".";
        }
        return attributeLocation;
    }

    getUniformLocation(program: WebGLProgram, name: string) {
        const attributeLocation = this.gl.getUniformLocation(program, name);
        if (attributeLocation === -1) {
          throw "Cannot find attribute " + name + ".";
        }
        return attributeLocation;
    }

    bindBuffer(buffer: BufferSource, usage = this.gl.STATIC_DRAW) {
        const glBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, usage);

        return glBuffer;
    }

    getUniformBuffer(buffer: BufferSource, program: WebGLProgram, name: string) {
        const boundLocation = this.gl.getUniformBlockIndex(program, name);

        const glBuffer = this.gl.createBuffer();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, boundLocation, glBuffer);

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);

        return glBuffer;
    }

    updateUniformBuffer(glBuffer: WebGLBuffer, buffer: BufferSource) {
        // console.log(glBuffer, buffer);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
        // this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, <any> buffer, 0, 16);
        // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    }
}
