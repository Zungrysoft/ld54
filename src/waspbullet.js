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

export default class WaspBullet extends Thing {
  time = 0

  constructor (position = [0, 0, 0], velocity = [0, 0, 0]) {
    super()

    this.position = position
    this.velocity = velocity
    this.spawnPosition = [...this.position]
  }

  update () {
    let chunks = game.getThing("terrain").chunks

    this.time ++

    this.position = vec3.add(this.position, this.velocity)

    let player = game.getThing("player")

    // Check for player
    if (vec3.distance(this.position, player.position) < 1.2 || vec3.distance(this.position, vec3.add(player.position, [0, 0, 2])) < 1.2) {
      player.takeDamage(20)
      this.dead = true
    }

    // Check for wall
    let vPos = this.position.map(x => Math.round(x))
    if (vox.getVoxelSolid(chunks, vPos)) {
      this.break(chunks, vPos)
      this.dead = true
    }
  }

  break(chunks, vPos) {
    let radius = 2
    for (let x = -radius; x <= radius; x ++) {
      for (let y = -radius; y <= radius; y ++) {
        for (let z = -radius; z <= radius; z ++) {
          let newPos = vec3.add(vPos, [x, y, z])
          let breakChance = (radius - vec3.distance(newPos, vPos)) / radius
          if (breakChance > Math.random()) {
            vox.setVoxelSolid(chunks, newPos, false)
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
      rotation: [Math.PI/2, 0, 0],
      scale: 0.3
    }))
    gfx.setTexture(assets.textures.wasp)
    gfx.drawMesh(assets.meshes.gib)
  }

  // TODO: Finish this
  onDeath () {

  }
}
