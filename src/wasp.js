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
import Bullet from './bullet.js'
import WaspGib from './waspgib.js'
import HoneycombPickup from './pickuphoneycomb.js'

export default class Wasp extends Thing {
  time = 0
  aabb = [-2, -2, 2, 2]
  hitRadius = 2.5
  explosionPower = 5
  spawnCoin = true
  scale = 1.0
  health = 100
  color = [1,0,0,1]
  bulletScale = 1.0

  constructor (position = [0, 0, 0], angle = 0) {
    super()
    this.growScale = 0.0
    this.position = position
    this.targetPosition = undefined
    this.spawnPosition = [...this.position]
    this.velocity = [0, 0, 0]
    this.lookAngle = 0
    this.checkShoot()
  }

  update () {
    super.update()

    this.time ++

    if (this.targetPosition) {
      // Face target
      this.lookAngle = vec2.lerpAngles(this.lookAngle, vec2.angleBetween(this.position, this.targetPosition), 0.1)

      // Move toward target if too far away
      if (vec3.distance(this.position, this.targetPosition) > 16) {

      }
    }

    // Grow from zero
    this.growScale = Math.min(this.growScale + 0.03, 1.0)
  }

  checkShoot() {
    let chunks = game.getThing("terrain").chunks

    // If the targeted voxel is destroyed, find a new voxel to target
    if (!this.targetPosition || !vox.getVoxelSolid(chunks, this.targetPosition, {index:0})) {
      this.targetPosition = this.pickNearbyVoxel()
    }
    // Otherwise, shoot it!
    else {
      this.shoot()
    }

    // checkShoot again after a random amount of time
    this.after(Math.floor(45 + Math.random()*30), () => this.checkShoot())
  }

  shoot() {
    let bulletPos = [...this.position]
    let bulletVel = vec3.scale(vec3.normalize(vec3.subtract(this.targetPosition, this.position)), 0.3)
    game.addThing(new Bullet(bulletPos, bulletVel, this, 20, this.explosionPower, this.bulletScale))
  }

  pickNearbyVoxel() {
    let chunks = game.getThing("terrain").chunks

    function getAirScore(chunks, pos) {
      let score = 0
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [1, 0, 0]))) {score += 1}
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [-1, 0, 0]))) {score += 1}
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [0, 1, 0]))) {score += 1}
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [0, -1, 0]))) {score += 1}
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [0, 0, 1]))) {score += 3}
      if (!vox.getVoxelSolid(chunks, vec3.add(pos, [0, 0, -1]))) {score += 1}
      return score
    }

    const thisPos = this.position.map(x => Math.round(x))
    const searchDistance = 32
    const searchHeightHigh = 4
    const searchHeightLow = -32
    let x = 0
    let y = 0

    let bestScore = Number.NEGATIVE_INFINITY
    let bestPos = undefined

    const turns = (searchDistance * 4) + 1
    for (let t = 0; t < turns; t ++) {
      const steps = Math.floor(t/2) + 1

      // Early exit if we've found a "good enough" target
      if (t/4 > 6 && bestScore >= 5) {
        return bestPos
      }
      if (t/4 > 12 && bestScore >= 3) {
        return bestPos
      }
      if (t/4 > 18 && bestScore >= 0) {
        return bestPos
      }

      for (let s = 0; s < steps; s ++) {
        for (let z = searchHeightLow; z <= searchHeightHigh; z ++) {
          const checkPos = vec3.add(thisPos, [x, y, z])

          if (vox.getVoxelSolid(chunks, checkPos)) {
            const airScore = getAirScore(chunks, checkPos)
            if (airScore > bestScore) {
              bestScore = airScore
              bestPos = checkPos
            }
          }
        }

        // Step in direction
        if (t % 4 === 0) x ++;
        else if (t % 4 === 1) y ++;
        else if (t % 4 === 2) x --;
        else if (t % 4 === 3) y --;
      }
    }

    return bestPos
  }

  draw () {
    let frameModel = "wasp2"
    if (this.time % 4 === 0) {
      frameModel = "wasp1"
    }
    else if (this.time % 4 === 2) {
      frameModel = "wasp3"
    }

    const startle = this.timers.damage ? u.map((1 - this.timer('damage')) ** 2, 1, 0, 0, 1) : 1
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    if (this.timer('damage')) {
      gfx.set('color', [1,1,1,1])
    } else {
      gfx.set('color', this.color)
    }
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [Math.PI/2, 0, this.lookAngle + Math.PI/2],
      scale: [
        u.lerp(1.5, 1, startle) * this.growScale * this.scale,
        u.lerp(2.5, 1, startle) * this.growScale * this.scale,
        u.lerp(1.5, 1, startle) * this.growScale * this.scale,
      ]
    }))
    gfx.setTexture(assets.textures.wasp)
    gfx.drawMesh(assets.meshes[frameModel])
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
    for (let i = 0; i < 7; i ++) {
      game.addThing(new WaspGib([...this.position], -this.health))
    }
    if (this.spawnCoin) {
      if (game.globals.killsUntilDrop <= 1) {
        game.addThing(new HoneycombPickup([...this.position]))
        game.globals.killsUntilDrop = Math.floor((Math.random() * 3) + 3)
      }
      else {
        game.globals.killsUntilDrop --
      }
    }
  }
}
