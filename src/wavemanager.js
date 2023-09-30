import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import Thing from './core/thing.js'
import Wasp from './wasp.js'

export default class WaveManager extends Thing {
  wave = 0
  time = 0
  waveActive = false

  constructor () {
    super()
    game.setThingName(this, 'wavemanager')
    this.after(60 * 3, () => this.nextWave())
  }

  update () {
    super.update()
    this.time += 1
    //if (this.time % 60 === 0 && this.getEnemyCount() === 0) {
      //this.spawn()
    //}
  }

  getEnemyCount () {
    return this.getEnemies().length
  }

  getEnemies () {
    return game.getThings().filter(thing =>
      ('health' in thing && thing != game.getThing('player'))
    )
  }

  spawn () {
    this.after(u.lerp(6, 10, Math.random()) * 60, () => this.spawn(), 'spawn')
    if (this.getEnemyCount() > 12) {
      return
    }
    const angle = u.lerp(0, Math.PI * 2, Math.random())
    const x = Math.cos(angle) * 32 + 64
    const y = Math.sin(angle) * 32 + 40
    for (let i = 0; i < 4; i += 1) {
      const position = [
        x + u.lerp(-10, 10, Math.random()),
        y + u.lerp(-10, 10, Math.random()),
        u.lerp(45, 55, Math.random())
      ]
      game.addThing(new Wasp(position))
    }
  }

  endWave () {
    for (const enemy of this.getEnemies()) {
      enemy.dead = true
    }
    this.cancelTimer('spawn')
    this.waveActive = false
    this.after(60 * 10, () => this.nextWave())
  }

  nextWave () {
    this.wave += 1
    this.waveActive = true
    this.after(60 * 60, () => this.endWave(), 'wave')
    this.spawn()
  }

  draw () {
    const { ctx, assets } = game

    // wave counter
    if (this.wave > 0) {
      ctx.save()
      ctx.font = 'italic bold 48px Tahoma'
      ctx.textAlign = 'center'
      ctx.translate(0, 40)
      {
        ctx.save()
        ctx.fillStyle = 'black'
        ctx.translate(game.config.width / 2, 0)
        ctx.scale(1, 0.65)
        ctx.fillText(`WAVE ${this.wave}`, 0, 0)
        ctx.restore()
      }
      ctx.translate(4, -4)
      {
        ctx.save()
        ctx.fillStyle = 'white'
        ctx.translate(game.config.width / 2, 0)
        ctx.scale(1, 0.65)
        ctx.fillText(`WAVE ${this.wave}`, 0, 0)
        ctx.restore()
        ctx.restore()
      }
    }

    // wave progress bar
    if (this.waveActive) {
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
    }

    // lives counter
    const player = game.getThing('player')
    if (player) {
      ctx.save()
      ctx.font = 'italic bold 40px Tahoma'
      ctx.textAlign = 'center'
      {
        ctx.save()
        ctx.fillStyle = 'black'
        ctx.translate(100, game.config.height - 48)
        ctx.scale(1, 0.65)
        ctx.fillText('LIVES', 0, 0)
        ctx.restore()
      }
      ctx.translate(4, -4)
      {
        ctx.save()
        ctx.fillStyle = 'white'
        ctx.translate(100, game.config.height - 48)
        ctx.scale(1, 0.65)
        ctx.fillText('LIVES', 0, 0)
        ctx.restore()
      }
      ctx.restore()

      ctx.save()
      {
        ctx.save()
        ctx.fillStyle = 'black'
        ctx.font = 'italic bold 72px Tahoma'
        ctx.textAlign = 'center'
        ctx.translate(100, game.config.height - 80)
        ctx.fillText(String(player.lives), 0, 0)
        ctx.restore()
      }
      ctx.translate(4, -4)
      {
        ctx.save()
        ctx.fillStyle = 'white'
        ctx.font = 'italic bold 72px Tahoma'
        ctx.textAlign = 'center'
        ctx.translate(100, game.config.height - 80)
        ctx.fillText(String(player.lives), 0, 0)
        ctx.restore()
      }
      ctx.restore()

      // jetpack
      const fuel = player.jetpack / player.jetpackMaximum
      if (player.jetpack < player.jetpackMaximum) {
        ctx.save()
        ctx.lineWidth = 6
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.beginPath()
        ctx.arc(game.config.width * 2 / 4, game.config.height / 2, 38, 0, Math.PI * 2 * fuel)
        ctx.stroke()
        ctx.save()
      }
    }
  }
}
