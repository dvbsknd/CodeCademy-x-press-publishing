const express = require('express');
const artistRouter = express.Router();
const sql = require('sqlite3').verbose();
const db = new sql.Database(process.env.TEST_DATABASE || './database.sqlite')

artistRouter.param('artistId', (req, res, next, id) => {
    db.get('SELECT * FROM Artist WHERE id = ?', id, (err, row) => {
        if (err) next (err);
        if (!row) {
            res.status(404).send(`${id} not found, sorry.`);
        } else {
            req.artist = row;
            next();
        }
    }) 
});

artistRouter.get('/', (req, res, next) => {
    db.all(
        `SELECT * FROM Artist WHERE is_currently_employed = 1`,
        (err, rows) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({ artists: rows });
            }
        } 
    )
});

artistRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

artistRouter.post('/', (req, res, next) => {
    const artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.status(400).send('Missing data, sorry.');
    } else {
        const query = `INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dob, $bio, $employed);`
        const data = {
            $name: artist.name, 
            $dob: artist.dateOfBirth,
            $bio: artist.biography
        }
        data.$employed = artist.is_currently_employed || 1;
        db.run(query, data, function (err) {
            if (err) next(err);
            db.get(
                `SELECT * FROM Artist WHERE id = ?`, this.lastID, (err, row) => {
                    if (err) next(err);
                    res.status(201).json({ artist: row});
                }
            )
        })
    }
})

artistRouter.put('/:artistId', (req, res, next) => {
    const artistId = req.artist.id;
    const newData = req.body.artist;
    if (!newData.name || !newData.dateOfBirth || !newData.biography) {
        res.status(400).send('Required fields missing.')
    } else {
        const query = 'UPDATE Artist SET name = $name, date_of_birth = $dob, biography = $bio, is_currently_employed = $employed WHERE Artist.id = $id;'
        const data = {
            $name: newData.name, 
            $dob: newData.dateOfBirth,
            $bio: newData.biography,
            $employed: newData.isCurrentlyEmployed,
            $id: artistId
        }
        db.run(query, data, function(err) {
            if (err) next(err);
            db.get('SELECT * FROM Artist WHERE Artist.id = ?', artistId, (err, row) => {
                res.status(200).json({ artist: row });
            })
        })
    }
});

artistRouter.delete('/:artistId', (req, res, next) => {
    const artistId = req.artist.id;
    const query = 'UPDATE Artist SET is_currently_employed = 0;'; 
    db.run(query, function(err) {
        if (err) next(err);
        db.get('SELECT * FROM Artist WHERE Artist.id = ?', artistId, (err, row) => {
            res.status(200).json({ artist: row });
        })
    })
});

module.exports = artistRouter;
