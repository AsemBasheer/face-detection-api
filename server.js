const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'test1',
        database: 'face-detection'
    }
});

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json(database)
})

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            bcrypt.compare(req.body.password, data[0].hash,
                function (err, result) {
                    if (result) {
                        return db.select('*').from('users')
                            .where('email', '=', req.body.email)
                            .then(user => {
                                res.json(user[0])
                            }).catch(err => res.status(400).json('error'))
                    } else {
                        res.status(400).json('wrong credentials')
                    }
                })
        }).catch(err => res.status(400).json('ERROR'))
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const saltRounds = 10;
    if (name !== "" & email !== "" & password !== "") {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            db.transaction(trx => {
                trx.insert({
                    email: email,
                    hash: hash
                })
                    .into('login')
                    .returning('email')
                    .then(loginEmail => {
                        return trx('users')
                            .returning('*')
                            .insert({
                                email: loginEmail[0],
                                name: name,
                                joined: new Date()
                            }).then(user => {
                                res.json(user[0]);
                            })
                    }).then(trx.commit).catch(trx.rollback)
            }).catch(err => res.status(400).json(err))
        })
    }else{
        res.status(400).json('empty fields');
    }
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id }).then(user => {
        if (user.length) {
            res.json(user[0]);
        }
        else {
            res.status(404).json('not found');
        }
    }).catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0])
        }).catch(err => res.status(400).json('error'))
})

app.listen(3000)