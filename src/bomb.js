import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import WaspGib from './waspgib.js'
import HoneycombPickup from './pickuphoneycomb.js'
import { Explosion } from './bullet.js'

export default class Bomb extends Thing {
  time = 0
  aabb = [-2, -2, 2, 2]
  hitRadius = 2.5
  explosionPower = 15
  spawnCoin = true
  scale = 0.5
  health = 100
  color = [0.9,0,0.3,1]
  explosionAnims = 3
  shouldGib = true

  constructor (position = [0, 0, 0], angle = 0) {
    super()
    this.growScale = 0.0
    this.position = position
    this.targetPosition = this.chooseTarget()
    this.spawnPosition = [...this.position]
    this.lookAngle = 0
    this.angle1 = Math.random() * Math.PI * 2
    this.angle2 = Math.random() * Math.PI * 2
  }

  update () {
    super.update()

    this.time ++

    // Rotate
    this.angle1 += 0.01
    this.angle2 += 0.03

    // Move toward target
    if (this.targetPosition) {
      if (this.time % 5 == 0 && vec3.distance(this.position, this.targetPosition) < 2) {
        // If reached destination, explode!
        this.targetPosition = undefined
        this.after(40, () => this.prepareToExplode(), "prepare")
      }
      else {
        const vel = vec3.scale(vec3.normalize(vec3.subtract(this.targetPosition, this.position)), 0.04)
        this.position = vec3.add(this.position, vel)
      }
    }

    // Grow from zero
    this.growScale = Math.min(this.growScale + 0.03, 1.0)
  }

  prepareToExplode() {
    if (this.explosionAnims <= 1) {
      // Explode!
      this.shouldGib = false
      this.dead = true
      game.addThing(new Explosion([...this.position], this.explosionPower))
    }
    else {
      this.explosionAnims --
      this.after(40, () => this.prepareToExplode(), "prepare")
    }
  }

  checkInVoxel() {
    const vPos = this.position.map(x => Math.round(x))
    let chunks = game.getThing("terrain").chunks

    const deltas =  [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]
    for (const delta of deltas) {
      if (vox.getVoxelSolid(chunks, vec3.add(vPos, delta))) {
        return true
      }
    }
    return false
  }

  chooseTarget() {
    // Choose a random solid voxel near the center of the map

    let chunks = game.getThing("terrain").chunks

    const iterations = 200
    for (let i = 0; i < iterations; i ++) {
      const checkPos = [
        Math.floor(Math.random()*80) + 20,
        Math.floor(Math.random()*40) + 20,
        Math.floor(Math.random()*10) + 35,
      ]

      // Make sure the voxel is solid and that it won't explode too soon after spawning
      if (vox.getVoxelSolid(chunks, checkPos)) {
        const traceResult = vox.traceLine(chunks, this.position, checkPos)
        if (traceResult.distance > 30) {
          return traceResult.position
        }
      }
    }

    return [60, 40, 40]
  }

  draw () {
    const startle = this.timers.damage ? u.map((1 - this.timer('damage')) ** 2, 1, 0, 0, 1) : 1
    const prepare = this.timers.prepare ? u.map((1 - this.timer('prepare')) ** 2, 1, 0, 0, 1) : 1
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()

    const lerpedColor = vec3.lerp([1.0, 1.0, 0.6], this.color, prepare)

    if (this.timer('damage')) {
      gfx.set('color', [1,1,1,1])
    } else {
      gfx.set('color', [...lerpedColor, 1.0])
    }
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [this.angle1, this.angle2, 0],
      scale: [
        u.lerp(1.5, 1, startle) * u.lerp(0.7, 1, prepare) * this.growScale * this.scale,
        u.lerp(2.5, 1, startle) * u.lerp(0.7, 1, prepare) * this.growScale * this.scale,
        u.lerp(1.5, 1, startle) * u.lerp(0.7, 1, prepare) * this.growScale * this.scale,
      ]
    }))
    gfx.setTexture(assets.textures.square)
    gfx.drawMesh(assets.meshes.bomb)
  }

  takeDamage (dmg) {
    if (dmg > 0) {
      this.after(10, null, 'damage')
    }
    this.health -= dmg
    if (this.health < 1) {
      this.dead = true
    }
  }

  // TODO: Finish this
  onDeath () {
    // Throw gibs
    if (this.shouldGib) {
      for (let i = 0; i < 12; i ++) {
        game.addThing(new WaspGib([...this.position], -this.health, this.color))
      }
    }
  }
}
