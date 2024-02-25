const pg = require('pg');
const path = require('path');
const express = require('express');
const app = express();

const dbName = 'acme_hr_db';
const dbString = (process.env.DATABASE_URL || 'postgres://postgres:ilovetess@localhost:5432/') + dbName;
const client = new pg.Client(dbString);

app.use(express.json());
app.use(require('morgan')('dev'));

// static routes for deployment
app.use(express.static(path.join(__dirname, '../client/dist')));


/////////////////////////////////////
// -------- api routes begin --------
//
// default static route for root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

// route for get() select all
app.get('/api/emp', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM emp;`;
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
});
app.get('/api/dept', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM dept;`;
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
});

// route for get() select single
app.get('/api/emp/:id', async (req, res, next) => {
  console.log('inside select by id api...');
  try {
    const SQL = `SELECT * FROM emp 
                WHERE id=$1`;
    const result = await client.query(SQL, [req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
// route for get() select single
app.get('/api/dept/:id', async (req, res, next) => {
  console.log('inside select by id api...');
  try {
    const SQL = `SELECT * FROM dept 
                WHERE id=$1`;
    const result = await client.query(SQL, [req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for post() insert new
app.post('/api/emp', async (req, res, next) => {
  console.log('inside insert new api...');
  try {
    const SQL = `INSERT INTO emp(name, dept_id) 
                VALUES($1, $2) RETURNING *;`;
    const result = await client.query(SQL, [req.body.name, req.body.dept_id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for put() update existing record
app.put('/api/emp/:id', async (req, res, next) => {
  console.log('inside update api...');
  try {
    const SQL = `UPDATE emp
                SET name=$1, dept_id=$2, updated_at=now() 
                WHERE id=$3 RETURNING *;`;
    const result = await client.query(SQL, [req.body.name, req.body.dept_id, req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// route for delete() delete existing record
app.delete('/api/emp/:id', async (req, res, next) => {
  console.log('inside delete api...');
  try {
    const SQL = `DELETE FROM emp 
                WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
//
// -------- api routes end --------
///////////////////////////////////


// init() gateway entry point
const init = async() => {

  await client.connect();

  const SQL = `
    DROP TABLE IF EXISTS emp;
    DROP TABLE IF EXISTS dept;
    CREATE TABLE dept(
      id SERIAL PRIMARY KEY,
      name VARCHAR(128)
    );
    CREATE TABLE emp(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      dept_id INTEGER REFERENCES dept(id) NOT NULL
    );
    INSERT INTO dept(name) VALUES('Management');
    INSERT INTO dept(name) VALUES('Safety');
    INSERT INTO dept(name) VALUES('Sales');
    INSERT INTO dept(name) VALUES('Marketing');
    INSERT INTO dept(name) VALUES('Loss Prevention');
    INSERT INTO emp(name, dept_id) VALUES('David', 1);
    INSERT INTO emp(name, dept_id) VALUES('Cat', 2);
    INSERT INTO emp(name, dept_id) VALUES('Tessa', 4);
    INSERT INTO emp(name, dept_id) VALUES('Moon', 5);
  `;
  
  await client.query(SQL);
  console.log('data seeded');

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  })
}

// init function invocation
init();