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

app.set('trust proxy', true)

const port = process.env.PORT || 1881
const url = process.env.URL || 'http://192.168.10.70/'

const asyncRequest = async (value) =>
    new Promise((resolve, reject) => {
        request(value, (error, _, data) => {
            if (error) reject(error)
            else resolve(data)
        })
    })

const ips = {}

function calculateSessions(ip) {
    if (!(ip in ips)) return [Date.now()]

    if (!ips[ip].data) return [Date.now()]

    if (ips[ip].data.countryCode == 'NO') return [Date.now()]

    return new Array(2).fill(Date.now())
}

app.use(async (req, _, next) => {
    if (!(req.ip in ips)) {
        let data = null

        const result = await asyncRequest({
            url: `http://ip-api.com/json/${req.ip}`,
            json: true,
        })

        if (result['status'] == 'success') {
            data = result
        }

        ips[req.ip] = {
            lastCall: Date.now(),
            data: data
        }

        ips[req.ip].sessions = calculateSessions(req.ip)
    } else {
        const lastCall = ips[req.ip].lastCall

        ips[req.ip].lastCall = Date.now()

        const diffMillis = Date.now() - lastCall

        if (req.method == 'POST' || diffMillis / 1000 > 10) {
            ips[req.ip].sessions.push(...calculateSessions(req.ip))
        } else {
            ips[req.ip].sessions[ips[req.ip].sessions.length - 1] = Date.now()
        }
    }

    console.log(ips)

    next()
})

app.use((req, res, next) => {
    const recentSessions = ips[req.ip].sessions.filter((date) => {
        const diffMillis = Date.now() - date
        return diffMillis / (1000 * 60 * 60) < 3
    })

    if (recentSessions.length > 5) {
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