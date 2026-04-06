// ------------------
// index.js
// Made by: ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ꔋ𝗘𝖠𝝡
// ------------------

// Importaciones
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import { LoggerUpdate, LogMessage } from './lib/logger.js'
import { loadCommands, whispHandler } from './whisp.js'
import { applyUtils } from './lib/utils.js'
import { startSubBot } from './lib/subs.js'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import prompts from 'prompts'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

// Declarar Variables
let connecting = false
let askingNumber = false
let mainCodeSent = false 
let useQR
let sock = null
let restarting = false
const startTime = Math.floor(Date.now() / 1000)

// [SOLUCIÓN] Normalizar timestamp
function getMessageTimestamp(msg) {
  const ts = msg.messageTimestamp
  if (!ts) return 0
  if (typeof ts === 'object') return ts.low || 0
  return ts
}

// Estructura de Carpetas y Rutas
const SESSION_FOLDER = 'Arcane_Session'
const MAIN_AUTH_FOLDER = path.join(SESSION_FOLDER, 'MainBot') 
const SUBS_AUTH_FOLDER = path.join(SESSION_FOLDER, 'SubBots') 
 if (!fs.existsSync(MAIN_AUTH_FOLDER)) fs.mkdirSync(MAIN_AUTH_FOLDER, { recursive: true })
 if (!fs.existsSync(SUBS_AUTH_FOLDER)) fs.mkdirSync(SUBS_AUTH_FOLDER, { recursive: true })

// Recibir y crear formato de código de 8 digitos.    
function formatPairingCode(code) {
 if (!code || code.length !== 8) return code
 return `${code.slice(0, 4)}-${code.slice(4)}` }

// Detectar credenciales para conectarse a la sesión existente
function mainSessionExists() {
 return fs.existsSync(path.join(MAIN_AUTH_FOLDER, 'creds.json')) }

// Iniciar el bot
async function startBot() {
 await loadCommands()
 if (connecting) return
 connecting = true

 // 🔥 CERRAR SOCKET ANTERIOR SI EXISTE
 if (sock) {
  try { sock.ws.close() } catch {}
  try { sock.ev.removeAllListeners() } catch {}
  sock = null
 }

const { version } = await fetchLatestBaileysVersion() 
const { state, saveCreds } = await useMultiFileAuthState(MAIN_AUTH_FOLDER)

 if (mainSessionExists()) { console.log(chalk.yellow('[ ⸙ ] Cargando sesión...'))
    console.log(chalk.gray(`[ ${new Date().toLocaleTimeString()} ]`))
 useQR = true } else if (useQR === undefined) {
 console.log(chalk.greenBright('\n[ ⸙ ] Selecciona cómo deseas conectarte:'))
 console.log(chalk.yellow('1 ➔  QR Code'))
 console.log(chalk.yellow('2 ➔  Pairing Code'))
const response = await prompts({ type: 'text', name: 'option', message: chalk.cyan('Opción:') })
const option = response.option?.trim()
 if (option !== '1' && option !== '2') { connecting = false
 return startBot() }
 useQR = option === '1' }

// Crear Web Socket
sock = makeWASocket({ 
 version,
 auth: {
  creds: state.creds,
  keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
 }, 
 logger: P({ level: 'silent' }),
 browser: ["Windows", "Edge", "122.0.2365.92"],
 shouldSyncHistoryMessage: () => false,
 syncFullHistory: false,
 markOnlineOnConnect: false,           
 generateHighQualityLinkPreview: false, 
 getMessage: async () => ({ conversation: 'Arcane-Bot' })
 })

// Cambios de Estado y Reconexión 
sock = applyUtils(sock)
sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', async (update) => {
const { connection } = update
const result = LoggerUpdate(update, DisconnectReason)

if (connection === 'open') { connecting = false

const subFolders = fs.readdirSync(SUBS_AUTH_FOLDER)
 for (const folder of subFolders) {
const subPath = path.join(SUBS_AUTH_FOLDER, folder)
 if (fs.statSync(subPath).isDirectory() && fs.existsSync(path.join(subPath, 'creds.json'))) {
 console.log(chalk.cyan(`[ ⸙ ] Reconectando Sub-Bot: ${folder}`))
startSubBot({ chat: 'status@broadcast', fromMe: true }, sock, folder) } } }

if (result.action === 'reconnect') {
 connecting = false

 if (update.lastDisconnect?.error?.output?.statusCode === 405) {
 console.log(chalk.red('\n[ ! ] Error 405: Problema de IP.'))
 return process.exit(0) }

 if (result.shouldReconnect && !restarting) {
 restarting = true
 setTimeout(() => {
  restarting = false
  startBot()
 }, 2000)
 }
}

if (useQR && update.qr) {
 console.clear()
 console.log(chalk.greenBright('\n[ ⸙ ] Escanea este QR con tu WhatsApp:'))
 console.log(chalk.greenBright('───────────────────────────────────────────'))
 qrcode.generate(update.qr, { small: true }) }

if (!useQR && !state.creds.registered && !askingNumber && !mainCodeSent) {
 askingNumber = true
console.log(chalk.greenBright(''))
console.log(chalk.greenBright('[ ⸙ ] Ingresa tu número con código de país.'))
console.log(chalk.greenBright(' (Ejemplo: 52175314*****)'))
console.log(chalk.greenBright('───────────────────────────────────────────'))
const numberResp = await prompts({ type: 'text', name: 'number', message: chalk.cyan('Numero:') })
const number = numberResp.number?.trim().replace(/\D/g, '')
 if (!number) { askingNumber = false; return }
 try { mainCodeSent = true 
const code = await sock.requestPairingCode(number)
 console.log(chalk.white.bold.bgHex('#023e02ff')(`\n[ ⸙ ] Pairing Code: ${formatPairingCode(code)} \n`))
 console.log(chalk.greenBright('Usa este código en tu WhatsApp para completar el emparejamiento.'))
 } catch (err) {
 askingNumber = false 
 mainCodeSent = false 
 } } 
 })

// Inicializar Bot
sock.ev.on('messages.upsert', async ({ messages, type }) => {
 if (type !== 'notify' && type !== 'append') return

 for (let inf of messages) {

 if (!inf.message) continue

 const messageTimestamp = getMessageTimestamp(inf)

 if (messageTimestamp < startTime) {
  console.log(chalk.gray(`[ IGNORED ] Mensaje antiguo de ${inf.key.remoteJid}`))
  continue 
 }

 inf = await sock.smp(inf)
 LogMessage(inf, sock)
 await whispHandler(inf, sock)
 }
})
}

startBot()
