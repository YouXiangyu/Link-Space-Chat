/**
 * 投票相关数据库操作
 * 
 * 这个模块提供投票数据的增删改查功能。
 * 投票信息存储在 polls、poll_options 和 votes 表中。
 */

/**
 * 创建投票
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {Object} params - 投票参数对象
 * @param {number} params.messageId - 消息ID（投票关联的消息）
 * @param {Array<string>} params.options - 选项文本数组（2-10个）
 * @param {number|null} params.expiresAt - 截止时间戳（可选，NULL表示无截止时间）
 * @returns {Promise<Object>} 创建的投票对象（包含 pollId 和 optionIds）
 */
function createPoll(db, { messageId, options, expiresAt = null }) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      // 创建投票主记录
      db.run(
        "INSERT INTO polls(message_id, expires_at, created_at) VALUES(?, ?, ?)",
        [messageId, expiresAt, Date.now()],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
          
          const pollId = this.lastID;
          const optionIds = [];
          let completed = 0;
          const total = options.length;
          
          if (total === 0) {
            db.run("ROLLBACK");
            return reject(new Error("投票选项不能为空"));
          }
          
          // 创建投票选项
          options.forEach((optionText, index) => {
            db.run(
              "INSERT INTO poll_options(poll_id, option_text, option_index, created_at) VALUES(?, ?, ?, ?)",
              [pollId, optionText, index, Date.now()],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                
                optionIds.push(this.lastID);
                completed++;
                
                // 所有选项创建完成后提交事务
                if (completed === total) {
                  db.run("COMMIT", (err) => {
                    if (err) return reject(err);
                    resolve({
                      id: pollId,
                      messageId,
                      expiresAt,
                      optionIds
                    });
                  });
                }
              }
            );
          });
        }
      );
    });
  });
}

/**
 * 根据消息ID获取投票信息
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {number} messageId - 消息ID
 * @returns {Promise<Object|null>} 投票对象（包含选项列表和每个选项的得票数）
 */
function getPollByMessageId(db, messageId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, message_id as messageId, expires_at as expiresAt, created_at as createdAt FROM polls WHERE message_id = ?",
      [messageId],
      (err, poll) => {
        if (err) return reject(err);
        if (!poll) return resolve(null);
        
        // 获取选项列表
        db.all(
          `SELECT 
            po.id,
            po.option_text as optionText,
            po.option_index as optionIndex,
            COUNT(v.id) as voteCount
          FROM poll_options po
          LEFT JOIN votes v ON po.id = v.option_id
          WHERE po.poll_id = ?
          GROUP BY po.id
          ORDER BY po.option_index ASC`,
          [poll.id],
          (err, options) => {
            if (err) return reject(err);
            
            // 计算总票数
            const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
            
            // 计算得票率
            options.forEach(opt => {
              opt.voteCount = opt.voteCount || 0;
              opt.voteRate = totalVotes > 0 ? (opt.voteCount / totalVotes) : 0;
            });
            
            resolve({
              ...poll,
              options,
              totalVotes
            });
          }
        );
      }
    );
  });
}

/**
 * 获取投票结果
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {number} pollId - 投票ID
 * @returns {Promise<Object>} 投票结果对象
 */
function getPollResults(db, pollId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        po.id,
        po.option_text as optionText,
        po.option_index as optionIndex,
        COUNT(v.id) as voteCount
      FROM poll_options po
      LEFT JOIN votes v ON po.id = v.option_id
      WHERE po.poll_id = ?
      GROUP BY po.id
      ORDER BY po.option_index ASC`,
      [pollId],
      (err, options) => {
        if (err) return reject(err);
        
        // 计算总票数
        const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
        
        // 计算得票率
        options.forEach(opt => {
          opt.voteCount = opt.voteCount || 0;
          opt.voteRate = totalVotes > 0 ? (opt.voteCount / totalVotes) : 0;
        });
        
        resolve({
          pollId,
          options,
          totalVotes
        });
      }
    );
  });
}

/**
 * 投票
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {Object} params - 投票参数
 * @param {number} params.optionId - 选项ID
 * @param {string} params.sessionId - 用户session ID
 * @returns {Promise<Object>} 投票结果（包含是否改投）
 */
function castVote(db, { optionId, sessionId }) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 先检查用户是否已对该投票的其他选项投过票
      db.get(
        `SELECT v.option_id as optionId, po.poll_id as pollId
         FROM votes v
         JOIN poll_options po ON v.option_id = po.id
         WHERE po.poll_id = (SELECT poll_id FROM poll_options WHERE id = ?)
         AND v.session_id = ?`,
        [optionId, sessionId],
        (err, existingVote) => {
          if (err) return reject(err);
          
          const isChanged = !!existingVote;
          
          // 如果已投票，先删除旧投票记录（允许改投）
          if (existingVote) {
            db.run(
              "DELETE FROM votes WHERE option_id = ? AND session_id = ?",
              [existingVote.optionId, sessionId],
              (err) => {
                if (err) return reject(err);
                
                // 创建新投票记录
                db.run(
                  "INSERT INTO votes(option_id, session_id, created_at) VALUES(?, ?, ?)",
                  [optionId, sessionId, Date.now()],
                  function (err) {
                    if (err) return reject(err);
                    resolve({
                      success: true,
                      isChanged,
                      voteId: this.lastID
                    });
                  }
                );
              }
            );
          } else {
            // 直接创建投票记录
            db.run(
              "INSERT INTO votes(option_id, session_id, created_at) VALUES(?, ?, ?)",
              [optionId, sessionId, Date.now()],
              function (err) {
                if (err) {
                  // 如果是唯一约束冲突，说明已投票（理论上不应该发生，因为我们已经检查过了）
                  if (err.message.includes("UNIQUE constraint")) {
                    return resolve({
                      success: false,
                      error: "already_voted"
                    });
                  }
                  return reject(err);
                }
                resolve({
                  success: true,
                  isChanged: false,
                  voteId: this.lastID
                });
              }
            );
          }
        }
      );
    });
  });
}

/**
 * 获取用户已投的选项
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {Object} params - 查询参数
 * @param {number} params.pollId - 投票ID
 * @param {string} params.sessionId - 用户session ID
 * @returns {Promise<number|null>} 用户已投的选项ID（如果没有则返回null）
 */
function getUserVote(db, { pollId, sessionId }) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT v.option_id as optionId
       FROM votes v
       JOIN poll_options po ON v.option_id = po.id
       WHERE po.poll_id = ? AND v.session_id = ?`,
      [pollId, sessionId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.optionId : null);
      }
    );
  });
}

/**
 * 删除投票（级联删除选项和投票记录）
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {number} messageId - 消息ID
 * @returns {Promise<void>}
 */
function deletePollByMessageId(db, messageId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 先获取投票ID
      db.get(
        "SELECT id FROM polls WHERE message_id = ?",
        [messageId],
        (err, poll) => {
          if (err) return reject(err);
          if (!poll) return resolve(); // 如果没有投票，直接返回
          
          // 删除投票记录（votes表有外键约束，会自动级联删除）
          // 删除选项（poll_options表有外键约束，会自动级联删除）
          // 删除投票主记录
          db.run("DELETE FROM polls WHERE id = ?", [poll.id], (err) => {
            if (err) return reject(err);
            resolve();
          });
        }
      );
    });
  });
}

/**
 * 检查投票是否过期
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {number} pollId - 投票ID
 * @returns {Promise<boolean>} 是否过期（true表示已过期）
 */
function isPollExpired(db, pollId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT expires_at as expiresAt FROM polls WHERE id = ?",
      [pollId],
      (err, row) => {
        if (err) return reject(err);
        if (!row || !row.expiresAt) return resolve(false); // 没有截止时间，永不过期
        resolve(Date.now() > row.expiresAt);
      }
    );
  });
}

/**
 * 根据投票ID获取消息ID
 * 
 * @param {Object} db - SQLite 数据库实例
 * @param {number} pollId - 投票ID
 * @returns {Promise<number|null>} 消息ID（如果不存在则返回null）
 */
function getMessageIdByPollId(db, pollId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT message_id as messageId FROM polls WHERE id = ?",
      [pollId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.messageId : null);
      }
    );
  });
}

module.exports = {
  createPoll,
  getPollByMessageId,
  getPollResults,
  castVote,
  getUserVote,
  deletePollByMessageId,
  isPollExpired,
  getMessageIdByPollId
};

