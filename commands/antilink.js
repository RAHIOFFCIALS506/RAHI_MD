import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'antilink',
        alias: ['linkdelete', 'antilinkdelete'],
        desc: 'Enable/Disable Anti-Link protection in group'
    },
    execute: async (m, sock, args) => {
        try {
            const jid = m.key.remoteJid

            // ১. গ্রুপ চেকিং
            if (!jid.endsWith('@g.us')) {
                return await sock.sendMessage(jid, { 
                    text: '❌ *This command can only be used in groups!*' 
                }, { quoted: m })
            }

            // ২. অ্যাডমিন ও বট চেকিং
            const groupMetadata = await sock.groupMetadata(jid)
            const sender = m.key.participant || m.key.remoteJid
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'

            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin
            const botAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin

            if (!senderAdmin && !m.key.fromMe) {
                return await sock.sendMessage(jid, { 
                    text: '❌ *Only Group Admins can control Anti-Link!*' 
                }, { quoted: m })
            }

            if (!botAdmin) {
                return await sock.sendMessage(jid, { 
                    text: '⚠️ *Warning:* Make sure I am an **Admin** so I can delete link messages!' 
                }, { quoted: m })
            }

            // ৩. গ্লোবাল অ্যান্টিলিংক মোড অবজেক্ট
            if (!global.antilinkMode) global.antilinkMode = {}

            const action = args[0]?.toLowerCase()

            if (action === 'on' || action === 'enable') {
                global.antilinkMode[jid] = 'delete'
                await sock.sendMessage(jid, { 
                    text: '🛡️ *Anti-Link Enabled!*\n\nAny WhatsApp/Group link sent by normal members will be **deleted automatically**.' 
                }, { quoted: m })

            } else if (action === 'off' || action === 'disable') {
                global.antilinkMode[jid] = 'off'
                await sock.sendMessage(jid, { 
                    text: '✅ *Anti-Link Disabled!*' 
                }, { quoted: m })

            } else {
                // স্ট্যাটাস ও ব্যবহার করার নিয়ম
                const currentStatus = global.antilinkMode[jid] === 'delete' 
                    ? '🟢 ON (Delete Mode)' 
                    : global.antilinkMode[jid] === 'kick' 
                    ? '🟢 ON (Kick Mode)' 
                    : '🔴 OFF'

                await sock.sendMessage(jid, { 
                    text: `📌 *Anti-Link Status:* ${currentStatus}\n\n*Usage:* \n🔹 \`.antilink on\` - Turn ON (Delete Links)\n🔹 \`.antilink off\` - Turn OFF` 
                }, { quoted: m })
            }

        } catch (error) {
            console.error("AntiLink Command Error:", error)
            await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ *Failed to update Anti-Link status.*' 
            }, { quoted: m })
        }
    }
                }
