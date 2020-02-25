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
        "thingId" UUID REFERENCES things(id)
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

//Additional methods here for reading, creating, destroying
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

const createUserThings = async ({ thingId, userId }) => {
  return (
    await client.query(
      'INSERT INTO user_things( "thingId", "userId") VALUES ($1, $2) returning *',
      [thingId, userId]
    )
  ).rows[0];
};

const readUsers = async () => {
  return (await client.query('SELECT * FROM users')).rows;
};

const readThings = async () => {
  return (await client.query('SELECT * FROM things')).rows;
};

const readUserThings = async () => {
  return (await client.query('SELECT * FROM user_things')).rows;
};

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
