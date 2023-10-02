import * as soundmanager from './core/soundmanager.js'
import Pickup from './pickup.js'

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
