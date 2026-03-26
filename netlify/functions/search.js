const initSqlJs = require("sql.js");

async function buildDb() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      name TEXT,
      department TEXT,
      email TEXT
    );
    INSERT INTO employees VALUES (1, 'Alice Martin',  'Comptabilité', 'a.martin@corp.io');
    INSERT INTO employees VALUES (2, 'Bob Durand',    'Informatique', 'b.durand@corp.io');
    INSERT INTO employees VALUES (3, 'Claire Petit',  'RH',           'c.petit@corp.io');
    INSERT INTO employees VALUES (4, 'David Moreau',  'Direction',    'd.moreau@corp.io');
    INSERT INTO employees VALUES (5, 'Eva Leclerc',   'Informatique', 'e.leclerc@corp.io');

    CREATE TABLE secrets (
      id INTEGER PRIMARY KEY,
      key TEXT,
      value TEXT
    );
    INSERT INTO secrets VALUES (1, 'flag',            'CTFY{3rr0r_b4s3d_sql1_f0r_th3_w1n}');
    INSERT INTO secrets VALUES (2, 'backup_password', 'n0t_th3_fl4g');
  `);

  return db;
}

function runQuery(db, sql) {
  const results = [];
  const stmt = db.prepare(sql);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json" };
  const params = event.queryStringParameters || {};
  const query = params.q;

  if (!query) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Paramètre de recherche manquant." }),
    };
  }

  let db;
  try {
    db = await buildDb();
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erreur d'initialisation de la base.", details: e.message }),
    };
  }

  // Requête volontairement vulnérable
  const sql = `SELECT id, name, department, email FROM employees WHERE name LIKE '%${query}%'`;

  try {
    const rows = runQuery(db, sql);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: rows, count: rows.length }),
    };
  } catch (err) {
    // Erreur renvoyée volontairement — vecteur d'exploitation
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erreur SQL",
        details: err.message,
        query: sql,
      }),
    };
  }
};
