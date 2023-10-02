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
    boom1: 'sounds/boom1.wav',
    boom2: 'sounds/boom1.wav',
    buttonclick: 'sounds/buttonclick.wav',
    buttonhover: 'sounds/buttonhover.wav',
    buttondone: 'sounds/buttondone.wav',
    buttonswitch: 'sounds/buttonswitch.wav',
    edeath1: 'sounds/edeath1.wav',
    eshoot1: 'sounds/eshoot1.wav',
    eshoot2: 'sounds/eshoot1.wav',
    eshoot3: 'sounds/eshoot1.wav',
    eshoot4: 'sounds/eshoot1.wav',
    shotgun: 'sounds/shotgun.wav',
    powerup: 'sounds/powerup.wav',
    pshoot1: 'sounds/pshoot1.wav',
    pshoot2: 'sounds/pshoot1.wav',
    timerclick: 'sounds/timerclick.wav',
    engine: 'sounds/engine.wav',
    twirl: 'sounds/twirl.wav',
    build: 'sounds/build.wav',
    pickup: 'sounds/pickup.wav',
    pickup2: 'sounds/pickup2.wav',
    pickup3: 'sounds/pickup3.wav',
    hit: 'sounds/hit.wav',
    hit2: 'sounds/hit2.wav',
    hit3: 'sounds/hit2.wav',
    drop: 'sounds/drop.wav',
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
    bomb: 'models/bomb.obj',
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
    tips: 'json/tips.json',
    arena1: 'json/structures/main/arena1.json',
    base: 'json/structures/main/base.json',
    beam: 'json/structures/main/beam.json',
    beams: 'json/structures/main/beams.json',
    blueroom: 'json/structures/main/blueroom.json',
    building1: 'json/structures/main/building1.json',
    building2: 'json/structures/main/building2.json',
    building3: 'json/structures/main/building3.json',
    corner: 'json/structures/main/corner.json',
    monolith: 'json/structures/main/monolith.json',
    pathway: 'json/structures/main/pathway.json',
    pathway2: 'json/structures/main/pathway2.json',
    pathway3: 'json/structures/main/pathway3.json',
    pathway4: 'json/structures/main/pathway4.json',
    pillars: 'json/structures/main/pillars.json',
    planter1: 'json/structures/main/planter1.json',
    planter2: 'json/structures/main/planter2.json',
    plate: 'json/structures/main/plate.json',
    redplat: 'json/structures/main/redplat.json',
    scaffolding: 'json/structures/main/scaffolding.json',
    scaffolding2: 'json/structures/main/scaffolding2.json',
    spawnplat: 'json/structures/main/spawnplat.json',
    stairs: 'json/structures/main/stairs.json',
    starter: 'json/structures/main/starter.json',
    starterold: 'json/structures/main/starterold.json',
    temple: 'json/structures/main/temple.json',
    thinplatform: 'json/structures/main/thinplatform.json',
    trail: 'json/structures/main/trail.json',
    trail2: 'json/structures/main/trail2.json',
    tunnel: 'json/structures/main/tunnel.json',
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
  })
})
