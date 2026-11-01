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
      return { users: data.users || [], scores: data.scores || [] };
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`Could not read ${file}, starting empty:`, err.message);
      return { users: [], scores: [] };
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

    /* ---------- scores (week 6) ---------- */

    addScore({ userId, username, difficulty, score, solved, bestStreak, durationSeconds }) {
      const entry = {
        id: crypto.randomUUID(),
        userId,
        username,
        difficulty,
        score,
        solved,
        bestStreak,
        durationSeconds,
        playedAt: new Date().toISOString(),
      };
      db.scores.push(entry);
      save();
      return entry;
    },

    /**
     * Leaderboard: each player's BEST score, highest first.
     * @param {{difficulty?: string, limit?: number}} options difficulty 'all' or a level
     */
    topScores({ difficulty = 'all', limit = 10 } = {}) {
      const best = new Map(); // userId -> best entry
      for (const s of db.scores) {
        if (difficulty !== 'all' && s.difficulty !== difficulty) continue;
        const current = best.get(s.userId);
        if (!current || s.score > current.score) best.set(s.userId, s);
      }
      return [...best.values()]
        .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
        .slice(0, limit)
        .map((s, i) => ({
          rank: i + 1,
          username: s.username,
          score: s.score,
          difficulty: s.difficulty,
          solved: s.solved,
          playedAt: s.playedAt,
        }));
    },

    /** Personal statistics for the menu screen. */
    userStats(userId) {
      const mine = db.scores.filter((s) => s.userId === userId);
      const total = mine.reduce((sum, s) => sum + s.score, 0);
      return {
        gamesPlayed: mine.length,
        bestScore: mine.reduce((m, s) => Math.max(m, s.score), 0),
        averageScore: mine.length ? Math.round(total / mine.length) : 0,
        totalSolved: mine.reduce((sum, s) => sum + s.solved, 0),
        bestStreak: mine.reduce((m, s) => Math.max(m, s.bestStreak), 0),
        recent: mine.slice(-5).reverse().map(({ score, difficulty, solved, playedAt }) =>
          ({ score, difficulty, solved, playedAt })),
      };
    },
  };
}

module.exports = createStore(config.dataFile);
module.exports.createStore = createStore;
