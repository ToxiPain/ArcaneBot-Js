// ------------------
// lib/subs.js
// Made by: ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ꔋ𝗘𝖠𝝡
// (AÚN EN FASE BETA) ⚠
// ------------------

// Importaciones y requerimentos
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { applyUtils } from './utils.js'
import QRCode from 'qrcode'
import P from 'pino'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const originalWrite = process.stdout.write;
process.stdout.write = function(chunk, encoding, callback) {
 if (typeof chunk === 'string' && (chunk.includes('Closing session') || chunk.includes('SessionEntry'))) {
 return true; }
 return originalWrite.apply(process.stdout, arguments);
};

const silentLogger = P({ level: 'silent' });
const subBotStatus = {} 
const cooldowns = new Map()

function getUptime(startTime) {
 if (!startTime) return '0s'
const now = Date.now()
const diff = now - startTime
const seconds = Math.floor((diff / 1000) % 60)
const minutes = Math.floor((diff / (1000 * 60)) % 60)
const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
const days = Math.floor(diff / (1000 * 60 * 60 * 24))
let uptime = ''
 if (days > 0) uptime += `${days}d `
 if (hours > 0) uptime += `${hours}h `
 if (minutes > 0) uptime += `${minutes}m `
 uptime += `${seconds}s`
 return uptime
 }

// Comando de "serbot"
export async function serbotHandler(inf, sock, cmdName, usedPrefix) {
const userId = inf.number 
 if (cmdName === 'serbot') {
const menuSerbot = 
`────────[ ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲ 𐦝 ]────────\n` +
`│       *『 CONECTAR SUB-BOT 』*\n` +
`──────────────────────────\n` +
`Puedes conviértete en un Sub-Bot usando cualquiera de los siguientes opciones:\n\n` +
`*[ ⸙ ] QR Code*\n` +
`*➔ Usa:* ${usedPrefix}qr\n\n` +
`*[ ⸙ ] Pairing Code*\n` +
`*➔ Usa:* ${usedPrefix}code\n\n` +
`> *Nota:* La sesión se guarda automáticamente.\n` +
`──────────────────────────`
return await sock.msg(inf.wChat, menuSerbot, { quoted: inf }) }

const lastAttempt = cooldowns.get(userId) || 0
const now = Date.now()
const cooldownTime = 1 * 60 * 1000 // 1 minuto en ms
if (now - lastAttempt < cooldownTime) { 
const remaining = Math.ceil((cooldownTime - (now - lastAttempt)) / 1000)
 return sock.msg(inf.wChat, `[ ⸙ ] Espera *${remaining}s* antes de volver a solicitar algún codigo de vinculación.`, { quoted: inf })
 }

const baseDir = './Arcane_Session/SubBots'
 if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })
    
const currentSubs = fs.readdirSync(baseDir).filter(dir => fs.existsSync(path.join(baseDir, dir, 'creds.json'))).length
 if (currentSubs >= 50) return sock.msg(inf.wChat, '✐ Límite alcanzado.', { quoted: inf })

    if (cmdName === 'code' || cmdName === 'qr') {
        cooldowns.set(userId, now)
        await sock.react(inf, '⏳')
        await startSubBot(inf, sock, userId, cmdName)
    }
}

export async function startSubBot(inf, sock, rawPhone, method = 'code') {
    const phone = rawPhone.replace(/\D/g, '')
    const subFolder = `./Arcane_Session/SubBots/${phone}`
    
    // Determinar origen del bot
    const isMain = !sock.isSubBot; 
    const botSource = isMain ? "Main Sub-Bot" : "Nested Sub-Bot";

    if (fs.existsSync(subFolder) && !fs.existsSync(path.join(subFolder, 'creds.json'))) {
        fs.rmSync(subFolder, { recursive: true, force: true })
    }
    if (!fs.existsSync(subFolder)) fs.mkdirSync(subFolder, { recursive: true })

    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(subFolder)

    let subSock = makeWASocket({
        version,
        auth: state,
        logger: silentLogger, 
        browser: ["Ubuntu", "Chrome", "110.0.5481.178"],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true
    })

    subSock = applyUtils(subSock)
    subSock.isSubBot = true; 
    subSock.ev.on('creds.update', saveCreds)

    if (!subBotStatus[phone]) {
        subBotStatus[phone] = { 
            linkSent: false, 
            sock: subSock, 
            startTime: null, 
            name: 'Sub-Bot', 
            source: botSource,
            msgCount: 0 
        }
    } else {
        subBotStatus[phone].sock = subSock
    }

    subSock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr && !subBotStatus[phone].linkSent) {
            subBotStatus[phone].linkSent = true 
            if (method === 'qr') {
                try {
                    const qrBuffer = await QRCode.toBuffer(qr, { scale: 8 })
                    await sock.sendMessage(inf.wChat, { image: qrBuffer, caption: `────────[ ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲ 𐦝 ]────────\n│       *『 SUB-BOT POR QR 』*\n──────────────────────────\nSigue las siguientes instrucciones para vincular el bot por medio de QR:\n\n> ● En el inicio de Whatsapp, click en los *3 puntos.*\n> ● Toque *dispositivos vinculados.*\n> ● Vincular *nuevo dispositivo.*\n> ● Escanea el codigo *QR.*\n\n> Recuerda que debes escanear el *QR* desde la *cuenta* que quieres vincular. No es recomendable usar tu cuenta principal para registrar un Sub-Bot\n──────────────────────────` }, { quoted: inf })
        await sock.react(inf, '✅')
                } catch (e) { subBotStatus[phone].linkSent = false }
            }
            if (method === 'code') {
                try {
                    await new Promise(r => setTimeout(r, 8000))
                    if (subSock.authState.creds.registered) return
                    const code = await subSock.requestPairingCode(phone)
                    const pairingMsg = `───────[ ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲ 𐦝 ]───────\n│       *『 SUB-BOT POR CODE 』*\n────────────────────────\nSigue las siguientes instrucciones para vincular el bot por medio de Pairing Code:\n> ● En el inicio de Whatsapp, click en los *3 puntos.*\n> ● Toque *dispositivos vinculados.*\n> ● Vincular *nuevo dispositivo.*\n> ● Selecciona abajo: *Vincular con el número de teléfono.*\n\n*[ ⸙ ] CODE: ${code?.match(/.{1,4}/g)?.join('-') || code}*\n\n> Recuerda que este *Código* solo funciona en el *número* que lo solicito. No es recomendable usar tu cuenta principal para registrar un Sub-Bot.\n────────────────────────`
                    await sock.msg(inf.wChat, pairingMsg, { quoted: inf })
                            await sock.react(inf, '✅')
                } catch (e) { subBotStatus[phone].linkSent = false }
            }
        }

if (connection === 'open') {
 subBotStatus[phone].linkSent = false 
 subBotStatus[phone].startTime = Math.floor(Date.now() / 1000)

 subBotStatus[phone].name = subSock.user.name || 'Sub-Bot'
 console.log(chalk.cyan('\n╭──────╮'))
 console.log(chalk.cyan('│ ❝(𝕊𝕌𝔹-𝔹𝕆𝕋) ℂ𝕠𝕟𝕖𝕔𝕥𝕒𝕕𝕠 𝔼𝕩𝕚𝕥𝕠𝕤𝕒𝕞𝕖𝕟𝕥𝕖❞ ( ✅ )'))
 console.log(chalk.cyan(`╰──╮⸙; " ${phone} - ${botSource} "\n`))
 if (inf.wChat !== 'status@broadcast') {
 await sock.msg(inf.wChat, `❝(𝕊𝕌𝔹-𝔹𝕆𝕋) ℂ𝕠𝕟𝕖𝕔𝕥𝕒𝕕𝕠 𝔼𝕩𝕚𝕥𝕠𝕤𝕒𝕞𝕖𝕟𝕥𝕖❞ (✅)\n*Se ha vinculado como: _${phone}_*`, { quoted: inf }) } }

if (connection === 'close') {
const statusCode = lastDisconnect?.error?.output?.statusCode
 if (statusCode !== 401) {
 startSubBot(inf, sock, phone, method)
 } else { fs.rmSync(subFolder, { recursive: true, force: true })
 delete subBotStatus[phone] } } })

subSock.ev.on('messages.upsert', async ({ messages, type }) => {
 if (type !== 'notify') return
 const msg = messages[0]
 if (!msg.message || msg.key.fromMe) return 
 const messageTimestamp = msg.messageTimestamp?.low || msg.messageTimestamp || 0
 const subStartTime = subBotStatus[phone]?.startTime || 0
 if (messageTimestamp < subStartTime) return 
 if (subBotStatus[phone]) subBotStatus[phone].msgCount++
 try {
 const { whispHandler: handler } = await import('../whisp.js')
 const infSub = await subSock.smp(msg)
 // SubLogMessage(infSub, subSock, phone) // Nota: Asegúrate de tener esta función definida o importada si la usas
 await handler(infSub, subSock) 
 } catch (e) { console.error(e) } })
 }

export async function getSubsList(sock, inf) {
const baseDir = './Arcane_Session/SubBots'
 if (!fs.existsSync(baseDir)) return await sock.msg(inf.wChat, '✐ No hay registros.', { quoted: inf })

const subFolders = fs.readdirSync(baseDir).filter(dir => 
 fs.existsSync(path.join(baseDir, dir, 'creds.json')))
 if (subFolders.length === 0) return await sock.msg(inf.wChat, '✐ No hay Sub-Bots activos.', { quoted: inf })

let subListText = ''
 for (const [index, num] of subFolders.entries()) {
const credsPath = path.join(baseDir, num, 'creds.json')
const stats = fs.statSync(credsPath)
        
const timeStr = stats.birthtime.toLocaleTimeString('es-ES', {
 hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
const dateStr = stats.birthtime.toLocaleDateString('es-ES', {
 day: '2-digit', month: '2-digit', year: 'numeric' })

let groupCount = '💤', uptime = 'Offline', name = 'Desconocido'
let source = 'Desconocido', msgs = 0, ping = '--'
 if (subBotStatus[num]?.sock && subBotStatus[num]?.startTime) {
 try {
const s = subBotStatus[num].sock
const startPing = Date.now()
 await s.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:p' }, content: [{ tag: 'ping', attrs: {} }] }).catch(() => null)
 ping = `${Date.now() - startPing}ms`
const fetchGroups = await s.groupFetchAllParticipating()
 groupCount = Object.keys(fetchGroups).length
 uptime = getUptime(subBotStatus[num].startTime)
 name = subBotStatus[num].name
 source = subBotStatus[num].source
 msgs = subBotStatus[num].msgCount
 } catch {
 groupCount = 'Error'
            } }
 subListText += `*${index + 1}) +${num} ≪*\n`
 subListText += `   ❒ *Nombre:* ${name}\n`
 subListText += `   ❒ *Origen:* ${source}\n`
 subListText += `   ❒ *Grupos:* ${groupCount}\n`
 subListText += `   ❒ *Ping:* ${ping}\n`        
 subListText += `   ❒ Msgs Recibidos: ${msgs}\n`
 subListText += `   ❒ Uptime: ${uptime}\n`
 subListText += `   ❒ Vinculado: ${timeStr} ${dateStr}\n\n` }
let header = `       *『 LISTA DE SUB-BOTS 』*\n`
 header = `────────[ ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲ 𐦝 ]────────\n`
 header += `*[ ⸙ ] Total Sub-Bots:* ${subFolders.length}\n\n`
const footer = `──────────────────────────`

 return await sock.msg(inf.wChat, header + subListText + footer, { quoted: inf }) }