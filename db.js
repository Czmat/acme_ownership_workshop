const pg = require('pg');
const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/acme_ownership_db'
);

client.connect();

const sync = async () => {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS user_things;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS things;
  CREATE TABLE users(
    id UUID PRIMARY KEY default uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    CHECK (char_length(name)> 0)
    );
  CREATE TABLE things(
      id UUID PRIMARY KEY default uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      CHECK (char_length(name)> 0)
      );
  CREATE TABLE user_things(
        id UUID PRIMARY KEY default uuid_generate_v4(),
        "userId" UUID REFERENCES users(id),
        "thingId" UUID REFERENCES things(id),
        --bonus,
        "isFavorite" BOOLEAN default false
        );
  CREATE UNIQUE INDEX ON user_things("userId", "thingId");
  `;

  await client.query(SQL);

  const [Terri, Chaise, work, drawing] = await Promise.all([
    createUser({ name: 'Terri' }),
    createUser({ name: 'Chaise' }),
    createThing({ name: 'work' }),
    createThing({ name: 'drawing' }),
  ]);
  await Promise.all([
    createUserThings({ thingId: drawing.id, userId: Terri.id }),
    createUserThings({ thingId: work.id, userId: Chaise.id }),
  ]);
};

//create functions
const createUser = async ({ name }) => {
  return (
    await client.query('INSERT INTO users(name) VALUES ($1) returning * ', [
      name,
    ])
  ).rows[0];
};

const createThing = async ({ name }) => {
  return (
    await client.query('INSERT INTO things(name) VALUES ($1) returning *', [
      name,
    ])
  ).rows[0];
};

//bonus
const favoriteCount = async (userId, isFavorite) => {
  const userCount = (
    await client.query(
      'SELECT "userId" FROM user_things INNER JOIN users ON users.id = $1  WHERE user_things."isFavorite" = true',
      [userId]
    )
  ).rows;

  if (isFavorite === 'true') {
    return userCount.filter(user => userId === user.userId).length;
  } else {
    return 0;
  }
};

const createUserThings = async ({ thingId, userId, isFavorite }) => {
  if ((await favoriteCount(userId, isFavorite)) < 1) {
    const response = (
      await client.query(
        'INSERT INTO user_things( "thingId", "userId", "isFavorite") VALUES ($1, $2, $3) returning *',
        [thingId, userId, isFavorite || null]
      )
    ).rows[0];
    return response;
  } else {
    throw new Error('Cant add favorite, You can have only one favorite');
  }
};

//read functions
const readUsers = async () => {
  return (await client.query('SELECT * FROM users')).rows;
};

const readThings = async () => {
  return (await client.query('SELECT * FROM things')).rows;
};

const readUserThings = async () => {
  return (await client.query('SELECT * FROM user_things')).rows;
};

//delete functions
const deleteUser = async id => {
  const SQL = 'DELETE FROM users WHERE id=$1';
  await client.query(SQL, [id]);
};

const deleteThing = async id => {
  const SQL = 'DELETE FROM things WHERE id=$1';
  await client.query(SQL, [id]);
};

const deleteUserThings = async id => {
  const SQL = 'DELETE FROM user_things WHERE id=$1';
  await client.query(SQL, [id]);
};

module.exports = {
  sync,
  readUsers,
  createUser,
  createThing,
  createUserThings,
  readUserThings,
  readThings,
  deleteUser,
  deleteThing,
  deleteUserThings,
};
