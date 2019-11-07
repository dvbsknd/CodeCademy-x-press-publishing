const express = require('express');
const issuesRouter = express.Router({mergeParams: true});
const sql = require('sqlite3').verbose();
const db = new sql.Database(process.env.TEST_DATABASE || './database.sqlite')

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get('SELECT * FROM Issue WHERE id = ? AND series_id = ?', id, req.series.id, (err, row) => {
        if (err) next (err);
        if (!row) {
            res.status(404).send(`${id} not found, sorry.`);
        } else {
            req.issue = row;
            next();
        }
    }) 
});

issuesRouter.get('/', (req, res, next) => {
    db.all(
        `SELECT * FROM Issue WHERE series_id = ?`,
        req.series.id,
        (err, rows) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({ issues: rows });
            }
        } 
    )
});

issuesRouter.get('/:issueId', (req, res, next) => {
    res.status(200).json({ issue: req.issue });
});

issuesRouter.post('/', (req, res, next) => {
    const issue = req.body.issue;
    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        res.status(400).send('Missing data, sorry.');
    } else if (issue.artistId) {
        db.get('SELECT * FROM Artist WHERE id = ?', issue.artistId, (err, row) => {
            if (err) next(err);
            if (!row) {
                res.status(400).send('Missing artist, sorry.'); 
            } else {
                const query = `
                    INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)
                    VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId);`
                const data = {
                    $name: issue.name,
                    $issueNumber: issue.issueNumber,
                    $publicationDate: issue.publicationDate,
                    $artistId: issue.artistId,
                    $seriesId: req.series.id
                }
                db.run(query, data, function (err) {
                    if (err) next(err);
                    db.get(
                        `SELECT * FROM Issue WHERE id = ?`, this.lastID, (err, row) => {
                            if (err) next(err);
                            res.status(201).json({ issue: row});
                        }
                    )
                })
            }
        });
    };
});

issuesRouter.put('/:issueId', (req, res, next) => {
    const issueId = req.issue.id;
    const newData = req.body.issue;
    if (!newData.name || !newData.description) {
        res.status(400).send('Required fields missing.')
    } else {
        const query = 'UPDATE Issue SET name = $name, description = $description WHERE Issue.id = $id;'
        const data = {
            $name: newData.name, 
            $description: newData.description,
            $id: issueId
        }
        db.run(query, data, function(err) {
            if (err) next(err);
            db.get('SELECT * FROM Issue WHERE Issue.id = ?', issueId, (err, row) => {
                res.status(200).json({ issue: row });
            })
        })
    }
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    const issueId = req.issue.id;
    const query = 'UPDATE Issue SET is_currently_employed = 0;'; 
    db.run(query, function(err) {
        if (err) next(err);
        db.get('SELECT * FROM Issue WHERE Issue.id = ?', issueId, (err, row) => {
            res.status(200).json({ issue: row });
        })
    })
});

module.exports = issuesRouter;
