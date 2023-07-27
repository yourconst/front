#version 300 es

precision mediump float;

uniform sampler2D sampler;

in vec2 texCoord;

out vec4 color;

void main() {
   color = texture(sampler, texCoord);
}
