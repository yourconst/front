#version 300 es
#ifdef GL_ES
precision mediump float;
#endif

out vec4 color;

void main() {
    color = vec4(vec3(0.5) - color.xyz, 0.3);
}
