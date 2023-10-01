import Pickup from './pickup.js'

export default class HeartPickup extends Pickup {
  texture = "uv_heart"
  mesh = "heart"
  scale = 0.8
  pickupSound = ""

  onPickup (other) {
    other.lives ++
  }
}
