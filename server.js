
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./db/usuarios.db');

app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hora
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Redirige '/' al login si no hay sesión, o carga inicio.html si hay sesión
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.get('/verificar-sesion', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  db.get('SELECT session_id FROM users WHERE username = ?', [req.session.user.username], (err, row) => {
    if (err || !row || row.session_id !== req.sessionID) {
      req.session.destroy(() => res.sendStatus(401));
    } else {
      res.sendStatus(200);
    }
  });
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [usuario, password], (err, row) => {
    if (err || !row) {
      return res.redirect('/login.html?error=1');
    }

    req.session.user = { username: row.username };

    db.run('UPDATE users SET session_id = ? WHERE username = ?', [req.sessionID, row.username], (err) => {
      if (err) {
        console.error("Error actualizando session_id:", err);
        return res.redirect('/login.html?error=1');
      }

      res.redirect('/inicio.html');
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
