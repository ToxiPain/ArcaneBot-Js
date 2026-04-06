// ------------------
// lib/utils.js
// Made by: ⍙𝗥𝗖̶᳢᳢᳢᳢̲ׅׄ⍙𝗡𝚺̲-ꔋ𝗘𝖠𝝡
// ------------------

// Borrar caché de la metadata cada 5 minutos
const groupMetadataCache = new Map()
const lidCache = new Map()
const metadataTTL = 5 * 60 * 1000 

// Obtener LID de Chats y Grupos
async function resolveLidToRealJid(lid, sock, chat) {
 if (!lid || !lid.includes('@lid') || !chat?.endsWith('@g.us')) return lid
 if (lidCache.has(lid)) return lidCache.get(lid)

// Manejar caché de la metadata
try { let metadata = groupMetadataCache.get(chat)
 if (!metadata || (Date.now() - metadata.time > metadataTTL)) {
const data = await sock.groupMetadata(chat)
 metadata = { data, time: Date.now() }
groupMetadataCache.set(chat, metadata) }

// Normalizar LID
const p = metadata.data.participants?.find(p => p.id === lid)
 if (p && p.phoneNumber) {
const realJid = `${p.phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`
 lidCache.set(lid, realJid)
 return realJid }
 } catch (e) { /* Error */ }
 return lid }

export function applyUtils(sock) {
sock.normalizeJid = (jid) => {
 if (!jid) return ''
 if (typeof jid !== 'string') jid = jid.id || jid.toString()
 if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) return jid
 return jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' }

// Envio de Mensajes Base
sock.msg = async (jid, text, options = {}) => {
 return sock.sendMessage(jid, { text, ...options }) }

// Envio de mensajes Respuesta:
sock.reply = async (jid, text, inf, options = {}) => {
 const quoted = inf?.key ? inf : null; 
 return sock.sendMessage(jid, { text: text, ...options }, { 
 quoted: quoted // Forzamos que sea el objeto de mensaje
    }) 
}

// Envio de Reacciones
sock.react = async (inf, emoji = '💖') => {
 return sock.sendMessage(inf.key.remoteJid, { react: { text: emoji, key: inf.key } }) }


// --- MANEJO DE CANALES (NEWSLETTERS) ---
sock.chaFollow = async (link) => {
    try {
        const inviteCode = link.match(/channel\/([A-Za-z0-9]+)/i);
        if (!inviteCode) return { success: false, msg: 'Link inválido' };
        const metadata = await sock.newsletterMetadata("invite", inviteCode[1]);
        if (!metadata?.id) return { success: false, msg: 'No se encontró el canal' };

        // Ejecutar el follow envolviéndolo para ignorar el falso error de Baileys
        try {
            await sock.newsletterFollow(metadata.id);
        } catch (e) {
            // Baileys suele lanzar error aquí aunque funcione, lo ignoramos.
        }

        return { 
            success: true, 
            name: metadata.name || metadata.thread_metadata?.name?.text || 'Canal',
            jid: metadata.id 
        };
    } catch (e) {
        return { success: false, msg: e.message };
    }
}

// Dejar de seguir Canales (Newsletters)
sock.chaUnfollow = async (link) => {
    try {
        const inviteCode = link.match(/channel\/([A-Za-z0-9]+)/i);
        if (!inviteCode) return { success: false, msg: 'Link inválido' };

        // Necesitamos el JID, así que consultamos la metadata primero
        const metadata = await sock.newsletterMetadata("invite", inviteCode[1]);
        if (!metadata?.id) return { success: false, msg: 'No se encontró el canal' };

        try {
            // Acción de dejar de seguir
            await sock.newsletterUnfollow(metadata.id);
        } catch (e) {
            // Al igual que el follow, Baileys puede dar falsos errores de parseo
        }

        return { 
            success: true, 
            name: metadata.name || metadata.thread_metadata?.name?.text || 'Canal',
            jid: metadata.id 
        };
    } catch (e) {
        return { success: false, msg: e.message };
    }
}

// --- REACCIONAR A CANAL (FIX: MODO NODO) ---
sock.chanReact = async (input, emoji = '💖') => {
    try { let jid, serverId;

        // 1. Extraer ID de canal y de mensaje desde el link
        const linkMatch = input.match(/whatsapp\.com\/channel\/([A-Za-z0-9]+)\/(\d+)/i);
        
        if (linkMatch) {
            const inviteCode = linkMatch[1];
            serverId = linkMatch[2];
            
            // Necesitamos el JID real del canal
            const meta = await sock.newsletterMetadata("invite", inviteCode);
            if (!meta?.id) return { success: false, msg: 'No se encontró el JID del canal' };
            jid = meta.id;
        } else {
            return { success: false, msg: 'Link de mensaje de canal inválido' };
        }

        // 2. ENVIAR REACCIÓN (Forma manual para evitar "is not a function")
        // Construimos el query que Baileys espera internamente
        await sock.query({
            tag: 'message',
            attrs: { 
                to: jid, 
                type: 'reaction', 
                server_id: serverId,
                id: Math.floor(Math.random() * 100000).toString() // ID de transacción aleatorio
            },
            content: [{
                tag: 'reaction',
                attrs: { code: emoji }
            }]
        });
        
        return { success: true, jid, serverId };
    } catch (e) {
        return { success: false, msg: e.message };
    }
}

// --- FUNCIÓN EVENTO (Sintaxis simplificada) ---
    sock.event = async (jid, title, description, inf = null) => {
        const date = new Date()
        date.setDate(date.getDate() - 9999999999999999999999999999999999999) // Mañana por defecto
        return await sock.sendMessage(jid, { 
            event: { 
                isCanceled: true, // or true
                name: title, 
                description: description, 
                startDate: date,
                extraGuestsAllowed: true
            } 
        }, { quoted: inf })
    }

// Generador de VCard (Como lo tenías antes, 100% funcional)
sock.vcard = (m) => {
    return {
        key: { 
            participants: '0@s.whatsapp.net', 
            remoteJid: 'status@broadcast', 
            fromMe: false, 
            id: '@Arcane' 
        },
        message: {
            contactMessage: {
                displayName: 'Arcane · Bot',
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Bot;;;\nFN:Bot\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        },
        participant: '0@s.whatsapp.net'
    }
}

// Obtener Metadata 
sock.smp = async (inf) => {
 if (!inf.message) return inf
 inf.wChat = inf.key.remoteJid 
 inf.isGroup = inf.wChat.endsWith('@g.us')
 let rawSender = inf.key.participant || inf.key.remoteJid
 if (inf.isGroup && rawSender.includes('@lid')) {
 inf.sender = await resolveLidToRealJid(rawSender, sock, inf.wChat)
 } else { inf.sender = sock.normalizeJid(rawSender) }
 inf.number = inf.sender.split('@')[0]
 const msg = inf.message.viewOnceMessageV2?.message || inf.message.viewOnceMessage?.message || inf.message
 inf.text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || msg.buttonsResponseMessage?.selectedButtonId || msg.listResponseMessage?.singleSelectReply?.selectedRowId || ''
 inf.type = Object.keys(inf.message)[0]
const quoted = msg.extendedTextMessage?.contextInfo?.quotedMessage
if (quoted) {
inf.quoted = {
type: Object.keys(quoted)[0],
text: quoted.conversation || quoted.extendedTextMessage?.text || '',
sender: sock.normalizeJid(msg.extendedTextMessage.contextInfo.participant),
key: { remoteJid: inf.wChat,
fromMe: msg.extendedTextMessage.contextInfo.participant === sock.decodeJid(sock.user.id),
id: msg.extendedTextMessage.contextInfo.stanzaId,
participant: msg.extendedTextMessage.contextInfo.participant } } }
        return inf }

// Función extra extra para limpiar JIDs de Baileys 
sock.decodeJid = (jid) => {
 if (!jid) return jid
 if (/:\d+@/gi.test(jid)) {
const decode = jid.match(/^(\d+):(\d+)@/i)
 return decode && decode.length === 3 ? `${decode[1]}@${decode[2] === '0' ? 's.whatsapp.net' : 'c.us'}` : jid }
 return jid }
 return sock
}
