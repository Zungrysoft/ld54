import Pickup from './pickup.js'
import * as soundmanager from './core/soundmanager.js'

export default class BatteryPickup extends Pickup {
  texture = "uv_battery"
  mesh = "battery"
  scale = 0.2
  pickupSound = ""

  onPickup (other) {
    other.jetpackRechargeRate += 0.5
    soundmanager.playSound('pickup2', 0.15, [0.7, 0.9])
  }
}
