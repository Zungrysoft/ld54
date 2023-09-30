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
  positions = []
  explosionRadius = 2

  constructor (position = [0, 0, 0], velocity = [0, 0, 0], owner) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
    this.owner = owner
    this.spawnPosition = [...this.position]
  }

  update () {
    let chunks = game.getThing('terrain').chunks

    this.time += 1
    this.positions.push([...this.position])
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
      //this.break(chunks, vPos)
      game.addThing(new Explosion(vPos, 3))
      this.dead = true
    }
  }

  break(chunks, vPos) {
    const radius = this.explosionRadius
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
    gfx.setTexture(assets.textures.square)
    gfx.set('color', [1.0, 0.0, 0.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [Math.PI/2, 0, 0],
      scale: 0.3
    }))
    gfx.drawMesh(assets.meshes.sphere)

    for (let i = 0; i < 8; i += 1) {
      const p = vec3.add(this.position, vec3.scale(this.velocity, i * -0.5))
      gfx.set('color', [1, 0, 0, u.map(i, 0, 7, 0.25, 0.05)])
      gfx.set('modelMatrix', mat.getTransformation({
        translation: p,
        rotation: [Math.PI/2, 0, 0],
        scale: u.map(i, 0, 7, 0.3, 0.1)
      }))
      gfx.drawMesh(assets.meshes.sphere)
    }
  }

  // TODO: Finish this
  onDeath () {

  }
}

class Explosion extends Thing {
  time = 0

  constructor (vPos, radius = 2) {
    super()
    this.position = vPos
    vPos = vPos.map(Math.round)
    this.radius = radius
    this.after(15, () => { this.dead = true }, 'time')
    const { chunks } = game.getThing('terrain')
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

  update () {
    super.update()
    this.time += 1
  }

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.square)
    gfx.set('color', [1, 1, 0, u.squareMap(this.timer('time'), 0, 1, 0.5, 0)])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: this.position,
      scale: u.map(this.time, 0, 2, 0.5, this.radius, true)
    }))
    gfx.drawMesh(assets.meshes.sphere)
  }
}
