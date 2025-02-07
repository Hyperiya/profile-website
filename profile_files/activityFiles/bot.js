const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
require('dotenv').config();

// Create Discord client with necessary intents
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ] 
});

// Check if bot token exists
if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('No bot token found in environment variables!');
    process.exit(1);
}

// Login the bot
client.login(process.env.DISCORD_BOT_TOKEN);

// Track when bot is ready
client.once('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${client.user.tag}`);
});

// Error handling
client.on('error', error => {
    console.error('Discord WebSocket Error:', error);
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    let userId = process.env.UID;
    // Send initial status
    client.guilds.cache.forEach(guild => {
        // Try to fetch the member
        guild.members.fetch(userId)
            .then(member => {
                const status = member.presence?.status || 'offline';
                console.log("First status:", status);
                ws.send(JSON.stringify({ status }));
            }
        )
    })

    // Update WebSocket clients when presence changes
    client.on('presenceUpdate', (oldPresence, newPresence) => {
        const MY_USER_ID = process.env.UID;
        if (newPresence?.user?.id === MY_USER_ID) {
            if (oldPresence?.status !== newPresence?.status) {
                ws.send(JSON.stringify({ 
                    status: newPresence.status || 'offline' 
                }));
            }
        }
    });
});

