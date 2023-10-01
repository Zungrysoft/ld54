import * as u from "./core/utils.js"
import * as vec2 from "./core/vector2.js"
import * as game from "./core/game.js"
import Thing from "./core/thing.js"

function* DeathAnimation() {
  const {width, height} = game.config
  const {ctx, globals} = game
  const player = game.getThing('player')
  let lives = player.lives + 1

  for (let i=0; i<15; i++) {
    ctx.fillStyle = `rgba(0, 0, 0, ${u.map(i, 0, 15, 0, 1, true)})`
    ctx.fillRect(0, 0, width, height)
    yield
  }

  const subTime = 30
  //globals.powerup = "none"
  //globals.fastRestart = true

  let i = 0
  while (true) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    if (i == subTime) {
      lives -= 1
    }

    ctx.save()
    ctx.translate(width - 64, height - 64)
    ctx.textAlign = "right"
    ctx.fillStyle = `rgba(255, 255, 255, ${u.map(i, subTime+10, subTime+30, 0, 0.5, true)})`
    ctx.font = "italic 32px Tahoma"
    ctx.fillText("Press any button to try again...", 0, 0)
    ctx.restore()

    ctx.save()
    ctx.translate(width/2, height/2)
    ctx.font = "italic bold 64px Tahoma"
    ctx.textAlign = "center"
    ctx.translate(0, Math.sin(u.map(i, subTime, subTime + 15, 0, Math.PI, true))*-16)
    const str = "LIVES x" + lives
    ctx.fillStyle = "black"
    ctx.fillText(str, 0, 0)
    ctx.fillStyle = i >= subTime && i <= subTime + 15 ? "red" : "white"
    ctx.fillText(str, 4, -4)
    ctx.restore()

    if ((Object.keys(game.keysPressed).length || game.mouse.button) && i > subTime + 10) {
      break
    }

    i += 1
    yield
  }

  for (let i=0; i<15; i++) {
    ctx.fillStyle = `rgba(0, 0, 0, ${u.map(i, 0, 15, 1, 0, true)})`
    ctx.fillRect(0, 0, width, height)
    yield
  }
}

function* GameOver() {
  const {width, height} = game.config
  const {ctx, globals} = game

  // Determine wave
  const wave = game.getThing("wavemanager").wave

  // Pick a death screen tip
  const tips = game.assets.json.tips.filter(x => wave >= x.minWave && wave < x.maxWave)
  const tip = tips[Math.floor(Math.random() * tips.length)].text
  const tipLines = tip.split("\n").reverse()

  for (let i=0; i<15; i++) {
    ctx.fillStyle = `rgba(255, 0, 0, 0.35)`
    ctx.fillRect(0, 0, width, height)
    yield
  }

  let i = 0
  while (true) {
    ctx.fillStyle = `rgba(0, 0, 0, ${u.map(i, 0, 60, 0, 1, true)})`
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(width/2, height/2 + Math.sin(i/30)*16)
    const scalar = u.lerp(1, 12, 1 - u.map(i, 0, 30, 0, 1, true)**2)
    ctx.scale(scalar, scalar)
    //ctx.fillStyle = "rgba(0, 0, 0, ${u.map(i, 0, 10, 0, 1, true)})"
    ctx.fillStyle = "black"
    ctx.font = "italic 80px Times New Roman"
    ctx.textAlign = "center"
    const str = "Game Over"
    ctx.fillText(str, 0, 0)
    ctx.translate(4, -4)
    ctx.fillStyle = "red"
    ctx.fillText(str, 0, 0)
    ctx.restore()

    const subTime = 30
    if (wave > 0) {
      ctx.save()
      ctx.translate(width/2, height/2 + 64)
      ctx.textAlign = "center"
      ctx.fillStyle = `rgba(255, 255, 255, ${u.map(i, subTime, subTime+10, 0, 0.8, true)})`
      // console.log(ctx.fillStyle)
      ctx.font = "italic 32px Times New Roman"
      ctx.fillText(`Made it to Wave ${wave}`, 0, 0)
      ctx.restore()
    }

    // Retry text
    ctx.save()
    ctx.translate(width - 48, height - 48)
    ctx.textAlign = "right"
    ctx.fillStyle = `rgba(255, 255, 255, ${u.map(i, subTime+10, subTime+30, 0, 0.5, true)})`
    ctx.font = "32px Times New Roman"
    ctx.fillText("Press any button to try again...", 0, 0)
    ctx.restore()

    // Tip
    ctx.save()
    ctx.translate(32, height - 32)
    ctx.textAlign = "left"
    ctx.fillStyle = `rgba(255, 255, 255, ${u.map(i, subTime+10, subTime+30, 0, 0.5, true)})`
    ctx.font = "20px Times New Roman"
    for (const line of tipLines) {
      ctx.fillText(line, 0, 0)
      ctx.translate(0, -20)
    }
    ctx.restore()

    if ((Object.keys(game.keysPressed).length || game.mouse.button) && i > subTime + 10) {
      break
    }

    i += 1
    yield
  }

  game.resetScene()
}

export default class DeathAnim extends Thing {
  constructor() {
    super()
    game.setThingName(this, 'deathanim')
    const player = game.getThing('player')
    if (player.lives > 0) {
      this.anim = DeathAnimation()
    } else {
      this.anim = GameOver()
    }

    game.pause(this)
  }

  update() {
    const { done } = this.anim.next()
    this.dead ||= done
  }

  onDeath() {
    game.unpause()
  }
}
