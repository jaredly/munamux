
const $ = x => document.querySelector(x)

const stuff = ['beat', 'chords', 'melody']

const context = new AudioContext()
const buffers = {}

const sources = {}
const nodes = {}
const loading = {}

let start = null
let timer = null

const play = part => {
  if (sources[part]) {
    nodes[part].classList.remove('playing')
    sources[part].stop()
    sources[part].disconnect()
    sources[part] = null
    if (!stuff.filter(p => sources[p]).length) {
      start = null
      clearInterval(timer)
      $('#time').textContent = ''
    }
    return
  }
  if (start === null) {
    start = Date.now()
    timer = setInterval(() => {
      $('#time').textContent = parseInt((Date.now() - start) / 1000)
    }, 200)
    $('#time').textContent = parseInt((Date.now() - start) / 1000)
  }

  nodes[part].classList.add('playing')
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
}

// TODO maybe a global play / pause button

makeButtons()



/*
Promise.all(stuff.map(part => fetch(`./mp3s/munamux ${part}.mp3`)
  .then(res => res.arrayBuffer())
  .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
  .then(buffer => buffers[part] = buffer)
)).then(() => {
  stuff.forEach(part => {
    const node = document.createElement('button')
    nodes[part] = node
    node.className = 'button'
    node.onmousedown = () => {
      play(part)
    }
    node.textContent = part
    $('#root').appendChild(node)
  })
})
*/

