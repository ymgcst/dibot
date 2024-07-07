import { Client, Events, GatewayIntentBits } from 'discord.js'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import console from 'console'

// SSMクライアントの初期化
const ssmClient = new SSMClient({ region: 'ap-northeast-1' })

// AWS Parameter StoreからDiscordのBot Tokenを取得
const getDiscordToken = async () => {
  const ssmGetCommand = new GetParameterCommand({
    Name: '/dibot/discord-token',
    WithDecryption: true,
  })

  try {
    const res = await ssmClient.send(ssmGetCommand)
    return res.Parameter?.Value || ''
  } catch (error) {
    console.error('Error fetching Discord token:', error)
    return ''
  }
}

const discordToken = await getDiscordToken()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
})

client.once(Events.ClientReady, async readyClient => {
  // 参加しているすべてのギルドのIDを取得
  const oauth2guilds = await client.guilds.fetch()
  oauth2guilds.forEach(async oauth2guild => {
    const guild = await client.guilds.fetch(oauth2guild.id)
    // チャンネル名の一覧を取得
    const channels = guild.channels.cache.map(channel => channel.name)

    // 「通話履歴」チャンネルがない場合、作成する
    if (!channels.includes('通話履歴')) {
      guild.channels.create({ name: '通話履歴' })
    }
  })
})

client.login(discordToken)

// メッセージ受信
client.on('messageCreate', async message => {
  // Bot自身のメッセージは無視、userがnullの場合も無視
  if (message.author.bot || !client.user) {
    return
  }

  if (message.mentions.has(client.user.id)) {
    message.reply('ん？')
    return
  }
})

// ボイスチャンネルのステータス変更
client.on('voiceStateUpdate', async (oldState, newState) => {
  console.log('通話開始記録')
  if (oldState.member === null || newState.member === null) {
    return
  }
  // const date = Date.now()
  // if (oldState.channelId === null && newState.channelId !== null) {
  //   const userId = oldState.member.user.id
  //   dateMap[userId] = date
  //   console.log(dateMap)
  //   return oldState.member.guild.channels.cache
  //     .get(process.env.NOTICE_MTG_TIME_CHANNEL_ID)
  //     .send(`**参加** ${oldState.member.user.username} が入室しました。`)
  // }
  // if (oldState.channelId !== null && newState.channelId === null) {
  //   console.log('通話終了記録')
  //   let text = `**退出** ${newState.member.user.username} が退出しました。`
  //   const userId = newState.member.user.id
  //   if (dateMap[userId] === undefined) {
  //     // 通常あり得ないがサーバーダウンなどを考慮してログ出力しておく
  //     console.log('ERROR 退室者の入室時間が記録されていない')
  //   } else {
  //     const dateItem = dateMap[userId]
  //     console.log(dateItem)
  //     const enterDate = dateItem
  //     console.log(enterDate)
  //     const srcSec = Math.floor((date - enterDate) / 1000)
  //     console.log(srcSec)
  //     const hours = Math.floor(srcSec / 3600)
  //     console.log(hours)
  //     const minutes = Math.floor((srcSec % 3600) / 60)
  //     console.log(minutes)
  //     text += ` 通話時間：${hours}時間${minutes}分`
  //     dateMap[userId] = undefined
  //     console.log(dateMap)
  //   }
  //   return oldState.member.guild.channels.cache
  //     .get(process.env.NOTICE_MTG_TIME_CHANNEL_ID)
  //     .send(text)
  // }
})
