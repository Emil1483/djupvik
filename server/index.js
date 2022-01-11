import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import request from 'request'

const app = express()

app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.json());

app.set('trust proxy', true)

const port = process.env.PORT || 1881
const url = process.env.URL || 'https://192.168.10.69:5000/'
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const limits = {
    'GET /frame': 3,
    'POST /notify': 5,
    'POST /say': 2
}

const limitsNO = {
    'GET /frame': 6,
    'POST /notify': 6,
    'POST /say': 8
}

const asyncRequest = async (value) =>
    new Promise((resolve, reject) => {
        request(value, (error, _, data) => {
            if (error) reject(error)
            else resolve(data)
        })
    })

function endpointOf(req) {
    return `${req.method} ${req.url.split('?')[0]}`
}

const ips = {}

app.use(async (req, _, next) => {
    if (!(req.ip in ips)) {
        let data = null

        try {
            const result = await asyncRequest({
                url: `http://ip-api.com/json/${req.ip}`,
                json: true,
            })

            if (result['status'] == 'success') {
                data = result
            }
        } catch (e) {
            console.log('could not get ip data', e)
        }

        ips[req.ip] = {
            lastCall: Date.now(),
            data: data,
            sessions: {}
        }
    }

    next()
})

app.use((req, res, next) => {
    const endpoint = endpointOf(req)
    const ip = req.ip

    if (!(endpoint in ips[ip].sessions)) {
        next()
        return
    }

    const fromNorway = ips[ip].data == null || ips[ip].data.countryCode == 'NO'
    const activeLimits = fromNorway ? limitsNO : limits

    if (!(endpoint in activeLimits)) {
        next()
        return
    }

    const limit = activeLimits[endpoint]
    const sessions = ips[ip].sessions[endpoint].sessions
    const count = sessions.filter((session) => {
        const diff = Date.now() - session
        return diff < 1000 * 60 * 60 * 2
    }).length

    if (count >= limit) {
        res.status(403).send(`too many requests for endpoint ${endpoint}. You can max make ${limit} requests`)
        return
    }

    next()
})

app.use((req, _, next) => {
    const endpoint = endpointOf(req)
    const ip = req.ip

    if (!(endpoint in ips[ip].sessions)) {
        ips[ip].sessions[endpoint] = { sessions: [] }
    }

    if (endpoint == 'GET /frame') {
        const lastCall = ips[ip].sessions[endpoint].lastCall

        if (Date.now() - lastCall > 1000 * 5) {
            ips[ip].sessions[endpoint].sessions.push(Date.now())
        }

        ips[ip].sessions[endpoint].lastCall = Date.now()
        next()
        return
    }

    ips[ip].sessions[endpoint].sessions.push(Date.now())
    ips[ip].sessions[endpoint].lastCall = Date.now()

    next()
})

function getHeaders(req) {
    const headers = { 'x-forwarded-for': req.socket.remoteAddress }

    if ('authorization' in req.headers) {
        headers['authorization'] = req.headers.authorization
    }

    return headers
}

function dictToPath(dict) {
    let result = ''

    for (let i = 0; i < 10; i++) {
        const char = String.fromCharCode(97 + i)
        if (!(char in dict)) break
        result += '/' + dict[char]

    }

    return result
}

let endpoint = ''
for (let i = 0; i < 10; i++) {
    endpoint += '/'

    app.get(endpoint, (req, res) => {
        const headers = getHeaders(req)

        request.get({
            url: url + dictToPath(req.params),
            headers: headers,
        }).pipe(res)
    })

    app.post(endpoint, (req, res) => {
        const headers = getHeaders(req)

        request.post({
            url: url + dictToPath(req.params),
            headers: headers,
            body: req.body,
            json: true,
        }).pipe(res)
    })

    endpoint += ':'
    endpoint += String.fromCharCode(97 + i)
}


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})