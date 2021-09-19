const liveImageDiv = document.getElementById('live-image')
const liveImageDivTemp = document.getElementById('live-image-temp')

const APP_URL = window.location.hostname === 'localhost' ? 'http://localhost:1881/live' : 'https://api.djupvik.dev/live';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function image(url) {
    const img = new Image()
    img.src = url
    return img
}

const show = (element) => element.style.display = 'block'
const hide = (element) => element.style.display = 'none'

hide(liveImageDivTemp)

const updateImg = (async function () {
    const response = await fetch(APP_URL + '?=' + new Date().getTime())
    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    show(liveImageDivTemp)
    hide(liveImageDiv)

    liveImageDiv.replaceChildren(image(url))

    await sleep(10)

    hide(liveImageDivTemp)
    show(liveImageDiv)

    liveImageDivTemp.replaceChildren(image(url))
})

updateImg()
// setInterval(updateImg, 5000)