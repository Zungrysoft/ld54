import * as game from './core/game.js'
import * as gfx from './core/webgl.js'
import Terrain from './terrain.js'
import Player from './player.js'
import WaveManager from './wavemanager.js'
import Skybox from './skybox.js'
import { flush } from './database.js'
import ShotgunPickup from './pickupshotgun.js'
import PistolPickup from './pickuppistol.js'
import BatteryPickup from './pickupbattery.js'
import HeartPickup from './pickupheart.js'

game.config.width = 1024 // 640
game.config.height = 576 // 360
game.config.threads = 8
//game.config.isWebglEnabled = false
document.title = 'Untitled Voxel Shooter'

await game.loadAssets({
  images: {
    background: 'images/bg1.png',
    square: 'images/square.png',
    circle: 'images/circle.png',
    colorMap: 'images/color_map.png',
    crosshair: 'images/crosshair.png',
    wasp: 'images/square.png',
    noise: 'images/noise1.png',
    uv_shotgun: 'images/uv_shotgun.png',
    uv_pistol: 'images/uv_pistol.png',
    uv_shell: 'images/uv_shell.png',
    uv_heart: 'images/uv_heart.png',
    uv_battery: 'images/uv_battery.png',
    uv_honeycomb: 'images/uv_honeycomb.png',
    miramar_bk: 'images/miramar_bk.jpg',
    miramar_dn: 'images/miramar_dn.jpg',
    miramar_ft: 'images/miramar_ft.jpg',
    miramar_lf: 'images/miramar_lf.jpg',
    miramar_rt: 'images/miramar_rt.jpg',
    miramar_up: 'images/miramar_up.jpg',
  },

  sounds: {
    collect: 'sounds/collect.wav',
    laser: 'sounds/laser2.wav',
    laserHit: 'sounds/laser.wav',
    shift: 'sounds/shift2.wav',
    thump: 'sounds/thump.wav',
    wind: 'sounds/wind.wav',
    fail: 'sounds/fail.wav',
    whoosh: 'sounds/whoosh.wav',
  },

  shaderSources: {
    defaultFrag: 'shaders/default.frag',
    defaultVert: 'shaders/default.vert',

    shadingFrag: 'shaders/shading.frag',

    billboard: 'shaders/billboard.vert',

    voxelFrag: 'shaders/voxel.frag',
    voxelVert: 'shaders/voxel.vert',
  },

  models: {
    cube: 'models/cube.obj',
    sphere: 'models/sphere.obj',
    skybox: 'models/skybox.obj',
    chunkOutline: 'models/chunk_outline.obj',
    wasp1: 'models/wasp1.obj',
    wasp2: 'models/wasp2.obj',
    wasp3: 'models/wasp3.obj',
    gib: 'models/gib.obj',
    shotgun: 'models/shotgun.obj',
    pistol: 'models/pistol.obj',
    shell: 'models/shell.obj',
    heart: 'models/heart.obj',
    battery: 'models/battery.obj',
    honeycomb: 'models/honeycomb.obj',
  },

  json: {
    shop: 'json/shop.json',
    starter: 'json/structures/main/starter.json',
    redplat: 'json/structures/main/redplat.json',
    beams: 'json/structures/main/beams.json',
    blueroom: 'json/structures/main/blueroom.json',
  },
})


const { assets } = game
assets.shaders = {
  default: gfx.createShader(
    assets.shaderSources.defaultVert,
    assets.shaderSources.defaultFrag
  ),
  shading: gfx.createShader(
    assets.shaderSources.defaultVert,
    assets.shaderSources.shadingFrag
  ),
  voxel: gfx.createShader(
    assets.shaderSources.voxelVert,
    assets.shaderSources.voxelFrag
  ),
  billboard: gfx.createShader(
    assets.shaderSources.billboard,
    assets.shaderSources.defaultFrag
  ),
}

assets.textures = Object.fromEntries(
  Object.entries(assets.images).map(([name, image]) => [
    name, gfx.createTexture(image)
  ])
)

assets.meshes = Object.fromEntries(
  Object.entries(assets.models).map(([name, model]) => [
    name, gfx.createMesh(model)
  ])
)

// console.log(assets)
flush(() => {
  game.setScene(() => {
    game.addThing(new Terrain())
    game.addThing(new WaveManager())
    game.addThing(new Skybox())
    game.addThing(new Player([20.1, 20, 79]))
    game.addThing(new ShotgunPickup([60, 20, 41]))
    game.addThing(new PistolPickup([60, 60, 41]))
    game.addThing(new BatteryPickup([100, 60, 41]))
    game.addThing(new HeartPickup([100, 20, 41]))
  })
})
