/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
  let entity;
  if (args.length === 0) {
    [entity] = await Entities.getOrRegister(message.author.id);
  } else {
    entity = await Entities.getByArgs(args, message);
  }

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
      [EFFECT.BABY], entity)) !== true) {
    return;
  }

  let titleEffect = entity.effect;
  let fields = [
    {
      name: JsonReader.commands.profile.getTranslation(language).information.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(language).information.fieldValue, {health: entity.health, maxHealth: entity.maxHealth, experience: entity.Player.experience, experienceNeededToLevelUp: entity.Player.getExperienceNeededToLevelUp(), money: entity.Player.money,}),
    },
    {
      name: JsonReader.commands.profile.getTranslation(language).statistique.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(language).statistique.fieldValue, {cumulativeAttack: entity.getCumulativeAttack(await entity.Player.Inventory.getWeapon(), await entity.Player.Inventory.getArmor(), await entity.Player.Inventory.getPotion(), await entity.Player.Inventory.getActiveObject()), cumulativeDefense: entity.getCumulativeDefense(await entity.Player.Inventory.getWeapon(), await entity.Player.Inventory.getArmor(), await entity.Player.Inventory.getPotion(), await entity.Player.Inventory.getActiveObject()), cumulativeSpeed: entity.getCumulativeSpeed(await entity.Player.Inventory.getWeapon(), await entity.Player.Inventory.getArmor(), await entity.Player.Inventory.getPotion(), await entity.Player.Inventory.getActiveObject()), cumulativeMaxHealth: entity.getCumulativeHealth(entity.Player),}),
    },
    {
      name: JsonReader.commands.profile.getTranslation(language).classement.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(
          language).classement.fieldValue, {
        rank: (await Players.getById(entity.Player.id))[0].rank,
        numberOfPlayer: (await Players.count({where: {score: {[(require('sequelize/lib/operators')).gt]: 100,
            },
          },
        })),
        score: entity.Player.score,
      }),
    },
  ];

  if (!entity.checkEffect()) {
    if (message.createdAt.getTime() >= entity.Player.lastReportAt.getTime()) {
      titleEffect = ':hospital:';
      fields.push({
        name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
        value: JsonReader.commands.profile.getTranslation(language).noTimeLeft.fieldValue,
      });
    } else {
      fields.push({
        name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
        value: format(JsonReader.commands.profile.getTranslation(language).timeLeft.fieldValue, {
          effect: entity.effect,
          timeLeft: minutesToString(millisecondsToMinutes(entity.Player.lastReportAt.getTime() - message.createdAt.getTime()))
        }),
      });
    }
  }

  let msg = await message.channel.send(
      new discord.MessageEmbed()
          .setColor(JsonReader.bot.embed.default)
          .setTitle(format(JsonReader.commands.profile.getTranslation(language).title, {
                effect: titleEffect,
                pseudo: (await entity.Player.getPseudo(language)),
                level: entity.Player.level,
              }))
          .addFields(fields),
      );

  if (entity.Player.badges !== null) {
    let badges = entity.Player.badges.split('-');
    for (let i = 0; i < badges.length; i++) {
      await msg.react(badges[i]);
    }
  }

};

module.exports = {
  'profile': ProfileCommand,
  'p': ProfileCommand,
};