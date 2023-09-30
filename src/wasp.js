import {
  ctx,
  globals,
  mouse,
} from './core/game.js'
import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'
import * as vox from './voxel.js'

export default class Wasp extends Thing {
  constructor (position = [0, 0, 0], angle = 0) {
    super()

    console.log("WASP")

    this.position = position
    this.spawnPosition = [...this.position]
    this.velocity = [0, 0, 0]

    game.setThingName(this, 'player')
  }

  update () {
    this.time ++
  }

  draw () {
    gfx.setShader(assets.shaders.default)
    // game.getCamera3D().updateMatrices()
    game.getCamera3D().setUniforms()
    gfx.set('color', [1.0, 1.0, 1.0, 1.0])
    gfx.set('modelMatrix', mat.getTransformation({
      translation: [...this.position],
      rotation: [0, 0, 0],
      scale: 1.0
    }))
    gfx.setTexture(assets.textures.wasp)
    gfx.drawMesh(assets.meshes.wasp)
  }

  // TODO: Finish this
  onDeath () {
    console.log("DEAD")
  }
}
