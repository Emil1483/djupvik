import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import request from 'request'

const app = express()

app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 1881
const url = process.env.URL || 'http://192.168.10.70/'

// {
// <ip_address>: {
//    last_call_at: DateTime
//    sessions: [<DateTime>...]
//    data: {<from ip-api>}
//   }
// }

const ips = {}

app.use((req, _, next) => {
    const ip = req.socket.remoteAddress.split(':').reverse()[0]

    if (!(ip in ips)) {
        let data = null

        request.get(`http://ip-api.com/json/${ip}`, null, (e, _, body) => {
            if (e) return

            if (body.status != 'success') return

            data = body
        })

        ips[ip] = {
            lastCall: Date.now(),
            sessions: [Date.now()],
            data: data
        }
    } else {
        ips[ip].lastCall = Date.now()

        const prevTime = ips[ip].sessions[ips[ip].sessions.length - 1]

        const diffMillis = Date.now() - prevTime

        if (req.method == 'POST' || diffMillis / 1000 > 10) {
            ips[ip].sessions.push(Date.now())
        } else {
            ips[ip].sessions[ips[ip].sessions.length - 1] = Date.now()
        }
    }

    console.log(ips)

    next()
})

app.use((req, res, next) => {
    const ip = req.socket.remoteAddress.split(':').reverse()[0]
    
    const recentSessions = ips[ip].sessions.filter((date) => {
        const diffMillis = Date.now() - date
        return diffMillis / (1000 * 60 * 60) < 12
    })

    if (recentSessions.length > 30) {
        res.status(403).send('too many requests')
        return
    }

    next()
})

app.get('/:x', (req, res) => {
    const endpoint = url + req.params.x
    const headers = { 'x-forwarded-for': req.socket.remoteAddress }

    request.get({
        url: endpoint,
        headers: headers,
    }).pipe(res)
})

app.post('/:x', (req, res) => {
    const endpoint = url + req.params.x
    const headers = { 'x-forwarded-for': req.socket.remoteAddress }

    request.post({
        url: endpoint,
        headers: headers,
    }).pipe(res)
})


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})