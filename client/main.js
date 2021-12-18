const xhr = new XMLHttpRequest();

const liveVideo = document.getElementById('live-video')

const APP_URL = window.location.hostname === 'localhost' ? 'http://localhost:1881/' : 'https://server.djupvik.dev/';

liveVideo.setAttribute('src', APP_URL + 'live')

function cum() {
    xhr.open('POST', APP_URL + 'notify')
    
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return

        alert(xhr.responseText)
    }

    xhr.send()
}