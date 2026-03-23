// ------------------
// whisp.js
// Made by: ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ꔋ𝗘𝖠𝝡
// ------------------

// Importaciones y requerimentos
import { settings } from './settings.js'
import { serbotHandler, getSubsList } from './lib/subs-commands.js'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const commands = []

// Cargar comandos de commands
export async function loadCommands() {
const folder = './commands'
 if (!fs.existsSync(folder)) return
 const files = fs.readdirSync(folder).filter(f => f.endsWith('.js'))
 for (const file of files) { 
 try { const absolutePath = path.resolve(folder, file)
 const cmd = (await import(pathToFileURL(absolutePath).href)).default
 if (cmd?.command) { commands.push(cmd) }} catch (e) { 
 console.error(` [!] Error cargando ${file}:`, e.message)} } }
function clean(text) {
return text?.toLowerCase().trim() }

// Crear Handler para los comandos
export async function whispHandler(inf, sock) {
    try { 
        const wChat = inf.wChat     
        const text = inf.text      
        const pushName = inf.pushName
        if (!text) return

        // Función de UsedPrefix
        const usedPrefix = settings.prefixes.find(p => text.startsWith(p))
        if (!usedPrefix) return

        // Detectar comandos y separar argumentos
        const fullArgs = text.slice(usedPrefix.length).trim().split(/ +/)
        const cmdName = clean(fullArgs.shift())
        const args = fullArgs

        // Manejo de Comandos de Serbot
        if (['serbot', 'code', 'qr'].includes(cmdName)) {
            return await serbotHandler(inf, sock, cmdName, usedPrefix) 
        }
        
        if (cmdName === 'subbots') {
            return await getSubsList(sock, inf) 
        }

        // Carga de otros comandos por fuera 
        for (const cmd of commands) {
            const triggers = Array.isArray(cmd.command) ? cmd.command : [cmd.command]
            
            if (triggers.map(t => clean(t)).includes(cmdName)) {
                // Se envían como argumentos individuales, SIN LLAVES
                return await cmd(sock, wChat, inf, text, usedPrefix, args, pushName) 
            } 
        }

    // Manejo de errores de Whisp
    } catch (e) { 
        console.error(' [WHISP ERROR] ', e) 
    } 
}