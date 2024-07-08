// numberの引数(秒)を、n時間n分に変換する関数
// 0時間の場合は「n時間」は表示しない
export const formatSecondToString = (second: number): string => {
  const hour = Math.floor(second / 3600)
  const minute = Math.floor((second % 3600) / 60)
  if (hour === 0) {
    return `${minute}分`
  }
  return `${hour}時間${minute}分`
}
