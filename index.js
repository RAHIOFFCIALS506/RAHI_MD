import { useMultiFileAuthState, makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'
import { loadSettings, getSetting } from './settings.js'
import { handleMessage, handleGroupParticipants } from './handler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
await loadSettings()

export let commands = new Map()
let botReady = false
let sock = null

// ১. কমান্ড লোডার
const loadCommands = async () => {
    commands.clear()
    const files = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
    for (const file of files) {
        try {
            const { default: cmd } = await import(`./commands/${file}?t=${Date.now()}`)
            if (cmd?.info?.name && cmd?.execute) {
                commands.set(cmd.info.name.toLowerCase(), cmd)
                if (Array.isArray(cmd.info.alias)) {
                    cmd.info.alias.forEach(a => commands.set(a.toLowerCase(), cmd))
                }
            }
        } catch (e) {
            console.error(`❌ Error loading: ${file}`)
        }
    }
}

// ২. স্টার্ট বট
const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const { version } = await fetchLatestBaileysVersion()
    const authMode = getSetting('bot.auth')

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false
    })

    // ... আগের অন্য কোড ...

// এই ইভেন্ট লিসেনারটি না থাকলে Welcome/Goodbye মেসেজ ট্রিগার হবে না
sock.ev.on('group-participants.update', async (update) => {
    await handleGroupParticipants(sock, update)
})

    // কালারফুল পেয়ারিং সিস্টেম
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            if (authMode === 'qr') {
                qrcode.generate(qr, { small: true })
            } else if (authMode === 'pr') {
                const ownerNum = getSetting('owner.number').replace(/\D/g, '')
                setTimeout(async () => {
                    try {
                        const code = await sock.requestPairingCode(ownerNum)
                        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
                        
                        const cyan = '\x1b[36m'
                        const yellow = '\x1b[33m'
                        const green = '\x1b[32m'
                        const bold = '\x1b[1m'
                        const reset = '\x1b[0m'
                        
                        console.log(`\n${cyan}┌────────────────────────────────────────┐${reset}`)
                        console.log(`${cyan}│${reset}        ${yellow}${bold}🔑 WHATSAPP PAIRING CODE${reset}         ${cyan}│${reset}`)
                        console.log(`${cyan}├────────────────────────────────────────┤${reset}`)
                        console.log(`${cyan}│${reset}  Your Code: ${green}${bold}${formattedCode.padEnd(25)}${reset}   ${cyan}│${reset}`)
                        console.log(`${cyan}└────────────────────────────────────────┘${reset}\n`)
                    } catch (err) {
                        console.error("Pairing Code Error:", err)
                    }
                }, 3000)
            }
        }

        if (connection === 'open') {
            botReady = true
            console.log('\x1b[32m\x1b[1m✅ Bot Connected 𝑹𝑨𝑯𝑰_𝑴𝑫!\x1b[0m')
        }

        if (connection === 'close') {
            const err = new Boom(lastDisconnect?.error)
            if (err?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('\x1b[33m🔄 Reconnecting...\x1b[0m')
                startBot()
            } else {
                console.log('\x1b[31m❌ Bot logged out. Delete "auth" folder and restart.\x1b[0m')
            }
        }
    })

    // অ্যান্টি-কল
    sock.ev.on('call', async (calls) => {
        if (!global.anticall) return

        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from)
                await sock.sendMessage(call.from, { 
                    text: "❌ *Anti-Call Active:* Incoming calls are disabled. Please send a text message." 
                })
            }
        }
    })
// Message event
sock.ev.on('messages.upsert', async (chatUpdate) => {
  const m = chatUpdate.messages[0];
  await handleMessage(sock, m, commands);
});

// Group participants update event (Welcome & Goodbye)
sock.ev.on('group-participants.update', async (update) => {
  await handleGroupParticipants(sock, update);
});
    // মেসেজ ইভেন্ট
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' || !botReady) return
        const m = messages[0]
        await handleMessage(sock, m, commands)
    })
}

loadCommands().then(() => startBot())
