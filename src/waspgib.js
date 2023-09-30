import {
  ctx,
  globals,
  mouse,
} from './core/game.js'
import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'
import * as vox from './voxel.js'

export default class WaspGib extends Thing {
  time = 0

  constructor (position = [0, 0, 0], power = 100) {
    super()

    power += 90
    const powerScale = 0.003
    const verticalScale = 2.0

    this.rot1 = Math.PI * 2 * Math.random()
    this.rot2 = Math.PI * 2 * Math.random()
    this.rotv = (Math.random() - 0.5) * 0.4

    this.position = position
    this.velocity = [
      (Math.random()-0.5) * power * powerScale,
      (Math.random()-0.5) * power * powerScale,
      Math.random() * power * powerScale * verticalScale,
    ]
  }

  update () {
    let chunks = game.getThing("terrain").chunks

    this.time ++

    this.position = vec3.add(this.position, this.velocity)

    this.velocity[2] -= 0.025

    this.rot2 += this.rotv

    // Check for wall
    let vPos = this.position.map(x => Math.round(x))
    if (vox.getVoxelSolid(chunks, vPos)) {
      this.paint(chunks, vPos)
      this.dead = true
    }

    if (this.time > 300) {
      this.dead = true
    }
  }

  paint(chunks, vPos) {
    let radius = 2
    for (let x = -radius; x <= radius; x ++) {
      for (let y = -radius; y <= radius; y ++) {
        for (let z = -radius; z <= radius; z ++) {
          let newPos = vec3.add(vPos, [x, y, z])
          let paintChance = (radius - vec3.distance(newPos, vPos)) / radius
          if (paintChance > Math.random()) {
            vox.setVoxelMaterial(chunks, newPos, "rune")
          }
        }
      }
    }
  }

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1.0, 0.0, 0.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [this.rot1, this.rot2, 0],
      scale: 0.7
    }))
    gfx.setTexture(assets.textures.wasp)
    gfx.drawMesh(assets.meshes.gib)
  }

  // TODO: Finish this
  onDeath () {

  }
}
