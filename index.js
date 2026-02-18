const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  PermissionsBitField
} = require('discord.js');

const { REST } = require('@discordjs/rest');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 儲存每個伺服器是否開啟
const mineStatus = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName('mine')
    .setDescription('開關地雷模式')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('on / off')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    )
    .toJSON()
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log('Slash command registered.');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'mine') {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: '只有管理員可以使用', ephemeral: true });

    const mode = interaction.options.getString('mode');

    if (mode === 'on') {
      mineStatus.set(interaction.guild.id, true);
      return interaction.reply('💣 地雷模式已開啟（1/10 機率）');
    }

    if (mode === 'off') {
      mineStatus.set(interaction.guild.id, false);
      return interaction.reply('🛑 地雷模式已關閉');
    }
  }
});

client.on('messageCreate', async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  if (!mineStatus.get(message.guild.id)) return;

  const chance = Math.floor(Math.random() * 10) + 1;

  if (chance === 1) {
    try {
      await message.member.timeout(60 * 1000, "踩到地雷 💣");
      message.reply(`💥 ${message.author} 踩到地雷！禁言 1 分鐘！`);
    } catch (err) {
      console.error(err);
    }
  }
});

client.login(process.env.TOKEN);
