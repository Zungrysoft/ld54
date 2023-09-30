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

export default class Wasp extends Thing {
  time = 0
  aabb = [-2, -2, 2, 2]
  hitRadius = 2.5

  constructor (position = [0, 0, 0], angle = 0) {
    super()

    console.log("WASP")

    this.health = 100
    this.growScale = 0.0
    this.position = position
    this.targetPosition = undefined
    this.spawnPosition = [...this.position]
    this.velocity = [0, 0, 0]
    this.lookAngle = 0
  }

  update () {
    super.update()
    let chunks = game.getThing("terrain").chunks

    this.time ++

    if (this.time % 60 === 1) {
      // If the targeted voxel is destroyed, find a new voxel to target
      if (!this.targetPosition || !vox.getVoxelSolid(chunks, this.targetPosition, {index:0})) {
        this.targetPosition = this.pickNearbyVoxel()
        console.log("New target: " + this.targetPosition)
      }
      // Otherwise, shoot it!
      else {
        this.shoot()
      }
    }

    if (this.targetPosition) {
      // Face target
      this.lookAngle = vec2.lerpAngles(this.lookAngle, vec2.angleBetween(this.position, this.targetPosition), 0.1)

      // Move toward target if too far away
      if (vec3.distance(this.position, this.targetPosition) > 16) {

      }
    }

    // Grow from zero
    this.growScale = Math.min(this.growScale + 0.03, 1.0)

    // Die
    if (this.health <= 0) {
      this.dead = true
    }
  }

  pickNearbyVoxel() {
    let chunks = game.getThing("terrain").chunks
    let radius = 10
    let height = 10
    let searchIterations = 256

    function rand(p, r) {
      return Math.round(p + (Math.random() - 0.5)*2*r)
    }

    for (let i = 0; i < searchIterations; i ++) {
      radius += 0.5
      height += 0.1

      let randomPos = [
        rand(this.position[0], radius),
        rand(this.position[1], radius),
        rand(this.position[2], height),
      ]
      // TODO: Do not allow wasp to target indestructible materials
      let voxelSolid = vox.getVoxelSolid(chunks, randomPos, 0)
      if (voxelSolid) {
        return randomPos
      }
    }
  }

  shoot() {
    // this.health -= Math.floor(Math.random() * 50)
    let bulletPos = [...this.position]
    let bulletVel = vec3.scale(vec3.normalize(vec3.subtract(this.targetPosition, this.position)), 0.3)
    game.addThing(new Bullet(bulletPos, bulletVel, this))
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
      gfx.set('color', [1,0,0,1])
    }
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [Math.PI/2, 0, this.lookAngle + Math.PI/2],
      scale: [
        u.lerp(1.5, 1, startle) * this.growScale,
        u.lerp(2.5, 1, startle) * this.growScale,
        u.lerp(1.5, 1, startle) * this.growScale
      ]
    }))
    gfx.setTexture(assets.textures.wasp)
    gfx.drawMesh(assets.meshes[frameModel])
  }

  onDamage () {
    this.after(10, null, 'damage')
  }

  // TODO: Finish this
  onDeath () {
    // Throw gibs
    for (let i = 0; i < 7; i ++) {
      game.addThing(new WaspGib([...this.position], -this.health))
    }
  }
}
