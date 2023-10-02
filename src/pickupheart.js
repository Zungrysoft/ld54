import Pickup from './pickup.js'
import * as soundmanager from './core/soundmanager.js'

export default class HeartPickup extends Pickup {
  texture = "uv_heart"
  mesh = "heart"
  scale = 0.8
  pickupSound = ""

  onPickup (other) {
    other.lives ++
    soundmanager.playSound('pickup3', 0.2, [1.2, 1.2])
  }
}
