import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import request from 'request'

const app = express()

app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 1881
const url = process.env.URL || 'http://192.168.10.70/live'

app.get('/live', async (_, res) => {
    console.log(port, url)
    request({
        url: url,
        encoding: null,
    },
        (error, response, _) => {
            if (!error && response.body) {
                res.set("Content-Type", "image/jpeg")
                res.send(response.body)
            } else {
                res.status(500).json({ 'errorCode': error.code })
            }
        })
})

app.listen(port, () => {
    console.log(`Listening at https://localhost:${port}`)
})