import { getFirestoreInstance } from './firebase'
import { Timestamp } from 'firebase-admin/firestore'

export type VoiceHistoryType = {
  userId: string
  userName: string
  displayName: string
  guildId: string
  channelId: string
  voiceHistoryChannelId: string
  startTime: string
  endTime: string | null
}

let db: any = null
const voiceHistoryCollection = 'voice_history'

// Firestoreインスタンスを遅延取得
const getDb = () => {
  if (!db) {
    db = getFirestoreInstance()
  }
  return db
}

export const insertVoiceHistory = async (voiceHistory: VoiceHistoryType) => {
  try {
    const firestoreDb = getDb()
    await firestoreDb.collection(voiceHistoryCollection).add({
      userId: voiceHistory.userId,
      userName: voiceHistory.userName,
      displayName: voiceHistory.displayName,
      guildId: voiceHistory.guildId,
      channelId: voiceHistory.channelId,
      voiceHistoryChannelId: voiceHistory.voiceHistoryChannelId,
      startTime: Timestamp.fromDate(new Date(voiceHistory.startTime)),
      endTime: null,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error inserting voice history:', error)
  }
}

export const updateEndTime = async (
  userId: string,
  guildId: string,
  channelId: string,
  endTime: string,
) => {
  try {
    const firestoreDb = getDb()
    // すべてのドキュメントを取得してフィルタリング
    const snapshot = await firestoreDb.collection(voiceHistoryCollection).get()

    for (const doc of snapshot.docs) {
      const data = doc.data()
      if (
        data.userId === userId &&
        data.guildId === guildId &&
        data.channelId === channelId &&
        data.endTime === null
      ) {
        await doc.ref.update({
          endTime: Timestamp.fromDate(new Date(endTime)),
          updatedAt: Timestamp.now(),
        })
        break // 最初に見つかったものを更新して終了
      }
    }
  } catch (error) {
    console.error('Error updating end_time:', error)
  }
}

export const calculateCallTime = async (
  userId: string,
  guildId: string,
  channelId: string,
): Promise<number> => {
  try {
    const firestoreDb = getDb()
    // すべてのドキュメントを取得してフィルタリング
    const snapshot = await firestoreDb.collection(voiceHistoryCollection).get()

    // 最新の完了した通話を探す
    let latestCall = null
    for (const doc of snapshot.docs) {
      const data = doc.data()
      if (
        data.userId === userId &&
        data.guildId === guildId &&
        data.channelId === channelId &&
        data.endTime
      ) {
        if (
          !latestCall ||
          data.endTime.toDate() > latestCall.endTime.toDate()
        ) {
          latestCall = data
        }
      }
    }

    if (!latestCall || !latestCall.startTime || !latestCall.endTime) {
      return 0
    }

    const startTime = latestCall.startTime.toDate()
    const endTime = latestCall.endTime.toDate()
    const diff = endTime.getTime() - startTime.getTime()

    // msからsに変換
    return Math.floor(diff / 1000)
  } catch (error) {
    console.error('Error calculating call time:', error)
    return 0
  }
}
