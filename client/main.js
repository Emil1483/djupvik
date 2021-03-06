const xhr = new XMLHttpRequest();

const liveImageDiv = document.getElementById('live-image')
const liveImageDivTemp = document.getElementById('live-image-temp')
const liveVideo = document.getElementById('live-video')
const sayForm = document.getElementById('say')

const PI_URL = 'https://192.168.10.69:5000/'
const APP_URL = 'https://server.djupvik.dev/';

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
    const response = await fetch(APP_URL + 'frame?=' + new Date().getTime())
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

let requestSent = false

xhr.open('GET', PI_URL)

xhr.onreadystatechange = () => {
    if (xhr.readyState !== xhr.DONE) return

    requestSent = true

    if (xhr.status == 200) {
        liveVideo.setAttribute('src', PI_URL + 'live')
    } else {
        updateImg()
        setInterval(updateImg, 1500)
    }
}

xhr.send()

sleep(1000).then(() => {
    if (requestSent) return
    xhr.abort()
    updateImg()
    setInterval(updateImg, 1500)
})

function notify() {
    xhr.open('POST', APP_URL + 'notify')

    xhr.onreadystatechange = () => {
        if (xhr.readyState !== xhr.DONE) return

        alert(xhr.responseText)
    }

    xhr.send()
}

sayForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const formData = new FormData(sayForm)
    const sayInput = formData.get('say-input')

    xhr.open('POST', APP_URL + 'say')

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")

    xhr.onreadystatechange = () => {
        if (xhr.readyState !== xhr.DONE) return

        alert(xhr.responseText)
    }

    xhr.send(JSON.stringify({'text': sayInput}))
})