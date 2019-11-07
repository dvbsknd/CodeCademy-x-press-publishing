const express = require('express');
const issuesRouter = express.Router({mergeParams: true});
const sql = require('sqlite3').verbose();
const db = new sql.Database(process.env.TEST_DATABASE || './database.sqlite')

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get('SELECT * FROM Issue WHERE id = ? AND series_id = ?', id, req.series.id, (err, row) => {
        if (err) next (err);
        if (!row) {
            res.status(404).send(`Issue ${id} for Series ${req.series.id} does not exist.`);
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
    let newData = req.body.issue;
    if (newData.artistId) {
        db.get(
            `SELECT * FROM Artist WHERE Artist.id = ?`,
            newData.artistId,
            (err, row) => {
                if (err) next(err);
                if (row && newData.name && newData.issueNumber && newData.publicationDate) {
                    const query = `
                        UPDATE Issue SET
                            name = $name,
                            issue_number = $issueNumber,
                            publication_date = $publicationDate,
                            artist_id = $artistId,
                            series_id = $seriesId
                        WHERE Issue.id = $id;`
                    const data = {
                        $id: issueId,
                        $name: newData.name,
                        $issueNumber: newData.issueNumber,
                        $publicationDate: newData.publicationDate,
                        $artistId: newData.artistId,
                        $seriesId: req.series.id
                    }
                    db.run(query, data, function(err) {
                        if (err) next(err);
                        db.get('SELECT * FROM Issue WHERE Issue.id = ?', issueId, (err, row) => {
                            res.status(200).json({ issue: row });
                        })
                    })
                } else {
                    res.status(400).send('Required fields missing.');
                }
            }
        );
    } else {
        res.status(400).send('Required fields missing.')
    }
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    console.log(req.issue.id);
    db.run('DELETE FROM Issue WHERE Issue.id = ?', req.issue.id, function(err) {
        if (err) next(err);
        res.status(204).send('Deleted.');
    })
});

module.exports = issuesRouter;
