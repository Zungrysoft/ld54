import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'
import * as vox from './voxel.js'
import Wasp from './wasp.js'

export default class Bullet extends Thing {
  time = 0
  aabb = [-8, -8, 8, 8]
  damage = 20

  constructor (position = [0, 0, 0], velocity = [0, 0, 0], owner, damage = 20) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
    this.owner = owner
    this.spawnPosition = [...this.position]
    this.damage = damage
  }

  update () {
    let chunks = game.getThing('terrain').chunks

    this.time += 1

    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]

    const player = game.getThing('player')

    for (const thing of this.getAllThingCollisions()) {
      if (!('health' in thing)) continue
      if (thing === this.owner) continue
      const hitRadius = thing.hitRadius ?? 1.5
      if (vec3.distance(this.position, thing.position) < hitRadius) {
        thing.health -= this.damage
        if (thing.onDamage) { thing.onDamage() }
        this.dead = true
      }
    }

    if (this.time > 120) {
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
    gfx.set('color', [1.0, 0.5, 0.0, 1.0])
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
