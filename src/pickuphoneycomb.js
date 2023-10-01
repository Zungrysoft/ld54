import Pickup from './pickup.js'
import * as vec3 from './core/vector3.js'
import * as game from './core/game.js'
import * as vox from './voxel.js'

export default class HoneycombPickup extends Pickup {
  texture = "uv_honeycomb"
  mesh = "honeycomb"
  scale = 0.35
  pickupSound = ""

  constructor (position) {
    super(position)

    this.velocity = [
      (Math.random()-0.5) * 0.2,
      (Math.random()-0.5) * 0.2,
      (Math.random() + 1) * 0.0125
    ]
  }

  update () {
    super.update()

    this.position = vec3.add(this.position, this.velocity)
    const friction = 0.975
    this.velocity[0] *= friction
    this.velocity[1] *= friction
    this.velocity[2] = Math.max(this.velocity[2] - 0.001, -0.04)

    // Check for wall
    let chunks = game.getThing("terrain").chunks
    let vPos = this.position.map(x => Math.round(x))
    vPos[2] -= 1
    if (vox.getVoxelSolid(chunks, vPos)) {
      this.velocity[2] = 0
    }

    if (this.time > 60 * 30) {
      this.dead = true
    }
  }

  onPickup (other) {
    other.coins ++
    other.after(10, null, 'coinget')
  }
}
