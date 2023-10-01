import * as game from './core/game.js'
import HoneycombPickup from './pickuphoneycomb.js'
import Wasp from "./wasp.js"
import WaspGib from "./waspgib.js"

export default class BigWasp extends Wasp {
  time = 0
  aabb = [-3, -3, 3, 3]
  hitRadius = 4
  explosionPower = 9
  spawnCoin = true
  scale = 1.9
  health = 300
  color = [0.62,0,0,1]
  bulletScale = 3.2

  constructor (position = [0, 0, 0], angle = 0) {
    super(position, angle)
  }

  onDeath () {
    super.onDeath()
    // Throw even more gibs
    for (let i = 0; i < 5; i ++) {
      game.addThing(new WaspGib([...this.position], -this.health))
    }

    // Always spawn at least one honeycomb
    if (this.spawnCoin) {
      game.addThing(new HoneycombPickup([...this.position]))
    }
  }
}
