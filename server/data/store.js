/**
 * store.js - data-access layer (a very small "repository").
 * Author: Utsav Sah
 *
 * Data is kept in memory and saved to a JSON file after every change. Writing goes to a
 * temporary file first and is then renamed, so a crash mid-write cannot corrupt the file.
 * The rest of the app only uses these functions, so the JSON file can later be replaced by
 * SQLite or MongoDB without changing routes or services.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

function createStore(file) {
  let db = load();

  function load() {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { users: data.users || [] };
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`Could not read ${file}, starting empty:`, err.message);
      return { users: [] };
    }
  }

  function save() {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, file);
  }

  return {
    findUserByUsername(username) {
      const wanted = String(username).toLowerCase();
      return db.users.find((u) => u.username.toLowerCase() === wanted) || null;
    },

    findUserById(id) {
      return db.users.find((u) => u.id === id) || null;
    },

    createUser({ username, passwordHash }) {
      const user = {
        id: crypto.randomUUID(),
        username,
        passwordHash, // only the bcrypt hash is stored - never the password itself
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      db.users.push(user);
      save();
      return user;
    },

    updateUser(id, changes) {
      const user = this.findUserById(id);
      if (!user) return null;
      Object.assign(user, changes);
      save();
      return user;
    },
  };
}

module.exports = createStore(config.dataFile);
module.exports.createStore = createStore;
