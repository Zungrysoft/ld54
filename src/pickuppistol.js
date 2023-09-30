import Pickup from './pickup.js'

export default class PistolPickup extends Pickup {
  texture = "uv_pistol"
  mesh = "pistol"
  scale = 0.2
  pickupSound = ""

  constructor (position) {
    super(position)
  }

  onPickup (other) {
    other.akimbo = true
  }
}
