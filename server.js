const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');
const express = require('express');
const apiRouter = require('./api/api.js');

const app = express();
const PORT = process.env.PORT || 4000;
const middleware = [
    bodyParser.json(),
    errorHandler(),
    cors(),
    morgan('dev')
];

app.use(middleware);
app.use('/api', apiRouter);

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

module.exports = app;
