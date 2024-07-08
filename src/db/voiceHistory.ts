import sqlite3 from 'sqlite3'

export type VoiceHistoryType = {
  userId: string
  userName: string
  guildId: string
  channelId: string
  voiceHistoryChannelId: string
  startTime: string
  endTime: string | null
}

const db = new sqlite3.Database('./db/dibot.db')

export const createVoiceHistoryTable = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS t_voice_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      guild_id TEXT,
      channel_id TEXT,
      voice_history_channel_id TEXT,
      start_time TEXT,
      end_time TEXT
    )`)
  })
}

export const insertVoiceHistory = (voiceHistory: VoiceHistoryType) => {
  db.serialize(() => {
    db.run(
      `INSERT INTO t_voice_history (user_id, user_name, guild_id, channel_id, voice_history_channel_id, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      voiceHistory.userId,
      voiceHistory.userName,
      voiceHistory.guildId,
      voiceHistory.channelId,
      voiceHistory.voiceHistoryChannelId,
      voiceHistory.startTime,
      voiceHistory.endTime,
    )
  })
}

export const updateEndTime = (
  userId: string,
  guildId: string,
  channelId: string,
  endTime: string,
) => {
  db.serialize(() => {
    db.run(
      `UPDATE t_voice_history SET end_time = ? WHERE user_id = ? AND guild_id = ? AND channel_id = ? AND end_time IS NULL`,
      [endTime, userId, guildId, channelId],
      err => {
        if (err) {
          console.error('Error updating end_time:', err)
        }
      },
    )
  })
}

export const calculateCallTime = (
  userId: string,
  guildId: string,
  channelId: string,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(
        `SELECT start_time, end_time FROM t_voice_history WHERE user_id = ? AND guild_id = ? AND channel_id = ? AND end_time IS NOT NULL ORDER BY id DESC`,
        userId,
        guildId,
        channelId,
        (err: any, row: any) => {
          if (err) {
            return reject(err)
          }
          if (!row) {
            return resolve(0)
          }
          const startTime = new Date(row.start_time)
          const endTime = new Date(row.end_time)
          const diff = endTime.getTime() - startTime.getTime()
          // msからsに変換
          resolve(Math.floor(diff / 1000))
        },
      )
    })
  })
}
