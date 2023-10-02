import Pickup from './pickup.js'
import * as soundmanager from './core/soundmanager.js'

export default class PistolPickup extends Pickup {
  texture = "uv_pistol"
  mesh = "pistol"
  scale = 0.2
  pickupSound = ""

  onPickup (other) {
    other.akimbo = true
    soundmanager.playSound('pickup', 0.2, [1.2, 1.2])
  }
}
