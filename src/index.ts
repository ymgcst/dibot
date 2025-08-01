import { Channel, Client, Events, GatewayIntentBits } from 'discord.js'
import {
  VoiceHistoryType,
  calculateCallTime,
  insertVoiceHistory,
  updateEndTime,
} from './db/voiceHistory'
import { formatSecondToString } from 'utils'
import dotenv from 'dotenv'
import http from 'http'

dotenv.config()

const port = process.env.PORT || 3000
const server = http.createServer((req, res) => {
  // GASからの定期的なリクエストを待ち受けるエンドポイント
  if (req.url === '/ping' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Bot is alive and running',
      }),
    )
    return
  }

  // デフォルトのレスポンス
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot is running\n')
})

server.listen(port, () => {
  console.log(`✅ HTTP server is listening on port ${port}`)
})

const getDiscordToken = () => {
  if (!process.env.DISCORD_TOKEN) {
    console.error('🔴 DISCORD_TOKEN is empty')
  }
  return process.env.DISCORD_TOKEN || ''
}

const discordToken = getDiscordToken()

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
})

discordClient.once(Events.ClientReady, async readyClient => {
  // 参加しているすべてのギルドのIDを取得
  const oauth2guilds = await discordClient.guilds.fetch()
  oauth2guilds.forEach(async oauth2guild => {
    const guild = await discordClient.guilds.fetch(oauth2guild.id)
    // チャンネル名の一覧を取得
    const channels = guild.channels.cache.map(channel => channel.name)

    // 「通話履歴」チャンネルがない場合、作成する
    if (!channels.includes('通話履歴')) {
      guild.channels.create({ name: '通話履歴' })
    }
  })
})

discordClient
  .login(discordToken)
  .then(() => {
    console.log('✅ Bot is ready')
  })
  .catch(error => {
    console.error('🔴 Discord bot login error', error)
  })

// メッセージ受信
discordClient.on('messageCreate', async message => {
  // Bot自身のメッセージは無視、userがnullの場合も無視
  if (message.author.bot || !discordClient.user) {
    return
  }

  if (message.mentions.has(discordClient.user.id)) {
    message.reply('ん？')
    return
  }
})

// ボイスチャンネルのステータス変更
discordClient.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.member === null || newState.member === null) {
    return
  }

  // 対象のギルドの「通話履歴」チャンネルのIDを取得
  const guild = await discordClient.guilds.fetch(oldState.guild.id)
  const voiceHistoryChannelId =
    guild.channels.cache.find(channel => channel.name === '通話履歴')?.id || ''

  if (oldState.channelId === null && newState.channelId !== null) {
    // 通話開始
    const voiceHistory: VoiceHistoryType = {
      userId: newState.member.user.id,
      userName: newState.member.user.username,
      displayName: newState.member.displayName,
      guildId: newState.guild.id,
      channelId: newState.channelId || '',
      voiceHistoryChannelId,
      startTime: new Date().toISOString(),
      endTime: null,
    }
    // 通話開始時にinsert
    await insertVoiceHistory(voiceHistory)
    // 「通話履歴」チャンネルに通知
    const channel = (await discordClient.channels.fetch(
      voiceHistoryChannelId,
    )) as Channel
    if (channel.isTextBased()) {
      channel.send(`${voiceHistory.displayName} が入室しました。`)
    }
  } else if (oldState.channelId !== null && newState.channelId === null) {
    // 通話終了
    const voiceHistory: VoiceHistoryType = {
      userId: oldState.member.user.id,
      userName: oldState.member.user.username,
      displayName: oldState.member.displayName,
      guildId: oldState.guild.id,
      channelId: oldState.channelId || '',
      voiceHistoryChannelId: voiceHistoryChannelId || '',
      startTime: new Date().toISOString(),
      endTime: null,
    }
    // 通話終了時にupdate(通話時間を記録)
    await updateEndTime(
      voiceHistory.userId,
      voiceHistory.guildId,
      voiceHistory.channelId,
      new Date().toISOString(),
    )
    // 「通話履歴」チャンネルに通知
    const callTime = await calculateCallTime(
      voiceHistory.userId,
      voiceHistory.guildId,
      voiceHistory.channelId,
    )
    const channel = (await discordClient.channels.fetch(
      voiceHistoryChannelId,
    )) as Channel
    if (channel.isTextBased()) {
      channel.send(
        `${voiceHistory.displayName} が退室しました。通話時間: ${formatSecondToString(callTime)}`,
      )
    }
  }
})
