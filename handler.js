import { getSetting } from './settings.js'

const spamTracker = new Map()

/**
 * 1. Main Message & Feature Handler (Merged: Anti-Features + Owner Guard + Command Engine)
 */
export async function handleMessage(sock, m, commands) {
  try {
    if (!m || !m.message) return

    const jid = m.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    const now = Date.now()

    // 👤 Sender and User Number Extraction
    const participant = isGroup ? (m.key.participant || m.participant) : jid
    const sender = participant || jid
    const userNumber = sender ? sender.split('@')[0].replace(/\D/g, '') : ''

    // 👑 Config Owner Number Extraction
    const rawOwner = getSetting('owner.number') || '8801711209381'
    const ownerNumbers = Array.isArray(rawOwner) 
        ? rawOwner.map(num => String(num).replace(/\D/g, '8801711209381'))
        : [String(rawOwner).replace(/\D/g, '8801711209381')]

    // Check if the sender is an owner
    const isOwner = m.key.fromMe || ownerNumbers.includes(userNumber)

    // 📝 Extract Message Text (Normal text, extended context, captions)
    const text = m.message?.conversation || 
                 m.message?.extendedTextMessage?.text || 
                 m.message?.imageMessage?.caption || 
                 m.message?.videoMessage?.caption || 
                 m.message?.documentMessage?.caption || ""

    // ─── 🛡️ 1. Anti-Spam System ───
    if (global.antispam && !isOwner) {
      let history = spamTracker.get(sender) || []
      history = history.filter(time => now - time < 5000)
      history.push(now)
      spamTracker.set(sender, history)

      if (history.length > 5) {
        await sock.sendMessage(jid, { 
          text: "⚠️ *Stop spamming!* Please slow down your messages." 
        }, { quoted: m })
        spamTracker.set(sender, [])
        return
      }
    }

    // ─── 🖼️ 2. Anti-Sticker System ───
    if (global.antisticker && isGroup && !isOwner) {
      const isSticker = m.message?.stickerMessage
      if (isSticker) {
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})
        return
      }
    }

    // ─── 🔗 3. Anti-Link & Auto-Kick System ───
    if (isGroup && global.antilinkMode && global.antilinkMode[jid] && global.antilinkMode[jid] !== 'off' && !m.key.fromMe) {
      const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me|whatsapp\.com\/channel)\/([a-zA-Z0-9]+)/gi
      
      if (linkRegex.test(text)) {
        try {
          const groupMetadata = await sock.groupMetadata(jid)
          const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin

          // Skip if sender is a Group Admin or Owner
          if (!senderAdmin && !isOwner) {
            // Delete Link Message
            await sock.sendMessage(jid, { delete: m.key }).catch(() => {})

            // Kick action if set to 'kick' mode
            if (global.antilinkMode[jid] === 'kick') {
              const botJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : ''
              const botAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin

              if (botAdmin) {
                await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
                await sock.sendMessage(jid, { 
                  text: `🚫 @${sender.split('@')[0]} was kicked for sending links!`, 
                  mentions: [sender] 
                })
              }
            }
            return
          }
        } catch (e) {
          console.error("AntiLink Error:", e)
        }
      }
    }

    // ─── ⚡ 4. Command Executer Engine ───
    const prefix = getSetting('bot.prefix') || '.'
    if (!text.startsWith(prefix)) return

    const args = text.slice(prefix.length).trim().split(/ +/)
    const cmdName = args.shift().toLowerCase()
    const command = commands.get(cmdName)

    if (command) {
      // 👑 OWNER ONLY GUARD
      if (command.info?.ownerOnly && !isOwner) {
        await sock.sendMessage(jid, { 
          text: '❌ *Access Denied!* এই কমান্ডটি শুধুমাত্র বটের Owner ব্যবহার করতে পারবেন।' 
        }, { quoted: m })
        return
      }

      try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } })
        
        // Extended payload support for flexible command structure
        const fullText = text.slice(prefix.length + cmdName.length).trim()
        const botNumber = sock.user?.id ? sock.user.id.split(':')[0].replace(/\D/g, '') : ''

        await command.execute(sock, m, args, { 
          isOwner, 
          isGroup, 
          jid, 
          sender, 
          userNumber, 
          botNumber, 
          prefix, 
          cmdName, 
          fullText 
        })
        
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } })
      } catch (e) {
        console.error(`Error executing command [${cmdName}]:`, e)
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } })
        await sock.sendMessage(jid, { text: `❌ *Command Error:* ${e.message}` }, { quoted: m })
      }
    }

  } catch (err) {
    console.error("Handle Message Critical Error:", err)
  }
}

/**
 * 2. Group Participants Handler (Welcome & Goodbye Card)
 */
export async function handleGroupParticipants(sock, update) {
  try {
    const { id, participants, action } = update
    if (action !== 'add' && action !== 'remove') return

    const botName = getSetting('bot.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'
    const menuPic = getSetting('bot.image') || 'https://i.postimg.cc/05p6KqCc/1768548671157.jpg'

    let groupMetadata
    try {
      groupMetadata = await sock.groupMetadata(id)
    } catch (e) {
      console.error("Failed to fetch group metadata:", e)
      return
    }

    const groupName = groupMetadata.subject || 'Our Group'
    const totalMembers = groupMetadata.participants ? groupMetadata.participants.length : 0

    for (const jid of participants) {
      const userNum = jid.split('@')[0]

      // 🎉 Welcome Event
      if (action === 'add') {
        let welcomeText = `
✨ ━━━━━━━⟨ 🥳 *𝑾𝑬𝑳𝑪𝑶𝑴𝑬* 🥳 ⟩━━━━━━━ ✨

👋 *Hello* @${userNum}!
🎉 Welcome to *${groupName}*!

╭━━━〔 🟡 *𝐺𝑅𝑶𝑈𝑃 𝐼𝑁𝐹𝑂* 🟡 〕━━━⬣
┃ 👥 *Total Members* : ${totalMembers}
┃ 🤖 *Bot System*    : ${botName}
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

> 💛 *Please follow group rules and enjoy your stay!*`

        await sock.sendMessage(id, {
          text: welcomeText,
          mentions: [jid],
          contextInfo: {
            externalAdReply: {
              title: `🎉 WELCOME TO ${groupName.toUpperCase()}`,
              body: `Member #${totalMembers}`,
              thumbnailUrl: menuPic,
              sourceUrl: "https://whatsapp.com",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        })
      }

      // 💔 Goodbye Event
      if (action === 'remove') {
        let goodbyeText = `
✨ ━━━━━━━⟨ 💔 *𝐺𝑂𝑂𝐷𝐵𝑌𝐸* 💔 ⟩━━━━━━━ ✨

👋 Goodbye @${userNum}!
We are sad to see you leave *${groupName}*.

╭━━━〔 🟡 *𝐺𝑅𝑶𝑈𝑃 𝑆𝑇𝐴𝑇𝑆* 🟡 〕━━━⬣
┃ 👥 *Remaining Members* : ${totalMembers}
┃ 🤖 *Bot System*        : ${botName}
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

> 💛 *We wish you all the best!*`

        await sock.sendMessage(id, {
          text: goodbyeText,
          mentions: [jid],
          contextInfo: {
            externalAdReply: {
              title: `👋 MEMBER LEFT ${groupName.toUpperCase()}`,
              body: `Remaining Members: ${totalMembers}`,
              thumbnailUrl: menuPic,
              sourceUrl: "https://whatsapp.com",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        })
      }
    }
  } catch (error) {
    console.error("Group Participants Event Error:", error)
  }
      }
