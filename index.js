import { createServer as createHttp } from "node:http";
import axios from "axios"
import express from "express";

const PORT = 3000;
const CHUNK_COUNT = 20; // equal to 20sec of request time, each chunk simulates 1sec
const AXIOS_TIMEOUT = 5000; // we have timeout eq to 5sec lets say

const sleepFor = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const app = express();
app.use(express.json());

app.post("/regular", (req, res) => {
    sleepFor(20_000).then(() => {
        res.status(200).send({});
    })
});

app.post("/chunk", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
    });

    const chunks = new Array(CHUNK_COUNT).fill(null);

    const sendChunks = (chunks) => {
        chunks.shift();
        if (!chunks.length) {
            console.log('Finalize the request')
            res.end();
            return Promise.resolve();
        }
        return sleepFor(1_000).then(() => {
            console.log('Keep sending chunks', 20 - chunks.length, 's')
            res.write(JSON.stringify({ foo: "bar" }) + "\r\n");
            return sendChunks(chunks)
        })
    };

    sendChunks(chunks);
});

const server = createHttp(app)

const sendRequest = (url) => {
    const start = new Date().getTime()
    console.log(url, 'Start request')
    return axios.request({
        method: "POST",
        url,
        timeout: AXIOS_TIMEOUT,
    })
        .then(() => {
            console.log(url, 'Request was successful')
        })
        .catch(err => {
            console.error(url, 'Request failed', err.message)
        })
        .finally(() => {
            const end = new Date().getTime()
            console.log(url, 'Request took', Math.floor((end-start) / 1000), 's\n\n')
        })
}

server.listen(PORT, async () => {
    const url = `http://localhost:3000`
    console.log('server is running', url)

    await sendRequest(`${url}/regular`)
    await sendRequest(`${url}/chunk`)
})