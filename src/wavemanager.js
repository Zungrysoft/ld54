import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as soundmanager from './core/soundmanager.js'
import Thing from './core/thing.js'
import Wasp from './wasp.js'
import BigWasp from './bigwasp.js'
import ShotgunPickup from './pickupshotgun.js'
import BatteryPickup from './pickupbattery.js'
import HeartPickup from './pickupheart.js'
import PistolPickup from './pickuppistol.js'
import Pickup from './pickup.js'
import Player from './player.js'
import Bomb from './bomb.js'

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))

const shopButtonSize = [-200, -30, 200, 60]
const shopButtonSize2 = [-200, -30, 400, 90]

export default class WaveManager extends Thing {
  wave = 0
  time = 0
  waveActive = false

  constructor () {
    super()
    game.setThingName(this, 'wavemanager')
    this.after(2, () => game.addThing(new BuildManager()))
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
    if (this.getEnemyCount() > 20) {
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
      else if (0.2 > Math.random()) {
        game.addThing(new Bomb(position))
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

    if (game.getThing('deathanim')) {
      return
    }

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

export function loadAndModifyStructure(structure) {
  structure.voxels = game.assets.json[structure.structure].voxels
  let possibleTransformations = [
    {
      mode: 'mirror',
      axis: 'x',
      origin: [59.5, 39.5, 39.5],
    },
    {
      mode: 'mirror',
      axis: 'y',
      origin: [59.5, 39.5, 39.5],
    },
    {
      mode: 'rotate',
      axis: 'z',
      amount: 2,
      origin: [59.5, 39.5, 39.5],
    },
  ]

  // Randomly decide transformations
  let transformations = []
  for (const transformation of possibleTransformations) {
    if (0.5 > Math.random()) {
      transformations.push(transformation)
    }
  }

  // Add shift transformation
  if (structure.shiftRadius) {
    let xRadius = structure.shiftRadius
    let yRadius = structure.shiftRadius
    if (structure.shiftRadius === -1) {
      xRadius = 50
      yRadius = 30
      transformations.push({
        mode: 'rotate',
        axis: 'z',
        amount: Math.floor(Math.random()*4),
        origin: [59.5, 39.5, 39.5],
      })
    }
    let xShift = Math.floor((Math.random()-0.5) * 2 * xRadius)
    let yShift = Math.floor((Math.random()-0.5) * 2 * yRadius)
    transformations.push({
      mode: 'translate',
      offset: [xShift, yShift, 0],
    })
  }

  // Perform the transformations
  structure = vox.transformStructure(structure, transformations)

  // Add item text
  if (structure.things && structure.things.length) {
    structure.itemText = ""
    for (const thing of structure.things) {
      const name = thing.name
      structure.itemText += name + ", "
    }
    structure.itemText = structure.itemText.substring(0, structure.itemText.length - 2);
  }
  else {
    structure.itemText = "-"
  }

  return structure
}

export function shopPick(maxCost=512, requireItem=false) {
  // maxCost has to be at least 1
  maxCost = Math.max(maxCost, 1)

  // Get shop data
  let list = game.assets.json.shop

  // Filter list by cost
  list = list.filter(x => x.cost <= maxCost)

  // Filter by item
  if (requireItem) {
    list = list.filter(x => x.things)
  }

  // Filter by wave
  let curWave = game.getThing('wavemanager').wave
  list = list.filter(x => !(x.minWave) || curWave >= x.minWave)

  // Filter to remove structures with a heart on it if the player already has 3 hearts
  let player = game.getThing("player")
  let heartsOnMap = game.getThings().filter(x => x instanceof HeartPickup).length
  let totalHearts = player.lives + heartsOnMap
  if (totalHearts >= 3) {
    list = list.filter(x => !x.things || x.things.filter(y => y.name === "heart").length === 0)
  }

  // Filter to remove structures with a shotgun on it if there is already a shotgun on the map
  let totalShotguns = game.getThings().filter(x => x instanceof ShotgunPickup).length
  if (totalShotguns >= 1) {
    list = list.filter(x => !x.things || x.things.filter(y => y.name === "shotgun").length === 0)
  }

  // If list is empty, return an empty structure
  if (list.length === 0) {
    return loadAndModifyStructure(game.assets.json.shop[0])
  }

  // Determine the total weight
  let total = 0
  for (const item of list) {
    total += item.weight
  }

  // Generate a random number based on the total
  let selection = Math.random() * total

  // Use the random number to make a selection
  for (const item of list) {
    selection -= item.weight
    if (selection < 0) {
      return loadAndModifyStructure(item)
    }
  }

  // Default return; shouldn't be needed
  return loadAndModifyStructure(list[0])
}

export function previewPickups(things) {
  for (const thing of things) {
    if (thing.name === "shotgun") {
      game.addThing(new ShotgunPickup([...thing.position], true))
    }
    if (thing.name === "pistol") {
      game.addThing(new PistolPickup([...thing.position], true))
    }
    else if (thing.name === "heart") {
      game.addThing(new HeartPickup([...thing.position], true))
    }
    else if (thing.name === "battery") {
      game.addThing(new BatteryPickup([...thing.position], true))
    }
  }
}

export function deleteTentativePickups() {
  for (const thing of game.getThings()) {
    if (thing.tentative) {
      thing.dead = true
    }
  }
}

export function applyTentativePickups() {
  for (const thing of game.getThings()) {
    if (thing.tentative) {
      thing.tentative = false
    }
  }
}

class BuildManager extends Thing {
  time = 0
  previewing = [false, false, false, false]

  constructor () {
    super()
    this.pickStructures()
    game.setThingName(this, 'buildmanager')
    game.pause(this, game.getThing('skybox'))
    game.getThing('terrain').saveChunks()
    const w = game.config.width
    const h = game.config.height
    this.positionList = cartesian([w * 0.27, w * 0.73], [h * 0.3, h * 0.55])
    game.mouse.unlock()
  }

  update () {
    super.update()
    this.time += 1

    // Manually tick up timer for players and items so they can animate while game is paused
    const manualTickThings = game.getThings().filter(x => x instanceof Pickup || x instanceof Player)
    for (const manualTickThing of manualTickThings) {
      manualTickThing.time ++
    }

    const angle = this.time / (60 * 6)
    const radius = 64
    game.getCamera3D().viewMatrix = mat.getView({
      position: [Math.cos(angle) * radius + 64, Math.sin(angle) * radius + 40, 90],
      target: [64, 40, 40]
    })

    const terrain = game.getThing('terrain')
    const player = game.getThing('player')
    for (let i = 0; i <= 3; i += 1) {
      if (u.pointInsideAabb(...game.mouse.position, shopButtonSize, ...this.positionList[i])) {
        if (game.mouse.leftClick && player.coins >= this.builds[i].cost) {
          // Sound effect
          const p = u.map(this.builds[i].cost, 1, 12, 1.1, 0.4)
          soundmanager.playSound('build', 0.3, [p, p])
          soundmanager.playSound('buttonclick', 0.15, [p, p])

          player.coins -= this.builds[i].cost
          this.builds[i] = shopPick()
          terrain.saveChunks()
          applyTentativePickups()
          this.previewing[i] = false
        }
        if (!this.previewing[i] && player.coins >= this.builds[i].cost) {
          soundmanager.playSound('buttonhover', 0.2, [0.8, 0.8])

          vox.mergeStructureIntoWorld(terrain.chunks, this.builds[i], [0, 0, 0])
          previewPickups(this.builds[i].things)
          this.previewing[i] = true
        }
      } else if (this.previewing[i] && !this.dead) {
        terrain.loadSavedChunks()
        deleteTentativePickups()
        this.previewing[i] = false
      }
    }

    const { width: w, height: h } = game.config
    if (u.pointInsideAabb(...game.mouse.position, [-100, -30, 100, 30], game.config.width * 0.75, game.config.height * 0.8)) {
      if (game.mouse.leftClick) {
        soundmanager.playSound('buttondone', 0.2, [0.8, 0.8])
        player.respawn()
        this.dead = true
      }
    }

    if (u.pointInsideAabb(...game.mouse.position, [-100, -30, 100, 30], game.config.width * 0.5, game.config.height * 0.8)) {
      const rerollCost = 1
      if (player.coins >= rerollCost) {
        if (game.mouse.leftClick) {
          soundmanager.playSound('buttonswitch', 0.2, [0.8, 0.8])
          player.coins -= rerollCost
          this.pickStructures()
        }
      }
    }
  }

  pickStructures() {
    const player = game.getThing('player')
    this.builds = [
      shopPick(Math.min(player.coins, 5)),
      shopPick(player.coins),
      shopPick(player.coins, true),
      shopPick(),
    ]
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

    const player = game.getThing('player')
    let i = 0
    for (let pos of this.positionList) {
      // Border
      ctx.save()
      ctx.lineWidth = 3
      ctx.textAlign = 'left'
      ctx.strokeStyle = 'black'
      ctx.translate(pos[0], pos[1])
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(...shopButtonSize2)
      ctx.beginPath()
      ctx.rect(...shopButtonSize2)
      ctx.stroke()

      // Title
      ctx.font = 'italic bold 32px Tahoma'
      ctx.save()
      ctx.translate(-190, 12)
      ctx.fillStyle = 'black'
      ctx.fillText(this.builds[i].title, 0, 0)
      ctx.fillStyle = player.coins >= this.builds[i].cost ? 'white' : 'gray'
      ctx.fillText(this.builds[i].title, 4, -4)
      ctx.restore()

      // Cost
      ctx.font = 'italic bold 50px Tahoma'
      ctx.save()
      ctx.translate(180, 32)
      ctx.textAlign = 'right'
      ctx.fillStyle = player.coins >= this.builds[i].cost ? 'green' : 'black'
      ctx.fillText('$' + this.builds[i].cost, 0, 0)
      ctx.fillStyle = player.coins >= this.builds[i].cost ? 'white' : 'gray'
      ctx.fillText('$' + this.builds[i].cost, 4, -4)
      ctx.restore()

      // Items
      ctx.font = 'italic bold 16px Tahoma'
      ctx.save()
      ctx.translate(-190, 50)
      ctx.textAlign = 'left'
      ctx.fillStyle = 'black'
      ctx.fillText(this.builds[i].itemText, 0, 0)
      ctx.fillStyle = player.coins >= this.builds[i].cost ? 'white' : 'gray'
      ctx.fillText(this.builds[i].itemText, 3, -3)
      ctx.restore()

      ctx.restore()
      i += 1
    }

    const { width: w, height: h } = game.config

    {
      // done button
      const pos = [w * 3 / 4, h * 0.8]

      ctx.save()
      ctx.lineWidth = 3
      ctx.textAlign = 'left'
      ctx.strokeStyle = 'black'
      ctx.translate(pos[0], pos[1])
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(-100, -30, 200, 60)
      ctx.beginPath()
      ctx.rect(-100, -30, 200, 60)
      ctx.stroke()
      ctx.restore()

      ctx.font = 'italic bold 32px Tahoma'
      ctx.save()
      ctx.translate(pos[0], pos[1])
      ctx.translate(0, 12)
      ctx.textAlign = 'center'
      ctx.fillStyle = 'black'
      ctx.fillText('Done', 0, 0)
      ctx.fillStyle = 'white'
      ctx.fillText('Done', 4, -4)
      ctx.restore()
    }

    {
      // reroll button
      const pos = [w * 1 / 2, h * 0.8]

      ctx.save()
      ctx.lineWidth = 3
      ctx.textAlign = 'left'
      ctx.strokeStyle = 'black'
      ctx.translate(pos[0], pos[1])
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(-100, -30, 200, 60)
      ctx.beginPath()
      ctx.rect(-100, -30, 200, 60)
      ctx.stroke()
      ctx.restore()

      ctx.font = 'italic bold 32px Tahoma'
      ctx.save()
      ctx.translate(pos[0], pos[1])
      ctx.translate(0, 12)
      ctx.textAlign = 'center'
      ctx.fillStyle = 'black'
      ctx.fillText('Reroll: $1', 0, 0)
      ctx.fillStyle = player.coins >= 1 ? 'white' : 'gray'
      ctx.fillText('Reroll: $1', 4, -4)
      ctx.restore()
    }

    // honeycomb counter
    // ctx.save()
    // {
    //   ctx.save()
    //   ctx.fillStyle = 'black'
    //   ctx.font = 'italic bold 56px Tahoma'
    //   ctx.textAlign = 'left'
    //   ctx.translate(100, game.config.height - 90)
    //   ctx.fillText(String(player.coins), 0, 0)
    //   ctx.restore()
    // }
    // ctx.translate(4, -4)
    // {
    //   ctx.save()
    //   ctx.fillStyle = 'white'
    //   ctx.font = 'italic bold 56px Tahoma'
    //   ctx.textAlign = 'left'
    //   ctx.translate(100, game.config.height - 90)
    //   ctx.fillText(String(player.coins), 0, 0)
    //   ctx.restore()
    // }
    // ctx.restore()

  }

  onDeath () {
    game.unpause()
    game.mouse.lock()
  }
}
