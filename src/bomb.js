import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as soundmanager from './core/soundmanager.js'
import WaspGib from './waspgib.js'
import HoneycombPickup from './pickuphoneycomb.js'
import { Explosion } from './bullet.js'
import Wasp from './wasp.js'

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
  gibCount = 7

  constructor (position = [0, 0, 0], angle = 0) {
    super()
    this.growScale = 0.0
    this.position = position
    this.targetPosition = this.chooseTarget()
    this.spawnPosition = [...this.position]
    this.lookAngle = 0
    this.angle1 = Math.random() * Math.PI * 2
    this.angle2 = Math.random() * Math.PI * 2

    // Sound effect
    const player = game.getThing('player')
    if (player) {
      const v = player.scaleVolume(this.position)
      soundmanager.playSound('appear', 0.5 * v, [0.8, 1.0])
    }
  }

  update () {
    super.update()

    this.time ++

    // Rotate
    this.angle1 += 0.01
    this.angle2 += 0.03

    // Move toward target
    if (this.targetPosition) {
      if (this.time % 5 == 0 && vec3.distance(this.position, this.targetPosition) < 3) {
        // If reached destination, explode!
        this.targetPosition = undefined
        this.prepareToExplode()
      }
      else {
        const vel = vec3.scale(vec3.normalize(vec3.subtract(this.targetPosition, this.position)), 0.06)
        this.position = vec3.add(this.position, vel)
      }
    }

    // Grow from zero
    this.growScale = Math.min(this.growScale + 0.03, 1.0)
  }

  prepareToExplode() {
    if (this.explosionAnims <= 0) {
      // Explode!
      this.gibCount = 0
      this.spawnCoin = false
      this.dead = true
      game.addThing(new Explosion([...this.position], this.explosionPower))
    }
    else {
      const player = game.getThing('player')
      if (player) {
        const v = player.scaleVolume(this.position)
        soundmanager.playSound('warn', 0.35 * v + 0.1, [1.2, 1.2])
      }
      this.explosionAnims --
      this.after(50, () => this.prepareToExplode(), "prepare")
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

    const iterations = 600
    for (let i = 0; i < iterations; i ++) {
      const checkPos = [
        Math.floor(Math.random()*80) + 20,
        Math.floor(Math.random()*40) + 20,
        Math.floor(Math.random()*10) + 38,
      ]

      // Make sure the voxel is solid and that it won't explode too soon after spawning
      if (vox.getVoxelSolid(chunks, checkPos)) {
        const traceResult = vox.traceLine(chunks, this.position, checkPos)
        if (traceResult.distance > 30) {
          return traceResult.position
        }
      }
    }

    // Could not find a valid target. Kill self and replace with wasp
    this.dead = true
    this.gibCount = 0
    this.spawnCoin = false
    game.addThing(new Wasp(this.position))
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
    soundmanager.playSound('hit3', 0.2, [0.9, 1.1])
  }

  dropCoin() {
    game.addThing(new HoneycombPickup([...this.position]))

    const player = game.getThing('player')
    if (player) {
      const v = player.scaleVolume(this.position)
      soundmanager.playSound('drop', 0.1 * v, [0.8, 0.9])
    }
  }

  onDeath () {
    // Throw gibs
    if (this.gibCount > 0) {
      soundmanager.playSound('kill', 0.3, [0.7, 1.1])
      for (let i = 0; i < this.gibCount; i ++) {
        game.addThing(new WaspGib([...this.position], -this.health, this.color))
      }
    }
    if (this.spawnCoin) {
      if (game.globals.killsUntilDrop <= 1) {
        this.dropCoin()
        game.globals.killsUntilDrop = Math.floor((Math.random() * 3) + 3)
      }
      else {
        game.globals.killsUntilDrop --
      }

      // Can spawn additional honeycomb
      if (this.spawnCoin) {
        if (0.25 > Math.random()) {
          this.dropCoin()
        }
      }
    }
  }
}
