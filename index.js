require('dotenv').config(); //initializes dotenv
const axios = require('axios');
const { Client, GatewayIntentBits} = require('discord.js'); //imports discord.js


const { TextServiceClient } = require("@google-ai/generativelanguage").v1beta2;
const { GoogleAuth } = require("google-auth-library");
const MODEL_NAME = "models/text-bison-001";

const chatClient = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(process.env.GOOGLE_KEY),
});

async function answerChat(prompt) {
    try {
        const result = await chatClient.generateText({
            model: MODEL_NAME,
            prompt: {
              text: prompt,
            },
          })

          if (!result.length || !result[0].candidates.length) {
            return 'Error: No response';
          }
      
          return result[0].candidates[0].output;
    }
    catch (error) {
        return 'Error: ' + error.message;
    }
}

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
],}); //creates new client
let timer;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async msg => {
    const [command, ...args] = msg.content.split(/\s+/)
    switch (command) {
        case "!ping":
            msg.reply("Pong!");
            break;
        case "!chat":
            msg.channel.send("I'm thinking..."); //the reply to the user command
            const response = await answerChat(args.join(" ")); //fetches the URL from the API
            if (response.length > 2000) {
                msg.channel.send('Text too long, sending as attachment', {files: [response]})
            } else {
                msg.channel.send(response)
            }
            break;
        case '!timer':
            const workTime = +args[0];
            const breakTime = +args[1];
            msg.channel.send(`You are now subscribed to work timer for ${workTime}minutes.`);
            timer = setTimeout (function () {
                msg.channel.send("Please take a break now!")
                msg.channel.send(`You are now subscribed to break timer for ${breakTime}minutes.`);
                timer = setTimeout (function () {
                    msg.channel.send("Break over!");
                }, breakTime * 60 * 1000);
            }, workTime * 60 * 1000);
            break;
        case "!stop":
            msg.channel.send("I have stopped work timer.");
            clearTimeout(timer);
            break;
    }
});

// //this line must be at the very end
client.login(process.env.CLIENT_TOKEN); //signs the bot in with token