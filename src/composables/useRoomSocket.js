// ============================================================
// 极简 STOMP over WebSocket 客户端（不依赖任何第三方库）
// 后端是 Spring 的 /ws（withSockJS），原生 WebSocket 地址是 /ws/websocket
// 握手时把 JWT 放 ?token= 上，交给后端 TokenHandshakeInterceptor 校验
// ============================================================

const NULL = '\u0000'

// 拼一帧 STOMP 报文
function frame(cmd, headers, body) {
  let s = cmd + '\n'
  for (const k in headers) s += k + ':' + headers[k] + '\n'
  s += '\n'
  if (body !== undefined && body !== null) s += body
  return s + NULL
}

/**
 * 连接房间实时通道
 * @param {string} roomId 房间号
 * @param {string} token  JWT
 * @param {(msg:object)=>void} onMessage 收到房间广播
 * @param {(s:string)=>void} onStatus   连接状态：connecting/open/closed/error
 * @returns {{ send:Function, close:Function }}
 */
export function createRoomSocket({ roomId, token, onMessage, onStatus }) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${proto}//${location.host}/ws/websocket?token=${encodeURIComponent(token)}`

  let ws = null
  let buf = ''
  let closed = false      // 是否人为关闭（人为关闭就不再重连）
  let tries = 0
  let retryTimer = null

  const pending = []      // 连上之前要发的消息先排队

  function status(s) { if (onStatus) onStatus(s) }

  // 解析缓冲区里完整的帧
  function drain() {
    while (true) {
      const i = buf.indexOf(NULL)
      if (i < 0) return
      const raw = buf.slice(0, i)
      buf = buf.slice(i + 1)
      const txt = raw.replace(/\r\n/g, '\n')
      if (!txt.trim()) continue // 心跳空帧
      const sep = txt.indexOf('\n\n')
      if (sep < 0) continue
      const head = txt.slice(0, sep)
      const body = txt.slice(sep + 2)
      const cmd = head.split('\n')[0].trim()
      if (cmd === 'MESSAGE' && onMessage) {
        try {
          onMessage(JSON.parse(body))
        } catch (e) { /* 非 JSON 忽略 */ }
      }
    }
  }

  function connect() {
    if (closed) return
    status('connecting')
    try {
      ws = new WebSocket(url)
    } catch (e) {
      status('error')
      return
    }

    ws.onopen = () => {
      tries = 0
      ws.send(frame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '0,0'
      }))
      // 订阅房间广播
      ws.send(frame('SUBSCRIBE', { id: 'sub-room', destination: '/topic/room/' + roomId }))
      // 告诉后端我进了这个房间（用于在线统计）
      ws.send(frame('SEND', {
        destination: '/app/room/' + roomId + '/join',
        'content-type': 'application/json'
      }, JSON.stringify({ t: 'join', roomId })))
      status('open')
      while (pending.length) ws.send(pending.shift())
    }

    ws.onmessage = ev => {
      buf += typeof ev.data === 'string' ? ev.data : ''
      drain()
    }

    ws.onerror = () => status('error')

    ws.onclose = () => {
      ws = null
      if (closed) { status('closed'); return }
      status('closed')
      tries++
      if (tries <= 6) {
        const wait = Math.min(8000, 800 * tries)
        retryTimer = setTimeout(connect, wait)
      }
    }
  }

  connect()

  return {
    /** 往房间广播一条消息（后端只做中继，不动内容） */
    send(obj) {
      const f = frame('SEND', {
        destination: '/app/room/' + roomId + '/msg',
        'content-type': 'application/json'
      }, JSON.stringify(obj))
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(f)
      else if (pending.length < 20) pending.push(f)
    },
    close() {
      closed = true
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      if (ws) { try { ws.close() } catch (e) { /* ignore */ } ws = null }
      status('closed')
    }
  }
}
