import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'
import * as vox from './voxel.js'
import * as soundmanager from './core/soundmanager.js'
import Wasp from './wasp.js'
import Player from './player.js'

export default class Bullet extends Thing {
  time = 0
  aabb = [-8, -8, 8, 8]
  damage = 20
  explosionRadius = 2

  constructor (position = [0, 0, 0], velocity = [0, 0, 0], owner, damage = 20, explosionRadius=2, scale=1.0) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
    this.owner = owner
    this.spawnPosition = [...this.position]
    this.damage = damage
    this.explosionRadius = explosionRadius
    this.scale = scale
  }

  update () {
    let chunks = game.getThing('terrain').chunks

    this.time += 1

    let prevPosition = [...this.position]
    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]

    // Check for wall
    const traceResult = vox.traceLine(chunks, prevPosition, this.position)
    if (traceResult.hit) {
      this.position = traceResult.position
      game.addThing(new Explosion(this.position, this.explosionRadius))
      this.dead = true
    }

    const player = game.getThing('player')

    for (const thing of this.getAllThingCollisions()) {
      if (!('health' in thing)) continue
      if (thing === this.owner) continue

      let hit = false
      if (thing === player &&
          vec2.distance(this.position, thing.position) < 2 &&
          this.position[2] >= thing.position[2] - 1 &&
          this.position[2] <= thing.position[2] + 5) {
        hit = true
      }

      const hitRadius = thing.hitRadius ?? 1.5
      if (thing !== player &&
          vec3.distance(this.position, thing.position) < hitRadius && !thing.dead) {
        hit = true
      }

      if (hit) {
        if (thing.takeDamage) {
          thing.takeDamage(this.damage, vec3.add(vec3.scale(this.velocity, 2), [0, 0, 0.2]))
        }
        this.dead = true
      }
    }

    if (this.time > 600) {
      this.dead = true
    }
  }

  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.square)
    gfx.set('color', [1.0, 1.0, 1.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [Math.PI/2, 0, 0],
      scale: 0.3 * this.scale
    }))
    gfx.drawMesh(assets.meshes.sphere)

    for (let i = 0; i < 8; i += 1) {
      const p = vec3.add(this.position, vec3.scale(this.velocity, i * -0.5))
      gfx.set('color', [1, 0, 0, u.map(i, 0, 7, 0.25, 0.05)])
      gfx.set('modelMatrix', mat.getTransformation({
        translation: p,
        rotation: [Math.PI/2, 0, 0],
        scale: u.map(i, 0, 7, 0.3, 0.1) * this.scale
      }))
      gfx.drawMesh(assets.meshes.sphere)
    }
  }

  // TODO: Finish this
  onDeath () {

  }
}

export class Explosion extends Thing {
  time = 0

  constructor (vPos, radius = 2) {
    super()
    this.position = vPos
    const player = game.getThing('player')
    if (player) {
      const volume = Math.max(1 - u.distance(player.position, this.position) / 80, 0) ** 2
      const p = u.map(radius, 2, 4, 1, 0.9)
      soundmanager.playSound(['boom1', 'boom2'], u.lerp(0, 0.1, volume), [p * 0.9, p * 1.1])
    }
    vPos = vPos.map(Math.round)
    this.radius = radius
    this.after(15, () => { this.dead = true }, 'time')
    const { chunks } = game.getThing('terrain')
    for (let x = -radius; x <= radius; x ++) {
      for (let y = -radius; y <= radius; y ++) {
        for (let z = -radius; z <= radius; z ++) {
          let newPos = vec3.add(vPos, [x, y, z])
          let breakChance = u.bend((radius - vec3.distance(newPos, vPos)) / radius, 0.7) * 1.5
          if (breakChance > Math.random()) {
            vox.setVoxelSolid(chunks, newPos, false)
          }
        }
      }
    }

    const playerPosition = [player.position[0], player.position[1], player.position[2] + 2]
    if (u.distance(this.position, playerPosition) <= this.radius + 2) {
      const push = vec3.normalize(vec3.subtract(playerPosition, this.position))
      player.velocity[0] += push[0] * 0.3
      player.velocity[1] += push[1] * 0.3
      player.velocity[2] += push[2] * 0.6
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
