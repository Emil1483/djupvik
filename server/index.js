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

app.get('/:x', (req, res) => {
    request.get(url + req.params.x).pipe(res)
})

app.post('/:x', (req, res) => {
    request.post(url + req.params.x).pipe(res)
})


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})