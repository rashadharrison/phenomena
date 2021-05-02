require('dotenv').config();

const express = require('express');
const apiRouter = require('./api');
const { client } = require('./db');
const cors = require('cors');

const PORT = process.env.port || 3000;
const server = express();
const morgan = require('morgan');

server.use(morgan('dev'));
server.use(express.json());
server.use(cors());
server.use('/api', apiRouter);

client.connect();

server.use((req, res, next) => {
	if (res.status === '404') {
		res.status(404).send('Request failed with status code 404');
	} else if (res.status === 500) {
		res.status(500).send('Request failed with status code 500');
	}
	next();
});

server.listen(PORT, () => {
	console.log('I am listening on port', PORT);
});
