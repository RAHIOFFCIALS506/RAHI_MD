import { useMultiFileAuthState, makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'
import { loadSettings, getSetting } from './settings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
await loadSettings()

export let commands = new Map()
let botReady = false
let sock = null

// ১. কমান্ড লোড করা
const loadCommands = async () => {
    commands.clear()
    const files = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
    for (const file of files) {
        try {
            const { default: cmd } = await import(`./commands/${file}?t=${Date.now()}`)
            if (cmd?.info?.name && cmd?.execute) {
                commands.set(cmd.info.name.toLowerCase(), cmd)
                if (Array.isArray(cmd.info.alias)) cmd.info.alias.forEach(a => commands.set(a.toLowerCase(), cmd))
            }
        } catch (e) {
            console.error(`❌ Error loading: ${file}`)
        }
    }
}

// ২. বট শুরু করা
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

    sock.ev.on('creds.update', saveCreds)

    // ওয়েলকাম ফিচার
    sock.ev.on('group-participants.update', async (anu) => {
        if (!getSetting('features.welcome')) return
        if (anu.action === 'add') {
            const groupMetadata = await sock.groupMetadata(anu.id)
            const text = `👋 স্বাগতম @${anu.participants[0].split('@')[0]} আমাদের গ্রুপে: *${groupMetadata.subject}*`
            await sock.sendMessage(anu.id, { text, mentions: anu.participants })
        }
    })

    // কানেকশন ও পেয়ারিং কোড সিস্টেম
    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            if (authMode === 'qr') {
                qrcode.generate(qr, { small: true })
            } else if (authMode === 'pr') {
                const ownerNum = getSetting('owner.number').replace(/\D/g, '')
                setTimeout(async () => {
                    try {
                        const code = await sock.requestPairingCode(ownerNum)
                        console.log(`\n🔑 [PAIRING CODE]: ${code}\n`)
                    } catch (err) {
                        console.error("Pairing Code Error:", err)
                    }
                }, 3000)
            }
        }

        if (connection === 'open') {
            botReady = true
            console.log('✅ Bot Connected Successfully!')
        }

        if (connection === 'close') {
            const err = new Boom(lastDisconnect?.error)
            if (err?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnecting...')
                startBot()
            } else {
                console.log('❌ Bot logged out. Delete "auth" folder and restart.')
            }
        }
    })

    // মেসেজ, অ্যান্টিলিংক ও কমান্ড হ্যান্ডলার
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' || !botReady) return
        const m = messages[0]
        if (!m.message) return
        const jid = m.key.remoteJid
        const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ""

        // Antilink
        if (getSetting('features.antilink') && jid.endsWith('@g.us') && !m.key.fromMe) {
            const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me)\/([a-zA-Z0-9]+)/gi
            if (linkRegex.test(text)) {
                await sock.sendMessage(jid, { delete: m.key }).catch(() => {})
            }
        }

        // কমান্ড হ্যান্ডলার
        const prefix = getSetting('bot.prefix')
        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const cmdName = args.shift().toLowerCase()
        const command = commands.get(cmdName)

        if (command) {
            try {
                await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } })
                await command.execute(m, sock, args, text, { jid })
                await sock.sendMessage(jid, { react: { text: '✅', key: m.key } })
            } catch (e) {
                console.error(e)
            }
        }
    })
}

loadCommands().then(() => startBot())
