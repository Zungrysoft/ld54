import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import Thing from './core/thing.js'
import Wasp from './wasp.js'
import BigWasp from './bigwasp.js'

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))

export default class WaveManager extends Thing {
  wave = 0
  time = 0
  waveActive = false

  constructor () {
    super()
    game.setThingName(this, 'wavemanager')
    this.after(60 * 3.125, () => game.addThing(new BuildManager()))
    this.after(60 * 5, () => this.nextWave())
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
      if (0.2 > Math.random()) {
        game.addThing(new BigWasp(position))
      }
      else {
        game.addThing(new Wasp(position))
      }
    }
  }

  endWave () {
    for (const enemy of this.getEnemies()) {
      enemy.dead = true
      enemy.spawnCoin = false
    }
    this.cancelTimer('spawn')
    this.waveActive = false
    this.after(60 * 3, () => game.addThing(new BuildManager()))
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
  }
}

function choose (things) {
  const index = Math.floor(u.lerp(0, things.length - 0.001, Math.random()))
  const result = things[index]
  return result
}

const builds = [
  ['Red Bridge', 10, 'redplat'],
  ['Beams', 5, 'beams'],
  ['Blue Room', 15, 'blueroom']
]

class BuildManager extends Thing {
  time = 0
  previewing = [false, false, false, false]

  constructor () {
    super()
    this.builds = Array(4).fill(undefined).map(() => choose(builds))
    game.setThingName(this, 'buildmanager')
    game.pause(this, game.getThing('skybox'))
    game.getThing('terrain').saveChunks()
    const w = game.config.width
    const h = game.config.height
    this.positionList = cartesian([w * 0.3, w * 0.7], [h * 0.3, h * 0.55])
    game.mouse.unlock()
  }

  update () {
    super.update()
    //game.getCamera3D().lookVector = vec3.normalize([0.1, 0, -0.1])
    //game.getCamera3D().updateMatrices()
    this.time += 1
    const angle = this.time / (60 * 6)
    const radius = 64
    game.getCamera3D().viewMatrix = mat.getView({
      position: [Math.cos(angle) * radius + 64, Math.sin(angle) * radius + 40, 90],
      target: [64, 40, 40]
    })

    const terrain = game.getThing('terrain')
    for (let i = 0; i <= 3; i += 1) {
      if (u.pointInsideAabb(...game.mouse.position, [-150, -100, 150, 100], ...this.positionList[i])) {
        if (game.mouse.leftButton) {
          this.dead = true
        }
        if (!this.previewing[i]) {
          vox.mergeStructureIntoWorld(terrain.chunks, game.assets.json[this.builds[i][2]], [0, 0, 0])
          this.previewing[i] = true
        }
      } else if (this.previewing[i] && !this.dead) {
        terrain.loadSavedChunks()
        this.previewing[i] = false
      }
    }
  }

  draw () {
    const { ctx, assets } = game

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, game.config.width, game.config.height)
    ctx.restore()

    /*
    ctx.save()
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.font = 'italic bold 48px Tahoma'
    let i = 1
    for (const build of this.builds) {
      ctx.fillText(build[0] + ' $' + build[1], 80, 80 * i)
      i += 1
    }
    ctx.restore()
    */

    let i = 0
    for (let pos of this.positionList) {
      ctx.save()
      ctx.lineWidth = 3
      ctx.textAlign = 'left'
      ctx.strokeStyle = 'black'
      ctx.translate(pos[0], pos[1])
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(-150, -30, 300, 60)
      ctx.beginPath()
      ctx.rect(-150, -30, 300, 60)
      ctx.stroke()

      ctx.font = 'italic bold 32px Tahoma'
      ctx.save()
      ctx.translate(-140, 12)
      ctx.fillStyle = 'black'
      ctx.fillText(this.builds[i][0], 0, 0)
      ctx.fillStyle = 'white'
      ctx.fillText(this.builds[i][0], 4, -4)
      ctx.restore()

      ctx.font = 'italic bold 40px Tahoma'
      ctx.save()
      ctx.translate(80, 12)
      ctx.fillStyle = 'green'
      ctx.fillText('$' + this.builds[i][1], 0, 0)
      ctx.fillStyle = 'white'
      ctx.fillText('$' + this.builds[i][1], 4, -4)
      ctx.restore()

      ctx.restore()
      i += 1
    }
  }

  onDeath () {
    game.unpause()
    game.mouse.lock()
  }
}
