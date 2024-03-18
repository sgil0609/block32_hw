const pg = require('pg');
const express = require('express');
const morgan = require('morgan');

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/ice_cream_shop');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.post('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `INSERT INTO flavors(name, is_favorite, created_at, updated_at) VALUES($1, $2, NOW(), NOW()) RETURNING *`;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors`;
        const response = await client.query(SQL);
        res.send(response.rows); // Send all rows instead of just the first one
    } catch (error) {
        next(error);
    }
});

app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE flavors
            SET name=$1, is_favorite=$2, updated_at=NOW()
            WHERE id=$3 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `DELETE FROM flavors WHERE id = $1`;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
});

const init = async () => {
    try {
        await client.connect();
        console.log('connected to database');
        let SQL = `
            DROP TABLE IF EXISTS flavors;
            CREATE TABLE flavors(
                id SERIAL PRIMARY KEY,
                name TEXT,
                is_favorite BOOLEAN,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
        `;
        await client.query(SQL);
        console.log('tables created');
        SQL = `INSERT INTO flavors(name, is_favorite, created_at, updated_at) VALUES('shaun', TRUE, NOW(), NOW());`;
        await client.query(SQL);
        console.log('data seeded');
        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`listening on port ${port}`));
    } catch (error) {
        console.error("Failed to initialize the database and start the server:", error);
    }
};

init();
