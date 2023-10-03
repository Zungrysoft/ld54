import * as u from './utils.js'
import * as vec3 from './vector3.js'
import { assets } from './game.js'

// Initialize the AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let soundVolume = 1
let musicVolume = 1
let currentSounds = []
let currentMusic = []

// soundDef should be a string, the key of the sound in the assets.sounds object
// soundDef can also be a list of these strings, and it will play the least recently played
export function playSound (soundDef, volume = 1, pitchRange = [0.9, 1.1], position=[0, 0, 0]) {
  if (Array.isArray(soundDef)) {
    const soundList = soundDef
    playSound(soundList.reduce((best, now) => (
      ((assets.sounds[best].lastPlayedTime || 0) < (assets.sounds[now].lastPlayedTime || 0)) ? best : now
    )), volume, pitchRange, position)
    return
  }

  const sound = assets.sounds[soundDef]
  sound.internalVolume = volume
  sound.volume = soundVolume * volume
  sound.currentTime = 0
  sound.playbackRate = (
    typeof pitchRange === 'number'
      ? pitchRange
      : u.random(...pitchRange)
  )
  sound.preservesPitch = false
  sound.lastPlayedTime = (new Date()).valueOf()
  currentSounds.push(sound)
  sound.play()

  // Set positional audio position
  if (sound.isPositional) {
    try {
      sound.pannerObject.positionX.setValueAtTime(position[0], audioContext.currentTime);
      sound.pannerObject.positionY.setValueAtTime(position[2], audioContext.currentTime);
      sound.pannerObject.positionZ.setValueAtTime(position[1], audioContext.currentTime);
    }
    catch (error) {
      console.error('Error setting position of sound' + soundDef + ': ', error);
    }
  }

  return sound
}

export function playMusic (musicName, volume = 1) {
  const music = assets.sounds[musicName]
  music.internalVolume = volume
  music.volume = musicVolume * volume
  music.currentTime = 0
  music.loop = true
  currentMusic.push(music)
  music.play()
  return music
}

export function setSoundVolume (volume = 1) {
  soundVolume = u.clamp(Number(volume), 0, 1)
}

export function setMusicVolume (volume = 1) {
  musicVolume = u.clamp(Number(volume), 0, 1)
}

export function getSoundVolume () {
  return soundVolume
}

export function getMusicVolume () {
  return musicVolume
}

export function update () {
  {
    let i = 1
    while (i < currentSounds.length) {
      if (currentSounds[i].paused) {
        currentSounds.splice(i, 1)
      } else {
        currentSounds[i].volume = soundVolume * currentSounds[i].internalVolume
        i += 1
      }
    }
  }

  {
    let i = 1
    while (i < currentMusic.length) {
      if (currentMusic[i].paused) {
        currentMusic.splice(i, 1)
      } else {
        currentMusic[i].volume = musicVolume * currentMusic[i].internalVolume
        i += 1
      }
    }
  }
}

export function reset () {
  for (const sound of Object.values(assets.sounds)) {
    sound.pause()
    sound.wasPlayingWhenPaused = false
  }
  currentSounds = []
  currentMusic = []
}

export function pause () {
  for (const sound of Object.values(assets.sounds)) {
    sound.wasPlayingWhenPaused = !sound.paused
    sound.pause()
  }
}

export function unpause () {
  for (const sound of Object.values(assets.sounds)) {
    if (sound.wasPlayingWhenPaused) {
      sound.play()
    }
  }
}

export function configurePositionalSound(soundDef=[]) {
  if (Array.isArray(soundDef)) {
    for (const entry of soundDef) {
      configurePositionalSound(entry)
    }
    return
  }

  try {
    const sound = assets.sounds[soundDef]

    if (!sound) {
      throw new Error("Could not find sound " + soundDef)
    }

    // If the sound is already positional, skip
    if (sound.isPositional) {
      return
    }

    // Create a sound source from the audio element
    const soundSource = audioContext.createMediaElementSource(sound);

    // Create a panner node
    const panner = audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'exponential';
    panner.refDistance = 8;
    panner.maxDistance = 1000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360; // Full sphere
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

    // Connect the nodes and allow the audio element to control playback
    soundSource.disconnect();
    soundSource.connect(panner);
    panner.connect(audioContext.destination);

    // Save references to these objects in the audio element so we can access them later
    sound.pannerObject = panner
    sound.isPositional = true

  } catch (error) {
    console.error('Error configuring spatial audio:', error);
  }
}

// Updates a sound effect's audio context to change where it's being heard from
export function updateSoundPan(position, lookVector) {
  audioContext.listener.positionX.setValueAtTime(position[0], audioContext.currentTime);
  audioContext.listener.positionY.setValueAtTime(position[2], audioContext.currentTime);
  audioContext.listener.positionZ.setValueAtTime(position[1], audioContext.currentTime);

  audioContext.listener.forwardX.setValueAtTime(lookVector[0], audioContext.currentTime);
  audioContext.listener.forwardY.setValueAtTime(lookVector[2], audioContext.currentTime);
  audioContext.listener.forwardZ.setValueAtTime(lookVector[1], audioContext.currentTime);

  // Configure up direction
  audioContext.listener.upX.setValueAtTime(0, audioContext.currentTime);
  audioContext.listener.upY.setValueAtTime(1, audioContext.currentTime);
  audioContext.listener.upZ.setValueAtTime(0, audioContext.currentTime);

  // Disable doppler effect
  audioContext.listener.dopplerFactor = 0;
}





