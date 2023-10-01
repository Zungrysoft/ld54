import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'
import * as vox from './voxel.js'

export default class Coin extends Thing {
  time = Math.random() * 20

  constructor (position = [0, 0, 0]) {
    super()

    const power = 50
    const powerScale = 0.003
    const verticalScale = 1.0

    this.rot1 = Math.PI * 2 * Math.random()
    this.rot2 = Math.PI * 2 * Math.random()
    this.rotv = (Math.random() - 0.5) * 0.4

    this.position = position
    this.velocity = [
      (Math.random()-0.5) * 0.2,
      (Math.random()-0.5) * 0.2,
      (Math.random() + 1) * 0.0125
    ]
  }

  update () {
    let chunks = game.getThing("terrain").chunks

    this.time ++
    this.position = vec3.add(this.position, this.velocity)
    const friction = 0.975
    this.velocity[0] *= friction
    this.velocity[1] *= friction
    this.velocity[2] = Math.max(this.velocity[2] - 0.001, -0.04)
    this.rot2 += this.rotv

    const player = game.getThing('player')
    if (u.distance([player.position[0], player.position[1], player.position[2] + 2], this.position) <= 5) {
      this.dead = true
      player.coins += 1
      player.after(10, null, 'coinget')
    }

    // Check for wall
    let vPos = this.position.map(x => Math.round(x))
    vPos[2] -= 1
    if (vox.getVoxelSolid(chunks, vPos)) {
      this.velocity[2] = 0
    }

    if (this.time > 60 * 30) {
      this.dead = true
    }
  }

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1.0, 1.0, 0.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [
        this.position[0],
        this.position[1],
        this.position[2] + Math.sin(this.time / 30) * 0.5
      ],
      rotation: this.time / 45,
      scale: [0.5, 0.05, 0.5]
    }))
    gfx.setTexture(assets.textures.square)
    gfx.drawMesh(assets.meshes.sphere)
  }

  // TODO: Finish this
  onDeath () {

  }
}
