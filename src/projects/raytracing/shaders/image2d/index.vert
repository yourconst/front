#version 300 es

in vec2 position;

out vec2 texCoord;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    texCoord = 0.5 * (position + 1.0);
}
