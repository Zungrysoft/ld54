precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec2 uv;

void main() {
  vec2 newuv = vec2(uv.x, 1.0 - uv.y);
  vec4 result = texture2D(texture, newuv) * color;
  if (result.a == 0.0) { discard; }
  gl_FragColor = result;
}
