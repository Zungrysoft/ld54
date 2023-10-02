import Wasp from "./wasp.js"

export default class BigWasp extends Wasp {
  time = 0
  aabb = [-3, -3, 3, 3]
  hitRadius = 4
  explosionPower = 7
  spawnCoin = true
  scale = 1.9
  health = 300
  color = [0.62,0,0,1]
  bulletScale = 3.2
  gibCount = 13

  constructor (position = [0, 0, 0], angle = 0) {
    super(position, angle)
  }

  onDeath () {
    super.onDeath()

    // Can spawn additional honeycomb
    if (this.spawnCoin) {
      if (0.5 > Math.random()) {
        this.dropCoin()
      }
    }
  }
}
