// ------------------
// lib/logger.js
// Made by: ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ꔋ𝗘𝖠𝝡
// ------------------

// Importaciones y dependencias
import moment from 'moment'
import chalk from 'chalk'

// Cuando se pierde Conexión
export function LoggerUpdate(update, DisconnectReason) {
const { connection, lastDisconnect } = update
 if (connection === 'close') {
const shouldReconnect = !(lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut)
const messageColor = shouldReconnect ? chalk.green : chalk.white
 console.log('Conexión cerrada. Reconectando:', messageColor(shouldReconnect))
 return { action: 'reconnect', shouldReconnect } }

// Al haber Conexión Exitosa        
if (connection === 'open') {
 console.log(chalk.greenBright('\n╭──────╮'))
 console.log(chalk.greenBright('│ ❝ℂ𝕠𝕟𝕖𝕔𝕥𝕒𝕕𝕠 𝔼𝕩𝕚𝕥𝕠𝕤𝕒𝕞𝕖𝕟𝕥𝕖❞ ( ✅ )'))
 console.log(chalk.greenBright('╰──╮⸙; " ᴬʳᶜᵃⁿ⁻ᴮᵒᵗ ᴾᴼᵂᴱᴿᴱᴰ ᴮʸ ᵀᵒˣᶦᴾᵃᶦⁿ "\n'))
 console.log(chalk.yellow('Version 1.0.3 --- @Github: https://github.com/ToxiPain\n'))
 return { action: 'open' } }
 return { action: 'none' } }

// Obtener mensajes recibidos
export function LogMessage(inf, sock) {
const from = inf.wChat
 if (!inf.message) return
 if (inf.message.protocolMessage || inf.message.senderKeyDistributionMessage) return

// Formato de información al mostrar los mensajes 
const sender = inf.number || 'Desconocido'
const isGroup = from.endsWith('@g.us')
const time = moment().format('HH:mm:ss DD/MM/YYYY')
const type = Object.keys(inf.message)[0]
let content = ''

// Formato de interpretación de mensajes recibidos 
try {
const msg = inf.message.viewOnceMessageV2?.message || inf.message.viewOnceMessage?.message || inf.message
 if (msg.conversation) content = msg.conversation
 else if (msg.extendedTextMessage?.text) content = msg.extendedTextMessage.text
 else if (msg.imageMessage) content = '[Imagen]'
 else if (msg.videoMessage) content = '[Video]'
 else if (msg.stickerMessage) content = '[Sticker]'
 else if (msg.documentMessage) content = `[Documento: ${msg.documentMessage.fileName || 'sin nombre'}]`
 else if (msg.audioMessage) content = msg.audioMessage.ptt ? '[PTT]' : '[Audio]'
 else if (msg.contactMessage) content = `[Contacto: ${msg.contactMessage.displayName || 'sin nombre'}]`
 else if (msg.contactsArrayMessage) content = '[Lista de contactos]'
 else if (msg.locationMessage) content = `[Ubicación: ${msg.locationMessage.degreesLatitude}, ${msg.locationMessage.degreesLongitude}]`
 else if (msg.liveLocationMessage) content = '[Ubicación en tiempo real]'
 else if (msg.reactionMessage) content = `[Reacción: ${msg.reactionMessage.text}]`
 else if (msg.pollCreationMessageV3 || msg.pollCreationMessage) content = `[Encuesta: ${msg.pollCreationMessageV3?.name || msg.pollCreationMessage?.name}]`
 else if (msg.pollUpdateMessage) content = '[Voto en Encuesta]'
 else if (msg.listMessage) content = `[Mensaje de Lista: ${msg.listMessage.title}]`
 else if (msg.buttonsMessage) content = `[Mensaje de Botones: ${msg.buttonsMessage.contentText}]`
 else if (msg.interactiveMessage) content = '[Mensaje Interactivo]'
 else return 
 } catch { return }

// Mostrar únicamente los primeros 250 caracteres de los mensajes en la consola
if (content.length > 250) content = content.slice(0, 250) + '...'

// Manejar Simbolos para texto en Whatsapp (negrita, curvado, subrañado, etc.)
const mdRegex = /([*_~`])(.+?)\1/g
content = content.replace(mdRegex, (_, symbol, text) => {
 switch(symbol){
 case '*': return chalk.bold(text)
 case '_': return chalk.italic(text)
 case '~': return chalk.strikethrough(text)
 case '`': return chalk.bgGray.black(text)
 default: return text } })

// Formato final al recibir mensajes
console.log(chalk.greenBright('\n─────────[ ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ƁΘƬ ]──────────'))
console.log(`${chalk.yellow('Remitente:')} ${chalk.cyan('+' + sender)}`)
console.log(`${chalk.yellow('Chat:')} ${isGroup ? chalk.magenta('Grupo') : chalk.cyan('Privado')} ${chalk.yellow('𓏬 Hora:')} ${chalk.magenta(time)}`)
console.log(`${chalk.yellow(type)} ${chalk.yellow('𓏬')} ${chalk.white(content)}`)
console.log(chalk.greenBright('──────────────────────────────────\n')) }
