import * as game from './core/game.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import Thing from './core/thing.js'

export default class Skybox extends Thing {
  draw () {
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('modelMatrix', mat.getTransformation({
      translation: game.getCamera3D().position
    }))
    gfx.set('color', [1,1,1,1])
    const s = 500
    gfx.setTexture(assets.textures.miramar_bk)
    gfx.drawQuad(
      -s, -s,-s,
      -s, -s, s,
       s, -s,-s,
       s, -s, s,
    )
    gfx.setTexture(assets.textures.miramar_ft)
    gfx.drawQuad(
       s, s,-s,
       s, s, s,
      -s, s,-s,
      -s, s, s,
    )
    gfx.setTexture(assets.textures.miramar_lf)
    gfx.drawQuad(
      -s, s,-s,
      -s, s, s,
      -s, -s,-s,
      -s, -s, s,
    )
    gfx.setTexture(assets.textures.miramar_rt)
    gfx.drawQuad(
      s, -s,-s,
      s, -s, s,
      s, s,-s,
      s, s, s,
    )
    gfx.setTexture(assets.textures.miramar_up)
    gfx.drawQuad(
       s,-s, s,
      -s,-s, s,
       s,  s, s,
      -s,  s, s,
    )
    gfx.setTexture(assets.textures.miramar_dn)
    gfx.drawQuad(
       s,-s, -s,
      -s,-s, -s,
       s,  s, -s,
      -s,  s, -s,
    )
  }
}
