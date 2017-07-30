
const $ = x => document.querySelector(x)

const stuff = ['beat', 'chords', 'melody']

const context = new AudioContext()
const buffers = {}

const sources = {}
const nodes = {}
const loading = {}

const enableds = {}

let start = null
let pause = null
let timer = null

let status = 'play'

const stopPlaying = () => {
  start = null
  clearInterval(timer)
  $('#time').textContent = ''
}

const startPlaying = () => {
  start = pause ? Date.now() - (pause - start) : Date.now()
  pause = null
  timer = setInterval(() => {
    $('#time').textContent = parseInt((Date.now() - start) / 1000)
  }, 200)
  $('#time').textContent = parseInt((Date.now() - start) / 1000)
}

const updateButtons = () => {
  $('#play').classList.toggle('active', status === 'play')
  $('#pause').classList.toggle('active', status === 'pause')
  $('#stop').classList.toggle('active', status === 'stop')
}

const stopPart = part => {
  sources[part].stop()
  sources[part].disconnect()
  sources[part] = null
}

const play = part => {
  if (enableds[part]) {
    enableds[part] = false
    nodes[part].classList.remove('playing')

    if (status === 'play') {
      stopPart(part)

      if (!stuff.filter(p => enableds[p]).length) {
        stopPlaying()
        $('#controls').classList.add('hidden')
      }
    } else if (!stuff.filter(p => enableds[p]).length) {
      $('#controls').classList.add('hidden')
      status = 'play'
      updateButtons()
    }
  } else {
    nodes[part].classList.add('playing')
    enableds[part] = true

    if (status === 'play') {
      if (start === null) {
        startPlaying()
        $('#controls').classList.remove('hidden')
      }
      startPart(part)
    }
  }
}

const startPart = part => {
  const source = context.createBufferSource()
  sources[part] = source
  source.buffer = buffers[part]
  source.connect(context.destination)
  const off = (Date.now() - start) / 1000
  console.log('off', off)
  source.loop = true
  source.start(0, off % buffers[part].duration)
}

const wait = num => new Promise(r => setTimeout(r, num))

const load = part => fetch(`./mp3s/munamux ${part}.mp3`)
  // This is to test loading latency
  // .then(res => wait(2 * 1000).then(() => res))
  .then(res => res.arrayBuffer())
  .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
  .then(buffer => buffers[part] = buffer)

const makeButtons = () => {
  stuff.forEach(part => {
    const node = document.createElement('button')
    nodes[part] = node
    enableds[part] = false
    node.className = 'button'
    node.onmousedown = () => {
      if (buffers[part]) return play(part)
      if (loading[part]) return // maybe cancel it?
      loading[part] = true
      load(part).then(() => play(part))
    }
    node.textContent = part
    $('#root').appendChild(node)
  })

  $('#play').onmousedown = () => {
    if (status === 'play') return
    status = 'play'
    updateButtons()
    startPlaying()
    stuff.forEach(part => {
      if (enableds[part]) startPart(part)
    })
  }

  $('#pause').onmousedown = () => {
    if (status === 'pause') return
    if (status === 'play') {
      pause = Date.now()
      stuff.forEach(part => {
        if (enableds[part]) stopPart(part)
      })
      clearInterval(timer)
    }
    status = 'pause'
    updateButtons()
  }

  $('#stop').onmousedown = () => {
    if (status === 'stop') return
    pause = null
    if (status === 'play') {
      stopPlaying()
      stuff.forEach(part => {
        if (enableds[part]) stopPart(part)
      })
    }
    status = 'stop'
    updateButtons()
  }
}

makeButtons()

