import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'

export const CHUNK_SIZE = 32
export const CHUNK_VOLUME = CHUNK_SIZE*CHUNK_SIZE*CHUNK_SIZE

export const PARAMS_UNLIT = 2
export const PARAMS_LIT = 8
// 0: Material
// 1: Flags
// 2-7: Shading (range [0, 255])
// All values are integers
export const FLAG_SOLID = 1
export const FLAG_RESERVED = 2

export const DEFAULT_SHADING = [153, 127, 102, 179, 204, 255]
export const EMPTY_VOXEL = [1, 0, ...DEFAULT_SHADING]

export const CHUNK_KEY_DIGITS = 10
export const CHUNK_KEY_OFFSET = 0.5 * Math.pow(10, CHUNK_KEY_DIGITS)

// export function ts(arr) {
//   if (typeof arr === 'string') {
//     return arr
//   }
//   return ((arr[0] + CHUNK_KEY_OFFSET) + '' + (arr[1] + CHUNK_KEY_OFFSET) + '' + (arr[2] + CHUNK_KEY_OFFSET))
// }

// export function ta(str) {
//   if (Array.isArray(str)) {
//     return str
//   }
//   return [
//     parseInt(str.slice(0, 10), 10)-CHUNK_KEY_OFFSET,
//     parseInt(str.slice(10, 20), 10)-CHUNK_KEY_OFFSET,
//     parseInt(str.slice(20, 30), 10)-CHUNK_KEY_OFFSET,
//   ]
// }

export function ts(arr) {
  if (typeof arr === 'string') {
    return arr
  }
  return arr[0] + ',' + arr[1] + ',' + arr[2]
}

export function ta(str) {
  if (Array.isArray(str)) {
    return str
  }
  const split = str.split(',')
  return [
    Number(split[0]),
    Number(split[1]),
    Number(split[2]),
  ]
}

export function stringToArray(s) {
  return s.split(',').map(x => Number(x))
}

export function getChunkPosition(chunks, chunkKeyStr) {
  // If the chunk doesn't exist, just convert the chunkKeyStr directly and send it back
  const chunk = chunks.position
  if (!chunk) {
    return ta(chunkKeyStr)
  }

  // If the position is already saved within the chunk in array form, send that back
  const pos = chunk.position
  if (pos) {
    return pos
  }
  // If it is not saved, convert it and save it in for future calls
  else {
    const newPos = ta(chunkKeyStr)
    chunk.position = newPos
    return newPos
  }
}

export function snapToVoxel(position) {
  return position.map(n => Math.round(n))
}

export function positionToChunkKey(position) {
  return [
    Math.floor(position[0] / CHUNK_SIZE),
    Math.floor(position[1] / CHUNK_SIZE),
    Math.floor(position[2] / CHUNK_SIZE),
  ]
}

export function positionToChunkPosition(position) {
  return [
    u.mod(position[0], CHUNK_SIZE),
    u.mod(position[1], CHUNK_SIZE),
    u.mod(position[2], CHUNK_SIZE),
  ]
}

export function getWorldPosition(chunkKey, chunkPosition) {
  // Make sure the chunkKey is in array format
  if (typeof chunkKey === "string") {
    chunkKey = ta(chunkKey)
  }

  return [
    chunkKey[0] * CHUNK_SIZE + chunkPosition[0],
    chunkKey[1] * CHUNK_SIZE + chunkPosition[1],
    chunkKey[2] * CHUNK_SIZE + chunkPosition[2],
  ]
}

export function chunkPositionToChunkIndex(position) {
  return (position[0] + position[1]*CHUNK_SIZE + position[2]*CHUNK_SIZE*CHUNK_SIZE)
}

export function chunkIndexToChunkPosition(index) {
  // X
  const x = u.mod(index, CHUNK_SIZE)

  // Y
  index = Math.floor(index / CHUNK_SIZE)
  const y = u.mod(index, CHUNK_SIZE)

  // Z
  index = Math.floor(index / CHUNK_SIZE)
  const z = index

  // Return
  return [x, y, z]
}

export function emptyStructure() {
  return {
    voxels: {},
    things: [],
    doorways: [],
    connections: [
      {type: ''},
      {type: ''},
      {type: ''},
      {type: ''},
      {type: ''},
      {type: ''},
    ],
    weight: 0.0,
    assetName: "UNNAMED",
  }
}

export function serializeChunk (chunk) {
  return JSON.stringify({
    ...chunk,
    voxels: Array.from(new Uint8Array(chunk.voxels))
  })
}

export function deserializeChunk (text) {
  const value = JSON.parse(text)
  let buffer = new ArrayBuffer(value.voxels.length);
  let bufferView = new Uint8Array(buffer);
  for (let i = 0; i < value.voxels.length; i ++) {
    bufferView[i] = value.voxels[i]
  }
  value.voxels = buffer
  value.modified = true
  return value
}

export function emptyChunk() {
  let buffer = new ArrayBuffer(0);
  return {
    voxels: buffer,
    mode: 0,
    things: [],
    modified: false,
  }
}

export function upgradeChunkToUnlit(chunk) {
  // If this chunk is already upgraded, ignore
  if (chunk.mode >= 1) {
    return
  }

  // Fill out new buffer
  let buffer = new ArrayBuffer(CHUNK_VOLUME * PARAMS_UNLIT);
  let bufferView = new Uint8Array(buffer);
  for (let i = 0; i < CHUNK_VOLUME; i ++) {
    for (let j = 0; j < PARAMS_UNLIT; j ++) {
      bufferView[i*PARAMS_UNLIT + j] = EMPTY_VOXEL[j]
    }
  }

  // Save to chunk
  chunk.mode = 1
  chunk.voxels = buffer
}

export function upgradeChunkToLit(chunk) {
  // If this chunk is already upgraded, ignore
  if (chunk.mode >= 2) {
    return
  }

  // Upgrade it to Unlit first
  upgradeChunkToUnlit(chunk)

  // Fill out new buffer
  let buffer = new ArrayBuffer(CHUNK_VOLUME * PARAMS_LIT);
  let bufferView = new Uint8Array(buffer);
  let existingView = new Uint8Array(chunk.voxels);
  const unlit = PARAMS_UNLIT
  const lit = PARAMS_LIT
  for (let i = 0; i < CHUNK_VOLUME; i ++) {
    // Transfer the preexisting fields
    for (let j = 0; j < unlit; j ++) {
      bufferView[i*lit + j] = existingView[i*unlit + j]
    }

    // Create new shading fields
    for (let j = unlit; j < lit; j ++) {
      bufferView[i*lit + j] = EMPTY_VOXEL[j]
    }
  }

  // Save to chunk
  chunk.mode = 2
  chunk.voxels = buffer
}

export function copyStructure(structure) {
  return {
    voxels: {...structure.voxels},
    things: [...structure.things],
    doorways: [...structure.doorways],
  }
}

export function materialToIndex(material) {
  const mapping = {
    "placeholder": 0,
    "structure": 1,
    "grass": 2,
    "leaves": 3,
    "vines": 4,
    "fruit": 5,
    "flower": 6,
    "bark": 7,
    "wood": 8,
    "dirt": 9,
    "sand": 10,
    "stone": 11,
    "stoneAccent": 12,
    "stoneAccent2": 13,
    "stoneRoof": 14,
    "metal": 15,
    "metalAccent": 16,
    "sign": 17,
    "signText": 18,
    "bone": 19,
    "rune": 20,
    "crystal": 21,
  }
  return mapping[material] || 1
}

export function indexToMaterial(index) {
  const mapping = [
    "placeholder",
    "structure",
    "grass",
    "leaves",
    "vines",
    "fruit",
    "flower",
    "bark",
    "wood",
    "dirt",
    "sand",
    "stone",
    "stoneAccent",
    "stoneAccent2",
    "stoneRoof",
    "metal",
    "metalAccent",
    "sign",
    "signText",
    "bone",
    "rune",
    "crystal",
  ]
  return mapping[index] || "structure"
}

export function voxelMaterial(voxel) {
  return indexToMaterial(voxel[0])
}

export function getVoxelMaterial(chunks, position) {
  return indexToMaterial(getVoxel(chunks, position, {index: 0}))
}

export function setVoxelMaterial(chunks, position, material) {
  setVoxel(chunks, position, [materialToIndex(material)])
}

export function voxelSolid(voxel) {
  return voxel[1] & FLAG_SOLID ? true : false
}

export function getVoxelSolid(chunks, position, { emptyChunkSolid=false, }={}) {
  return getVoxel(chunks, position, {index: 1, emptyChunkSolid: emptyChunkSolid}) & FLAG_SOLID ? true : false
}

export function setVoxelSolid(chunks, position, solid) {
  if (solid) {
    setVoxel(chunks, position, [], {flagsAdd: FLAG_SOLID})
  }
  else {
    setVoxel(chunks, position, [], {flagsRemove: FLAG_SOLID})
  }
}

export function voxelShades(voxel) {
  return voxel.slice(PARAMS_UNLIT, PARAMS_LIT)
}

export function getVoxelShades(chunks, position) {
  return getVoxel(chunks, position, {index: [PARAMS_UNLIT, PARAMS_LIT]})
}

export function setVoxelShade(chunks, position, face, shade) {
  const shades = []
  shades[vec3.directionToIndex(face) + PARAMS_UNLIT] = shade
  setVoxel(chunks, position, shades)
}

export function setVoxelShades(chunks, position, shades) {
  setVoxel(chunks, position, [undefined, undefined, ...shades])
}

export function editVoxel(chunks, position, changes) {
  let flagsAdd = 0
  let flagsRemove = 0
  let overwrite = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]

  // Solidity
  if ('solid' in changes) {
    if (changes.solid) {
      flagsAdd |= FLAG_SOLID
    }
    else {
      flagsRemove |= FLAG_SOLID
    }
  }

  // Material
  if ('material' in changes) {
    overwrite[0] = materialToIndex(changes.material)
  }

  // Shades
  if ('shades' in changes) {
    for (let i = 0; i < 6; i ++) {
      overwrite[i+2] = changes.shades[i]
    }
  }

  // Make changes
  setVoxel(chunks, position, overwrite, { flagsAdd, flagsRemove })
}

export function getVoxel(chunks, position, { index=[0, PARAMS_LIT], emptyChunkSolid=false }={}) {

  // Convert world position to chunk coordinate (key to access chunk)
  let chunkKeyStr = ts(positionToChunkKey(position))

  // Get the chunk
  let chunk = chunks[chunkKeyStr]
  // If the chunk doesn't exist, all voxels there are assumed to be empty
  if (!chunk) {
    if (emptyChunkSolid) {
      const empty = [...EMPTY_VOXEL]
      empty[1] |= FLAG_SOLID
      return Array.isArray(index) ? empty.slice(...index) : empty[index]
    }
    else {
      return Array.isArray(index) ? EMPTY_VOXEL.slice(...index) : EMPTY_VOXEL[index]
    }
  }

  // If the chunk is an air chunk, return an air voxel
  if (chunk.mode === 0) {
    return Array.isArray(index) ? EMPTY_VOXEL.slice(...index) : EMPTY_VOXEL[index]
  }

  // Convert world position to the index within the chunk
  let indexInChunk = chunkPositionToChunkIndex(positionToChunkPosition(position))

  // Get a view of the voxel buffer
  let bufferView = new Uint8Array(chunk.voxels);

  // Return the voxel data
  if (chunk.mode === 2) {
    // Lit chunk
    indexInChunk *= PARAMS_LIT
    if (Array.isArray(index)) {
      return bufferView.slice(indexInChunk + index[0], indexInChunk + index[1])
    }
    else {
      return bufferView[indexInChunk + index]
    }
  }
  else {
    // Unlit chunk
    indexInChunk *= PARAMS_UNLIT
    if (Array.isArray(index)) {
      if (index[1] > PARAMS_UNLIT) {
        return [...bufferView.slice(indexInChunk, indexInChunk + PARAMS_UNLIT), ...DEFAULT_SHADING]
      }
      else {
        return bufferView.slice(indexInChunk + index[0], indexInChunk + index[1])
      }
    }
    else {
      if (index >= PARAMS_UNLIT) {
        return EMPTY_VOXEL[index]
      }
      else {
        return bufferView[indexInChunk + index]
      }
    }
  }
}

export function setVoxel(chunks, position, voxel=[], { flagsAdd=0, flagsRemove=0 }={}) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkKeyStr = ts(positionToChunkKey(position))

  // Get the chunk
  let chunk = chunks[chunkKeyStr]

  // If the chunk doesn't exist, don't allow it to be edited
  if (!chunk) {
    return
  }

  // Determine whether we need to upgrade the chunk
  if (
    voxel[2] !== undefined ||
    voxel[3] !== undefined ||
    voxel[4] !== undefined ||
    voxel[5] !== undefined ||
    voxel[6] !== undefined ||
    voxel[7] !== undefined
  ) {
    upgradeChunkToLit(chunk)
  }
  else {
    upgradeChunkToUnlit(chunk)
  }

  // Convert world position to the index within the chunk
  let chunkPosition = positionToChunkPosition(position)
  let params = chunk.mode === 2 ? PARAMS_LIT : PARAMS_UNLIT
  let indexInChunk = chunkPositionToChunkIndex(chunkPosition) * params

  // Get a view of the voxel buffer
  let bufferView = new Uint8Array(chunk.voxels);

  // Merge the data, skipping undefined elements
  const beforeVoxel = bufferView.slice(indexInChunk, indexInChunk + params)
  for (let i = 0; i < params; i ++) {
    if (voxel[i] !== undefined) {
      bufferView[indexInChunk + i] = voxel[i]
    }
  }
  bufferView[indexInChunk + 1] = bufferView[indexInChunk + 1] | flagsAdd
  bufferView[indexInChunk + 1] = ~(~bufferView[indexInChunk + 1] | flagsRemove)
  const afterVoxel = bufferView.slice(indexInChunk, indexInChunk + params)

  // Determine whether we should mark this chunk as modified (so it can be re-meshed)
  if (!chunk.modified) {
    // If the voxel has changed solidity...
    if (voxelSolid(beforeVoxel) !== voxelSolid(afterVoxel)) {
      chunk.modified = true
    }
    // If the voxel is solid and has changed appearance...
    else if (voxelSolid(afterVoxel)) {
      // If the voxel has changed material...
      if (beforeVoxel[0] !== afterVoxel[0]) {
        chunk.modified = true
      }
      // If the voxel is solid and has changed color...
      else {
        for (let i = 2; i < 8; i ++) {
          if (beforeVoxel[i] !== afterVoxel[i]) {
            chunk.modified = true
            break
          }
        }
      }
    }
  }
}

export function mergeStructureIntoWorld(chunks, structure, position = [0, 0, 0], { globalVoxel={} }={}) {
  // Global voxel is used to override certain properties of the structure's voxels

  // Throw error if structure doesn't exist
  if (!structure) {
    throw new Error('Cannot merge empty structure!');
  }

  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const voxel = structure.voxels[sPos]
    const deltaPos = vec3.add(position, stringToArray(sPos))
    editVoxel(chunks, deltaPos, {...voxel, ...globalVoxel})
  }
}

export function mergeStructureIntoStructure(mainStructure, structure, position = [0, 0, 0]) {
  // Offset the structure
  structure = transformStructure(structure, [{mode: "translate", offset: position}])

  // Merge
  Object.assign(mainStructure.voxels, structure.voxels)
  mainStructure.things.push(...structure.things)
  mainStructure.doorways.push(...structure.doorways)
}

export function equals(voxel1, voxel2) {
  // Material
  if ('material' in voxel1 && 'material' in voxel2 && voxel1.material !== voxel2.material) {
    return false
  }

  // Shades
  if ('shades' in voxel1 && 'shades' in voxel2) {
    for (let i = 0; i < 6; i ++) {
      if (voxel1.shades[i] !== voxel2.shades[i]) {
        return false
      }
    }
  }

  // Material
  if ('solid' in voxel1 && 'solid' in voxel2 && voxel1.solid !== voxel2.solid) {
    return false
  }

  // Generator data
  if ('generatorData' in voxel1 && 'generatorData' in voxel2) {
    if (!compareGeneratorData(voxel1.generatorData, voxel2.generatorData)) {
      return false
    }
    if (!compareGeneratorData(voxel2.generatorData, voxel1.generatorData)) {
      return false
    }
  }

  return true
}

export function compareGeneratorData(generatorData, compare) {
  for (const key in compare) {
    // This key is good if both keys are falsy/nonexistant
    if (!generatorData[key] && !compare[key]) {
      continue
    }
    // This key is good if they're equal
    if (generatorData[key] === compare[key]) {
      continue
    }
    // This key is bad, return false
    return false
  }
  // All keys are good, return true
  return true
}

export function checkReservedInWorld(chunks, position, structure) {
  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const deltaPos = vec3.add(stringToArray(sPos), position)

    // Check if the voxel is reserved
    if (getVoxelReserved(chunks, deltaPos)) {
      return true
    }
  }

  return false
}

export function checkReservedInStructure(mainStructure, position, structure) {
  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const deltaPos = vec3.add(stringToArray(sPos), position)
    const voxel = mainStructure.voxels[deltaPos]
    if (voxel) {
      const compare = {
        reserved: true
      }

      // Check if the voxel is reserved
      if (compareGeneratorData(voxel.generatorData, compare)) {
        return true
      }
    }
  }

  return false
}

export function transformPosition(position, transformations) {
  let ret = [...position]
  for (const t of transformations) {
    if (t.mode === 'translate' && t.offset) {
      ret = vec3.add(ret, t.offset)
    }
    else if (t.mode === 'mirror' && t.axis) {
      const origin = t.origin || [0, 0, 0]
      if (t.axis === 'x') {
        ret[0] = ((ret[0] - origin[0]) * -1) + origin[0]
      }
      else if (t.axis === 'y') {
        ret[1] = ((ret[1] - origin[1]) * -1) + origin[1]
      }
      else if (t.axis === 'z') {
        ret[2] = ((ret[2] - origin[2]) * -1) + origin[2]
      }
    }
    else if (t.mode === 'rotate' && t.amount) {
      const origin = t.origin || [0, 0, 0]
      const amount = t.amount % 4
      let a = 0
      let b = 1
      if (t.axis === 'x') {
        a = 1
        b = 2
      }
      else if (t.axis === 'y') {
        a = 0
        b = 2
      }
      if (amount === 1) {
        const sa = ret[a]
        const sb = ret[b]
        ret[a] = ((sb - origin[b]) + origin[a])
        ret[b] = ((sa - origin[b]) * -1) + origin[a]
      }
      else if (amount === 2) {
        ret[a] = ((ret[a] - origin[a]) * -1) + origin[a]
        ret[b] = ((ret[b] - origin[b]) * -1) + origin[b]
      }
      else if (amount === 3) {
        const sa = ret[a]
        const sb = ret[b]
        ret[a] = ((sb - origin[a]) * -1) + origin[b]
        ret[b] = ((sa - origin[a]) + origin[b])
      }
    }
  }
  return ret
}

export function copyConnections(connections) {
  // Deep-copy connection
  let ret = []
  for (const c of connections){
    let newCon = {
      type: c.type,
    }
    if (c.symmetry) {
      newCon.symmetry = [...c.symmetry]
    }
    if (c.mode) {
      newCon.mode = c.mode
    }
    ret.push(newCon)
  }
  return ret
}

// TODO: Implement connection transforms for transforms other than about the z axis
export function transformConnections(connections, transformations) {
  let ret = copyConnections(connections)

  // Apply transformations
  for (const t of transformations) {
    if (t.mode === 'mirror' && t.axis) {
      if (t.axis === 'x') {
        // Move X faces
        const swapper = ret[0]
        ret[0] = ret[3]
        ret[3] = swapper

        // Flip Y side faces
        if (ret[1].symmetry) {
          const swapper = ret[1].symmetry[0]
          ret[1].symmetry[0] = ret[1].symmetry[1]
          ret[1].symmetry[1] = swapper
        }
        if (ret[4].symmetry) {
          const swapper = ret[4].symmetry[0]
          ret[4].symmetry[0] = ret[4].symmetry[1]
          ret[4].symmetry[1] = swapper
        }

        // Flip Z side faces
        if (ret[2].symmetry) {
          const swapper = ret[2].symmetry[0]
          ret[2].symmetry[0] = ret[2].symmetry[2]
          ret[2].symmetry[2] = swapper
        }
        if (ret[5].symmetry) {
          const swapper = ret[5].symmetry[0]
          ret[5].symmetry[0] = ret[5].symmetry[2]
          ret[5].symmetry[2] = swapper
        }
      }
      else if (t.axis === 'y') {
        // Move Y faces
        const swapper = ret[1]
        ret[1] = ret[4]
        ret[4] = swapper

        // Flip X side faces
        if (ret[0].symmetry) {
          const swapper = ret[0].symmetry[0]
          ret[0].symmetry[0] = ret[0].symmetry[1]
          ret[0].symmetry[1] = swapper
        }
        if (ret[3].symmetry) {
          const swapper = ret[3].symmetry[0]
          ret[3].symmetry[0] = ret[3].symmetry[1]
          ret[3].symmetry[1] = swapper
        }

        // Flip Z side faces
        if (ret[2].symmetry) {
          const swapper = ret[2].symmetry[1]
          ret[2].symmetry[1] = ret[3].symmetry[3]
          ret[2].symmetry[3] = swapper
        }
        if (ret[5].symmetry) {
          const swapper = ret[5].symmetry[1]
          ret[5].symmetry[1] = ret[5].symmetry[3]
          ret[5].symmetry[3] = swapper
        }
      }
      else if (axis === 'z') {
        // Move Z faces
        const swapper = ret[2]
        ret[2] = ret[5]
        ret[5] = swapper
      }
    }
    else if (t.mode === 'rotate' && t.amount && t.axis !== 'x' && t.axis !== 'y') {
      const amount = t.amount % 4

      if (amount === 1) {
        // Move side faces
        const swapper = ret[0]
        ret[0] = ret[1]
        ret[1] = ret[3]
        ret[3] = ret[4]
        ret[4] = swapper

        // Rotate top and bottom faces
        if (ret[2].symmetry) {
          const swapper = ret[2].symmetry[0]
          ret[2].symmetry[0] = ret[2].symmetry[1]
          ret[2].symmetry[1] = ret[2].symmetry[2]
          ret[2].symmetry[2] = ret[2].symmetry[3]
          ret[2].symmetry[3] = swapper
        }
        if (ret[5].symmetry) {
          const swapper = ret[5].symmetry[0]
          ret[5].symmetry[0] = ret[5].symmetry[1]
          ret[5].symmetry[1] = ret[5].symmetry[2]
          ret[5].symmetry[2] = ret[5].symmetry[3]
          ret[5].symmetry[3] = swapper
        }

        // Flip sides that changed polarity
        if (ret[1].symmetry) {
          const swapper = ret[1].symmetry[0]
          ret[1].symmetry[0] = ret[1].symmetry[1]
          ret[1].symmetry[1] = swapper
        }
        if (ret[4].symmetry) {
          const swapper = ret[4].symmetry[0]
          ret[4].symmetry[0] = ret[4].symmetry[1]
          ret[4].symmetry[1] = swapper
        }
      }
      else if (amount === 2) {
        // Move side faces
        const swapper = ret[0]
        ret[0] = ret[3]
        ret[3] = swapper

        const swapper2 = ret[1]
        ret[1] = ret[4]
        ret[4] = swapper2

        // Rotate top and bottom faces
        if (ret[2].symmetry) {
          const swapper = ret[2].symmetry[0]
          ret[2].symmetry[0] = ret[2].symmetry[2]
          ret[2].symmetry[2] = swapper

          const swapper2 = ret[2].symmetry[1]
          ret[2].symmetry[1] = ret[2].symmetry[3]
          ret[2].symmetry[3] = swapper2
        }
        if (ret[5].symmetry) {
          const swapper = ret[5].symmetry[0]
          ret[5].symmetry[0] = ret[5].symmetry[2]
          ret[5].symmetry[2] = swapper

          const swapper2 = ret[5].symmetry[1]
          ret[5].symmetry[1] = ret[5].symmetry[3]
          ret[5].symmetry[3] = swapper2
        }

        // Flip sides
        if (ret[0].symmetry) {
          const swapper = ret[0].symmetry[0]
          ret[0].symmetry[0] = ret[0].symmetry[1]
          ret[0].symmetry[1] = swapper
        }
        if (ret[1].symmetry) {
          const swapper = ret[1].symmetry[0]
          ret[1].symmetry[0] = ret[1].symmetry[1]
          ret[1].symmetry[1] = swapper
        }
        if (ret[3].symmetry) {
          const swapper = ret[3].symmetry[0]
          ret[3].symmetry[0] = ret[3].symmetry[1]
          ret[3].symmetry[1] = swapper
        }
        if (ret[4].symmetry) {
          const swapper = ret[4].symmetry[0]
          ret[4].symmetry[0] = ret[4].symmetry[1]
          ret[4].symmetry[1] = swapper
        }
      }
      else if (amount === 3) {
        // Move side faces
        const swapper = ret[4]
        ret[4] = ret[3]
        ret[3] = ret[1]
        ret[1] = ret[0]
        ret[0] = swapper

        // Rotate top and bottom faces
        if (ret[2].symmetry) {
          const swapper = ret[2].symmetry[3]
          ret[2].symmetry[3] = ret[2].symmetry[2]
          ret[2].symmetry[2] = ret[2].symmetry[1]
          ret[2].symmetry[1] = ret[2].symmetry[0]
          ret[2].symmetry[0] = swapper
        }
        if (ret[5].symmetry) {
          const swapper2 = ret[5].symmetry[3]
          ret[5].symmetry[3] = ret[5].symmetry[2]
          ret[5].symmetry[2] = ret[5].symmetry[1]
          ret[5].symmetry[1] = ret[5].symmetry[0]
          ret[5].symmetry[0] = swapper2
        }

        // Flip sides that changed polarity
        if (ret[0].symmetry) {
          const swapper = ret[0].symmetry[0]
          ret[0].symmetry[0] = ret[0].symmetry[1]
          ret[0].symmetry[1] = swapper
        }
        if (ret[3].symmetry) {
          const swapper = ret[3].symmetry[0]
          ret[3].symmetry[0] = ret[3].symmetry[1]
          ret[3].symmetry[1] = swapper
        }
      }
    }
  }
  return ret
}

export function transformStructure(structure, transformations) {
  let ret = emptyStructure()

  // Voxels
  for (const sPos in structure.voxels) {
    const newPos = transformPosition(stringToArray(sPos), transformations)
    ret.voxels[newPos] = structure.voxels[sPos]
  }

  // Things
  if (structure.things) {
    ret.things = [...structure.things]
    for (const thing of ret.things) {
      thing.position = transformPosition(thing.position, transformations)
    }
  }

  // Weight
  ret.weight = structure.weight
  ret.cost = structure.cost
  ret.title = structure.title

  return ret
}

export function traceLineStructure(structure, traceStart, traceEnd, ignoreFirstVoxel=false) {
  return traceLine(structure, traceStart, traceEnd, ignoreFirstVoxel, true)
}

export function traceLine(chunks, traceStart, traceEnd, ignoreFirstVoxel=false, isStructure=false) {
  // Set voxel solidity testing function based on whether we're testing chunks or structure format
  const isSolid = isStructure ?
  (position) => (chunks.voxels[position]?.solid) :
  (position) => getVoxelSolid(chunks, position)

  const xSign = traceEnd[0] > traceStart[0]
  const ySign = traceEnd[1] > traceStart[1]
  const zSign = traceEnd[2] > traceStart[2]
  const moveVector = vec3.normalize(vec3.subtract(traceEnd, traceStart))

  // Check the first voxel
  if (!ignoreFirstVoxel) {
    const hitVoxel = traceStart.map(x => Math.round(x))
    if (isSolid(hitVoxel)) {
      return {
        voxel: hitVoxel,
        position: [...traceStart],
        normal: [0, 0, 0],
        axis: -1,
        distance: 0,
        hit: true,
      }
    }
  }

  const totalDistance = vec3.distance(traceStart, traceEnd)
  let distanceLeft = totalDistance // Distance left to travel
  let curPos = [...traceStart]
  while (distanceLeft > 0) {
    // Figure out how far away the next voxel face is for each axis
    let xDist = Math.abs(((xSign ? 1 : 0) - u.mod(curPos[0]+0.5, 1.0)) / moveVector[0])
    let yDist = Math.abs(((ySign ? 1 : 0) - u.mod(curPos[1]+0.5, 1.0)) / moveVector[1])
    let zDist = Math.abs(((zSign ? 1 : 0) - u.mod(curPos[2]+0.5, 1.0)) / moveVector[2])

    // Handles special cases such an axis's direction being zero
    if (!xDist || xDist < 0.000001) {
      xDist = Infinity
    }
    if (!yDist || yDist < 0.000001) {
      yDist = Infinity
    }
    if (!zDist || zDist < 0.000001) {
      zDist = Infinity
    }

    // Set move distance based on which voxel face was next
    let moveDistance = 0
    let normal = [0, 0, 0]
    let axis = -1
    if (xDist < yDist) {
      if (xDist < zDist) {
        moveDistance = xDist
        normal = [xSign ? -1 : 1, 0, 0]
        axis = 0
      }
      else {
        moveDistance = zDist
        normal = [0, 0, zSign ? -1 : 1]
        axis = 2
      }
    }
    else {
      if (yDist < zDist) {
        moveDistance = yDist
        normal = [0, ySign ? -1 : 1, 0]
        axis = 1
      }
      else {
        moveDistance = zDist
        normal = [0, 0, zSign ? -1 : 1]
        axis = 2
      }
    }

    // Limit movement distance so it doesn't go past traceEnd
    moveDistance = Math.min(moveDistance, distanceLeft)
    distanceLeft -= moveDistance

    // Move
    const hitPos = vec3.add(curPos, vec3.scale(moveVector, moveDistance))
    curPos = vec3.add(hitPos, vec3.scale(normal, -0.0001)) // We move forward a tiny bit on the crossed axis to cross into the next voxel

    // Get the voxel at this position
    const hitVoxel = curPos.map(x => Math.round(x))

    // Check if the hit voxel is solid
    if (isSolid(hitVoxel)) {
      return {
        voxel: hitVoxel,
        position: hitPos,
        normal: normal,
        axis: axis,
        distance: totalDistance - distanceLeft,
        hit: true
      }
    }
  }

  // Base case if it hit nothing
  return {
    voxel: traceEnd.map(x => Math.round(x)),
    position: [...traceEnd],
    normal: [0, 0, 0],
    axis: -1,
    distance: totalDistance,
    hit: false,
  }
}
