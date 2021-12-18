import axios from 'axios'
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

app.get('/frame', async (_, res) => {
    request({
        url: url + 'frame',
        encoding: null,
    },
        (error, response, _) => {
            if (!error && response.body) {
                res.set('Content-Type', 'image/jpeg')
                res.send(response.body)
            } else {
                res.status(500).json({ 'errorCode': error.code })
            }
        })
})

app.get('/live', function(_, res) {
    request.get(url + 'live').pipe(res)
})

app.post('/:x', async (req, res) => {
    try {
        const result = await axios.post(url + req.params.x)

        console.log(result)

        res.send(result.data)
    } catch (e) {
        const error = e.toJSON()
        res.status(error.status).json(error)
    }
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})