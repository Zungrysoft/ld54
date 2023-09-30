import Pickup from './pickup.js'

export default class ShotgunPickup extends Pickup {
  texture = "uv_shotgun"
  mesh = "shotgun"
  scale = 0.2
  pickupSound = ""

  constructor (position) {
    super(position)
  }

  onPickup (other) {
    other.weapon = "shotgun"
    other.ammo = 8
  }
}
