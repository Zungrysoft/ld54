import { assets } from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as game from './core/game.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'

export default class Pickup extends Thing {
  time = 0
  height = 32
  texture = "square"
  mesh = "cube"
  scale = 1.0
  pickupSound = ""

  constructor (position) {
    super()
    this.position = position
  }

  update () {
    super.update()
    this.time += 1

    const player = game.getThing('player')
    this.player = player

    if (vec3.distance(this.position, player.position) < 4) {
      this.onPickup(player)
      this.dead = true
    }
  }

  onPickup (other) {}

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('modelMatrix', mat.getTransformation({
      translation: vec3.add(this.position, [0, 0, Math.sin(this.time / 30) / 4]),
      rotation: [Math.PI/2, 0, this.time * 0.05],
      scale: [this.scale, this.scale, this.scale]
    }))
    gfx.setTexture(assets.textures[this.texture])
    gfx.drawMesh(assets.meshes[this.mesh])
  }
}
