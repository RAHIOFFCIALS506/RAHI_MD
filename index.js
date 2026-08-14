import { 
    useMultiFileAuthState, 
    makeWASocket, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    Browsers 
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'
import { loadSettings, getSetting } from './settings.js'
import { handleMessage, handleGroupParticipants } from './handler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ১. সেটিংস নিরাপদে লোড করা
try {
    await loadSettings()
} catch (e) {
    console.error("⚠️ Failed to load settings.js:", e.message)
}

export let commands = new Map()
let botReady = false
let sock = null

// Terminal Color Palette
const colors = {
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
}

// ২. সেফ কমান্ড লোডার (Safe Command Loader)
const loadCommands = async () => {
    commands.clear()
    const cmdPath = join(__dirname, 'commands')

    if (!existsSync(cmdPath)) {
        console.log(`${colors.yellow}⚠️ 'commands' folder missing. Creating/skipping...${colors.reset}`)
        return
    }

    const files = readdirSync(cmdPath).filter(f => f.endsWith('.js'))
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
            console.error(`${colors.red}❌ Error loading command [${file}]:${colors.reset}`, e.message)
        }
    }
    console.log(`${colors.cyan}⚡ Loaded ${commands.size} commands successfully!${colors.reset}`)
}

// ৩. মেইন বট প্রসেস
const startBot = async () => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth')
        const { version } = await fetchLatestBaileysVersion()
        const authMode = getSetting('bot.auth') || 'pr'

        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            markOnlineOnConnect: true
        })

        // অটো সেশন সেভার
        sock.ev.on('creds.update', saveCreds)

        // কানেকশন ও সুন্দর পেয়ারিং ব্যানার
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                if (authMode === 'qr') {
                    qrcode.generate(qr, { small: true })
                } else if (authMode === 'pr') {
                    const ownerNum = (getSetting('owner.number') || '').replace(/\D/g, '')
                    
                    if (ownerNum && !sock.authState.creds.registered) {
                        setTimeout(async () => {
                            try {
                                const code = await sock.requestPairingCode(ownerNum)
                                const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
                                
                                console.log(`\n${colors.magenta}╔══════════════════════════════════════════════════════╗${colors.reset}`)
                                console.log(`${colors.magenta}║${colors.reset}         ${colors.yellow}${colors.bold}⚡ RAHI_MD PAIRING SYSTEM ⚡${colors.reset}                ${colors.magenta}║${colors.reset}`)
                                console.log(`${colors.magenta}╠══════════════════════════════════════════════════════╣${colors.reset}`)
                                console.log(`${colors.magenta}║${colors.reset}  📱 Owner Number : ${colors.cyan}${colors.bold}+${ownerNum}${colors.reset}`)
                                console.log(`${colors.magenta}║${colors.reset}  🔑 Pairing Code  : ${colors.green}${colors.bold}${formattedCode.padEnd(27)}${colors.reset}${colors.magenta}║${colors.reset}`)
                                console.log(`${colors.magenta}╚══════════════════════════════════════════════════════╝${colors.reset}\n`)
                            } catch (err) {
                                console.error(`${colors.red}Pairing Request Failed:${colors.reset}`, err.message)
                            }
                        }, 3000)
                    }
                }
            }

            if (connection === 'open') {
                botReady = true
                console.log(`\n${colors.green}${colors.bold}====================================================${colors.reset}`)
                console.log(`${colors.green}${colors.bold}    🚀 RAHI_MD BOT IS NOW ONLINE & CONNECTED!        ${colors.reset}`)
                console.log(`${colors.green}${colors.bold}====================================================${colors.reset}\n`)
            }

            if (connection === 'close') {
                botReady = false
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut

                if (shouldReconnect) {
                    console.log(`${colors.yellow}🔄 Connection lost! Reconnecting automatically...${colors.reset}`)
                    startBot()
                } else {
                    console.log(`${colors.red}❌ Session expired/logged out. Please delete 'auth' folder and restart.${colors.reset}`)
                }
            }
        })

        // ৪. গ্রুপ ইভেন্ট (Welcome & Goodbye)
        sock.ev.on('group-participants.update', async (update) => {
            try {
                await handleGroupParticipants(sock, update)
            } catch (err) {
                console.error("Group Participant Event Error:", err.message)
            }
        })

        // ৫. মেসেজ লিসেনার
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (type !== 'notify' || !botReady) return
                const m = messages[0]
                if (!m) return
                await handleMessage(sock, m, commands)
            } catch (err) {
                console.error("Message Processing Error:", err.message)
            }
        })

    } catch (criticalError) {
        console.error(`${colors.red}Critical Engine Error:${colors.reset}`, criticalError)
    }
}

// রান বোট
loadCommands().then(() => startBot())
