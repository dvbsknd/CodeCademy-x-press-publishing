const express = require('express');
const seriesRouter = express.Router();
const issuesRouter = require('./issues.js');
const sql = require('sqlite3').verbose();
const db = new sql.Database(process.env.TEST_DATABASE || './database.sqlite')

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get('SELECT * FROM Series WHERE id = ?', id, (err, row) => {
        if (err) next (err);
        if (!row) {
            res.status(404).send(`${id} not found, sorry.`);
        } else {
            req.series = row;
            next();
        }
    }) 
});

seriesRouter.get('/', (req, res, next) => {
    db.all(
        `SELECT * FROM Series`, 
        (err, rows) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({ series: rows });
            }
        } 
    )
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({ series: req.series });
});

seriesRouter.post('/', (req, res, next) => {
    const series = req.body.series;
    if (!series.name || !series.description) {
        res.status(400).send('Missing data, sorry.');
    } else {
        const query = `INSERT INTO Series (name, description) VALUES ($name, $description);`
        const data = {
            $name: series.name, 
            $description: series.description
        }
        db.run(query, data, function (err) {
            if (err) next(err);
            db.get(
                `SELECT * FROM Series WHERE id = ?`, this.lastID, (err, row) => {
                    if (err) next(err);
                    res.status(201).json({ series: row});
                }
            )
        })
    }
})

seriesRouter.put('/:seriesId', (req, res, next) => {
    const seriesId = req.series.id;
    const newData = req.body.series;
    if (!newData.name || !newData.description) {
        res.status(400).send('Required fields missing.')
    } else {
        const query = 'UPDATE Series SET name = $name, description = $description WHERE Series.id = $id;'
        const data = {
            $name: newData.name, 
            $description: newData.description,
            $id: seriesId
        }
        db.run(query, data, function(err) {
            if (err) next(err);
            db.get('SELECT * FROM Series WHERE Series.id = ?', seriesId, (err, row) => {
                res.status(200).json({ series: row });
            })
        })
    }
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const seriesId = req.series.id;
    const query = 'UPDATE Series SET is_currently_employed = 0;'; 
    db.run(query, function(err) {
        if (err) next(err);
        db.get('SELECT * FROM Series WHERE Series.id = ?', seriesId, (err, row) => {
            res.status(200).json({ series: row });
        })
    })
});

module.exports = seriesRouter;
