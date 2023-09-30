import * as vox from './voxel.js'
import * as game from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as pal from './palette.js'
import * as u from './core/utils.js'

export const LIGHTING_HARD_CUTOFF = 16
export const BOUNCES = 1

export function lightingPass(light) {
  const [px, py, pz] = light.position
  const terrain = game.getThing('terrain')

  // Iterate over voxels in radius
  for (let x = px-LIGHTING_HARD_CUTOFF; x <= px+LIGHTING_HARD_CUTOFF; x ++) {
    for (let y = py-LIGHTING_HARD_CUTOFF; y <= py+LIGHTING_HARD_CUTOFF; y ++) {
      for (let z = pz-LIGHTING_HARD_CUTOFF; z <= pz+LIGHTING_HARD_CUTOFF; z ++) {
        // Create position vector
        const pos = [x, y, z]

        // Check if this is a solid voxel
        if (vox.getVoxelSolid(terrain.chunks, pos)) {
          let shades = [0, 0, 0, 0, 0, 0]

          // Iterate over faces

          // +X
          if (x + 0.5 < px) {
            const fPos = vec3.add(pos, [0.55, 0, 0])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([1, 0, 0], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[3] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }
          // -X
          if (x - 0.5 > px) {
            const fPos = vec3.add(pos, [-0.55, 0, 0])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([-1, 0, 0], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[0] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }

          // +Y
          if (y + 0.5 < py) {
            const fPos = vec3.add(pos, [0, 0.55, 0])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([0, 1, 0], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[4] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }
          // -Y
          if (y - 0.5 > py) {
            const fPos = vec3.add(pos, [0, -0.55, 0])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([0, -1, 0], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[1] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }

          // +Z
          if (z + 0.5 < pz) {
            const fPos = vec3.add(pos, [0, 0, 0.55])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([0, 0, 1], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[5] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }
          // -Z
          if (z - 0.5 > pz) {
            const fPos = vec3.add(pos, [0, 0, -0.55])
            const trace = terrain.traceLine(fPos, light.position)
            if (!trace.hit) {
              const incidence = vec3.dotProduct([0, 0, -1], vec3.normalize(vec3.subtract(light.position, fPos)))
              const shade = (light.brightness * incidence) / Math.pow(trace.distance, 2)
              shades[2] = u.clamp(Math.floor(shade), 0, pal.MAX_SHADE)
            }
          }

          // Apply the new shading data
          vox.setVoxelShades(terrain.chunks, pos, shades)
        }
      }
    }
  }
}