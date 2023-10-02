import Pickup from './pickup.js'
import * as soundmanager from './core/soundmanager.js'

export default class ShotgunPickup extends Pickup {
  texture = "uv_shotgun"
  mesh = "shotgun"
  scale = 0.2
  pickupSound = ""

  onPickup (other) {
    other.weapon = "shotgun"
    other.ammo = 8
    soundmanager.playSound('pickup', 0.2, [1.2, 1.2])
  }
}
