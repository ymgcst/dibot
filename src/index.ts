const http = require('http')

// サーバーを作成
const server = http.createServer((req: any, res: any) => {
  // リクエストのURLとメソッドを確認
  if (req.url === '/api' && req.method === 'GET') {
    // レスポンスヘッダーを設定
    res.writeHead(200, { 'Content-Type': 'application/json' })
    // JSONレスポンスを送信
    res.end(JSON.stringify({ message: 'Hello, World!' }))
  } else {
    // 404エラーを返す
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not Found' }))
  }
})

// ポート3000でサーバーを起動
const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
