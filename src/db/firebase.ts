import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Firebase Admin SDKの初期化
const initializeFirebase = () => {
  if (getApps().length === 0) {
    try {
      // プロジェクトIDを環境変数から取得
      const projectId = process.env.FIREBASE_PROJECT_ID

      if (!projectId) {
        throw new Error('FIREBASE_PROJECT_ID environment variable is required')
      }

      // サービスアカウントキーが環境変数で設定されている場合
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        )
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId,
        })
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // ファイルベースの認証（推奨）
        initializeApp({
          projectId: projectId,
        })
      } else {
        throw new Error(
          'Either FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS must be set',
        )
      }

      console.log('✅ Firebase initialized successfully')
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error)
      throw error
    }
  }
}

// Firestoreインスタンスを取得
export const getFirestoreInstance = () => {
  initializeFirebase()
  return getFirestore()
}
