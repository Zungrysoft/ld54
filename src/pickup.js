import { assets } from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as game from './core/game.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as soundmanager from './core/soundmanager.js'
import { ItemParticle } from './particle.js'

export default class Pickup extends Thing {
  time = 0
  height = 32
  texture = "square"
  mesh = "cube"
  scale = 1.0
  pickupSound = ""
  velocity = [0, 0, 0]

  constructor (position, tentative=false) {
    super()
    this.position = position
    this.tentative = tentative
  }

  update () {
    super.update()
    this.time += 1

    const player = game.getThing('player')
    this.player = player

    // Falling
    this.position = vec3.add(this.position, this.velocity)
    const friction = 0.975
    this.velocity[0] *= friction
    this.velocity[1] *= friction
    if (this.velocity[2] > -0.04) {
      this.velocity[2] -= 0.001
    }
    if (this.velocity[2] < -0.06) {
      this.velocity[2] += 0.001
    }

    // Kill if fell out of world
    if (this.position[2] < -20) {
      this.dead = true
    }

    // Check for wall
    let chunks = game.getThing("terrain").chunks
    let vPos = this.position.map(x => Math.round(x))
    vPos[2] -= 1
    // Floor
    if (vox.getVoxelSolid(chunks, vPos)) {
      this.velocity[2] = 0
    }
    // Stuck in wall
    if (vox.getVoxelSolid(chunks, vec3.add(vPos, [0, 0, 1]))) {
      this.position[2] += 1
    }


    // Particles
    if (this.time % 16 === 0) {
      game.addThing(new ItemParticle(this.position))
    }

    // Hit detection
    if (vec3.distance(this.position, vec3.add(player.position, [0, 0, 2])) < 4) {
      this.onPickup(player)
      this.dead = true
    }
  }

  onPickup (other) {}

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1.0, 1.0, 1.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: vec3.add(this.position, [0, 0, Math.sin(this.time / 30) / 4]),
      rotation: [Math.PI/2, 0, this.time * 0.05],
      scale: [this.scale, this.scale, this.scale]
    }))
    gfx.setTexture(assets.textures[this.texture])
    gfx.drawMesh(assets.meshes[this.mesh])
  }
}
