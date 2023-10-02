import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as pal from './palette.js'
import WorkerPool from './workerpool.js'
import Thing from './core/thing.js'
import { assets } from './core/game.js'
import { meshChunk } from './workers/chunkmesher.js'

export default class Terrain extends Thing {
  time = 0
  seed = Math.floor(Math.random() * Math.pow(2, 64))
  loadDistance = 5
  chunks = {}
  chunkStates = {}
  chunkMeshes = {}
  chunkMeshTimestamps = {}
  fogColor = [0.267, 0.533, 1]

  constructor () {
    super()
    game.setThingName(this, 'terrain')

    const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
    const dim = [0, 1, 2, 3, 4, 5]
    for (const coord of cartesian(dim, dim, dim)) {
      this.chunks[vox.ts(coord)] = vox.emptyChunk()
      this.chunkStates[vox.ts(coord)] = 'loaded'
    }

    // Starting structure
    vox.mergeStructureIntoWorld(this.chunks, assets.json.starter, [0, 0, 0])

    // =====================
    // Set up worker threads
    // =====================

    // Chunk selector
    this.chunkSelectorWorker = new Worker('src/workers/chunkselector.js', { type: "module" })

    // Chunk meshers
    this.mesherPool = new WorkerPool('src/workers/chunkmesher.js', game.config.threads, {},
      (message) => {
        // Save the chunk mesh
        let vertsView = new Float32Array(message.verts);

        // let verts = []
        // for (let i = 0; i < vertsView.length; i += 8) {
        //   verts.push([vertsView[i+5], vertsView[i+6], vertsView[i+7]])
        // }
        // console.log(verts)

        // Make sure this mesh isn't outdated (prevent race conditions)
        let meshTimestamp = message.meshTimestamp
        if (!this.chunkMeshTimestamps[message.chunkKeyStr] || this.chunkMeshTimestamps[message.chunkKeyStr] < meshTimestamp) {
          this.chunkMeshTimestamps[message.chunkKeyStr] = meshTimestamp
          if (vertsView.length > 0) {
            this.chunkMeshes[message.chunkKeyStr] = gfx.createMesh(vertsView)
          }
          // If the mesh is empty, delete its entry in the dict instead
          else {
            delete this.chunkMeshes[message.chunkKeyStr]
          }
        }
      },
    )

    // Terrain Generators
    this.generatorPool = new WorkerPool('src/workers/chunkgenerator.js', 0,
      {
        idempotencyKeys: ['chunkKeyStr'],
      },
      (message) => {
        // Save chunk
        this.chunks[message.chunkKeyStr] = message.chunk

        // Save this chunk's initial mesh as well
        if (message.verts) {
          let vertsView = new Float32Array(message.verts);
          if (vertsView.length > 0) {
            this.chunkMeshes[message.chunkKeyStr] = gfx.createMesh(vertsView)
          }
        }

        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'loaded'
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'loading'
      },
    )

    // Chunk Unloaders
    this.unloaderPool = new WorkerPool('src/workers/chunkunloader.js', 0,
      {
        idempotencyKeys: ['chunkKeyStr'],
      },
      (message) => {
        if (message.success) {
          // Set chunk state
          delete this.chunkStates[message.chunkKeyStr]
        }
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'unloading'

        // Delete the chunk from this object since it's now safe in the worker thread that is saving it to db
        delete this.chunks[message.chunkKeyStr]

        // Delete mesh
        delete this.chunkMeshes[message.chunkKeyStr]
      },
    )
  }

  saveChunks () {
    this.savedChunks = (
      Object.fromEntries(
        Object
          .entries(this.chunks)
          .map(([index, chunk]) => (
            [index, vox.serializeChunk(chunk)]
          )
        )
      )
    )
  }

  loadSavedChunks () {
    const newChunks = (
      Object.fromEntries(
        Object
          .entries(this.savedChunks)
          .map(([index, data]) => (
            [index, { ...vox.deserializeChunk(data) }]
          )
        )
      )
    )
    this.chunks = newChunks
    this.mesherPool.clearQueue()
  }

  update () {
    super.update()

    this.time ++

    // Chunk loading and unloading
    if (this.time % 60 === 0) {
      this.selectChunks(game.getThing('player').position)
    }
  }

  selectChunks(position) {
    // Get worker
    const worker = this.chunkSelectorWorker

    // Set callback
    worker.onmessage = (message) => {
      this.loadChunks(message.data)
    }

    // Send message
    worker.postMessage({
      position: position,
      loadDistance: this.loadDistance,
      keepDistance: this.loadDistance + 2,
    })
  }

  loadChunks(data) {
    // Rebuild the queue of which chunks to load
    this.generatorPool.clearQueue()
    for (const chunkKeyStr of data.chunksToLoad) {
      if (!(chunkKeyStr in this.chunkStates)) {
        this.generatorPool.push({
          chunkKeyStr: chunkKeyStr,
          seed: this.seed,
        })
      }
    }

    // Set chunks to unload if they're loaded and not on the keep or load list
    this.unloaderPool.clearQueue()
    for (const chunkKeyStr in this.chunks) {
      if (!data.chunksToLoad.includes(chunkKeyStr) && !data.chunksToKeep.includes(chunkKeyStr)) {
        if (this.chunkStates[chunkKeyStr] === 'loaded') {
          const chunk = this.chunks[chunkKeyStr]
          this.unloaderPool.push({
            chunkKeyStr: chunkKeyStr,
            chunk: chunk,
            transfer: [chunk.voxels],
          })
        }
      }
    }
  }

  rebuildChunkMeshes() {
    // Iterate over chunks and rebuild all marked "modified"
    for (const chunkKeyStr in this.chunks) {
      if (this.chunks[chunkKeyStr].modified) {
        // Unmark this chunk as modified
        this.chunks[chunkKeyStr].modified = false

        // Push the meshing job to the mesher worker pool
        this.mesherPool.push({
          chunk: {
            voxels: this.chunks[chunkKeyStr].voxels,
            mode: this.chunks[chunkKeyStr].mode,
          },
          chunkKeyStr: chunkKeyStr,
          meshTimestamp: Date.now(),
        })
      }
    }
  }

  traceLine(traceStart, traceEnd, ignoreFirstVoxel=false) {
    return vox.traceLine(this.chunks, traceStart, traceEnd, ignoreFirstVoxel)
  }

  draw () {
    const { ctx, gl } = game

    // Rebuild chunk meshes that have been modified since the last frame
    this.rebuildChunkMeshes()

    // gfx setup
    gfx.setShader(assets.shaders.voxel)
    game.getCamera3D().setUniforms()
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    // Chunk meshes
    for (const chunkKeyStr in this.chunkMeshes) {
      const chunkMesh = this.chunkMeshes[chunkKeyStr]
      const chunkPosition = vox.getChunkPosition(this.chunks, chunkKeyStr)
      const position = vox.getWorldPosition(chunkPosition, [0, 0, 0])
      gfx.set('fogColor', this.fogColor)
      // gfx.set('fogDistance', (this.loadDistance-1) * vox.CHUNK_SIZE * 1.0)
      gfx.set('fogDistance', 0.0)
      gfx.setTexture(assets.textures.colorMap)

      // put noise texture in texture slot 1
      gfx.set('noiseTexture', 1, 'int')
      gfx.setTexture(assets.textures.noise, 1)

      gfx.set('modelMatrix', mat.getTransformation({
        translation: position,
      }))
      gfx.drawMesh(chunkMesh)

      if (game.globals.debugMode) {
        gfx.set('modelMatrix', mat.getTransformation({
          translation: vec3.add(position, [-0.5, -0.5, vox.CHUNK_SIZE-0.5]),
          scale: vox.CHUNK_SIZE,
        }))
        gfx.drawMesh(assets.meshes.chunkOutline)
      }
    }

    // gfx teardown
    gl.disable(gl.CULL_FACE)

  }
}
