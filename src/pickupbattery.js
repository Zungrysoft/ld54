import Pickup from './pickup.js'

export default class BatteryPickup extends Pickup {
  texture = "uv_battery"
  mesh = "battery"
  scale = 0.2
  pickupSound = ""

  onPickup (other) {
    other.jetpackRechargeRate += 0.5
  }
}
