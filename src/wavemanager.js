import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import Thing from './core/thing.js'

export default class WaveManager extends Thing {
  wave = 0

  constructor () {
    super()
    game.setThingName(this, 'wavemanager')
    this.nextWave()
  }

  nextWave () {
    this.wave += 1
    this.after(60 * 60, () => this.nextWave(), 'wave')
  }

  draw () {
    const { ctx, assets } = game

    // wave counter
    ctx.save()
    ctx.fillStyle = 'black'
    ctx.font = 'italic bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.translate(game.config.width / 2, 38)
    ctx.scale(1, 0.65)
    ctx.fillText(`WAVE ${this.wave}`, 0, 0)
    ctx.restore()

    // wave progress bar
    ctx.save()
    ctx.fillStyle = 'black'
    ctx.translate(game.config.width / 2, 50)
    const halfWidth = 256
    const height = 12
    ctx.fillRect(-halfWidth, 0, halfWidth * 2, height)
    ctx.fillStyle = 'red'
    const border = 4
    ctx.fillRect(
      -halfWidth + border,
      border,
      this.timer('wave') * (halfWidth * 2 - border * 2),
      height - border * 2
    )
    ctx.restore()

    // lives counter
    const player = game.getThing('player')
    if (player) {
      ctx.save()
      ctx.fillStyle = 'black'
      ctx.font = 'italic bold 48px Arial'
      ctx.translate(64, game.config.height - 64)
      ctx.scale(1, 0.65)
      ctx.fillText(`LIVES 5`, 0, 0)
      ctx.restore()
    }
  }
}
