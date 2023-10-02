import * as soundmanager from './core/soundmanager.js'
import Pickup from './pickup.js'
import * as game from './core/game.js'
import * as vec3 from './core/vector3.js'

export default class HoneycombPickup extends Pickup {
  texture = "uv_honeycomb"
  mesh = "honeycomb"
  scale = 0.35
  pickupSound = ""

  constructor (position, tentative=false) {
    super(position, tentative)

    this.velocity = [
      (Math.random()-0.5) * 0.2,
      (Math.random()-0.5) * 0.2,
      (Math.random() + 1) * 0.0125
    ]
  }

  update () {
    super.update()

    // Magnet towards player
    const player = game.getThing('player')
    if (player) {
      const maxDistance = 12
      const pPos = vec3.add(player.position, [0, 0, -0.5])
      const distance = vec3.distance(this.position, pPos)
      if (distance < maxDistance) {
        const delta = vec3.normalize(vec3.subtract(pPos, this.position))
        this.velocity = vec3.add(this.velocity, vec3.scale(delta, ((maxDistance-distance)/maxDistance) * 0.05))
      }
    }

    if (this.time > 60 * 30) {
      this.dead = true
    }
  }

  onPickup (other) {
    other.coins ++
    other.after(10, null, 'coinget')
    soundmanager.playSound('powerup', 0.2, [1, 1])
  }
}
