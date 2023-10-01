import { assets } from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'
import * as mat from './core/matrices.js'

class Particle extends Thing {
  time = 0
  texture = assets.textures.circle
  scale = 32
  color = [1, 1, 1, 1]
  deathTime = 60

  constructor (position) {
    super()
    this.position = [...position]
  }

  update () {
    this.time += 1
    this.dead = this.dead || this.time >= this.deathTime
  }

  draw () {
    gfx.setShader(assets.shaders.billboard)
    gfx.setTexture(this.texture)
    game.getCamera3D().setUniforms()
    gfx.set('modelMatrix', mat.getTransformation({
      translation: this.position,
      scale: this.scale
    }))
    gfx.set('color', this.color)
    gfx.drawBillboard()
  }
}

export class ItemParticle extends Particle {
  scale = u.map(Math.random(), 0, 1, 0.5, 0.8)
  color = [1, 1, 1, 0.5]

  constructor (position) {
    super(position)
    {
      const r = 0.1
      this.velocity = vec3.scale(vec3.normalize([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]), r)
    }
    {
      const r = 0.1
      this.position = vec3.add(this.position, vec3.scale(vec3.normalize([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]), r))
    }
  }

  update () {
    super.update()
    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]
    this.scale -= 0.02
    this.dead = this.dead || this.scale <= 0
  }
}
