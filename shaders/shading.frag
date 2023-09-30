precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec3 normal;
varying vec2 uv;

void main() {
  vec2 newuv = vec2(uv.x, 1.0 - uv.y);
  vec4 result = texture2D(texture, newuv) * color;
  if (result.a == 0.0) { discard; }
  result.rgb *= mix(0.75, 1.0, normal.x * 0.5 + 0.5);
  result.rgb *= mix(0.5, 1.0, normal.z * 0.5 + 0.5);
  gl_FragColor = result;
}
