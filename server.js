const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');

app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//Additional routes here
//GET, POST, DELETE for /api/users
//GET, POST, DELETE for /api/things
//GET, POST, DELETE for /api/user_things
app.get('/api/users', (req, res, next) => {
  db.readUsers()
    .then(users => {
      //console.log('USERS', users);
      res.send(users);
    })
    .catch(next);
});

app.get('/api/things', (req, res, next) => {
  db.readThings()
    .then(things => {
      res.send(things);
    })
    .catch(next);
});

app.get('/api/user_things', (req, res, next) => {
  db.readUserThings()
    .then(userThings => {
      res.send(userThings);
    })
    .catch(next);
});

app.post('/api/users', (req, res, next) => {
  console.log(req.body);
  db.createUser(req.body)
    .then(response => {
      res.send(response);
    })
    .catch(next);
});

app.post('/api/user_things', (req, res, next) => {
  console.log(req.body);
  db.createUserThings(req.body)
    .then(response => {
      res.send(response);
    })
    .catch(next);
});

app.post('/api/things', (req, res, next) => {
  console.log(req.body);
  db.createThing(req.body)
    .then(response => {
      res.send(response);
    })
    .catch(next);
});

app.delete('/api/users/:id', (req, res, next) => {
  const id = req.params.id;
  db.deleteUser(id)
    .then(response => res.send(response))
    .catch(next);
});

app.delete('/api/things/:id', (req, res, next) => {
  const id = req.params.id;
  db.deleteThing(id)
    .then(response => res.send(response))
    .catch(next);
});

app.delete('/api/user_things/:id', (req, res, next) => {
  const id = req.params.id;
  db.deleteUserThings(id)
    .then(response => res.send(response))
    .catch(next);
});

app.use((req, res, next) => {
  next({
    status: 404,
    message: `Page not found for ${req.method} ${req.url}`,
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    message: err.message || JSON.stringify(err),
  });
});

const port = process.env.PORT || 3000;

db.sync().then(() => {
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
});
