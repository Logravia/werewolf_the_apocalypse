const WerewolfApo = (function () {

  function diceURLs(type) {
    let baseDiceURL = {
      normal: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/dice/dark_set/",
      rage: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/dice/rage_set/"
    }
    let diceURLs = []

    for (let i = 1; i <= 10; i++) {
      diceURLs.push(`${baseDiceURL[type]}${i}.png`)
    }

    return diceURLs;
  }

  // private variables and functions
  const DICE_TYPE = 10
  const ROLL_TYPES = {check: "check", harano: "harano", hauglosk: "hauglosk", willpower: "willpower", attribute: "attribute", "attributeAttribute": "attribute + attribute", attributeSkill: "attribute + skill", invalid: "invalid roll"}
  const OUTCOMES = {success: "success", totalFailure: "total failure", criticalHit: "critical success", brutalOutcome: "Brutal outcome", neutral: "" }
  const RAGE_DICE = diceURLs("rage")
  const DICE = diceURLs("normal")
  const GRAPHICS = {success: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/success.png",
                    totalFailure: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/failure.png",
                    criticalHit: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/critical.png",
                    brutalOutcome: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/brutal.png"}
  const TEMPLATE = '&{template:werewolf-roll} '

  function brutalOutcome(rollResult, rage) {
    let dice = rageDice(rollResult, rage)
    // all dice 2 or below are brutal dice
    let brutalResultCount = dice.filter(result => result <= 2).length
    // if there are two or more brutal dice it's a brutal outcome
    return brutalResultCount >= 2
  }

  function successCount(diceRolls) {
    let baseSuccesses = diceRolls.filter(rollResult => successDie(rollResult)).length
    let totalSuccessCount = baseSuccesses + (criticalCount(diceRolls) * 2)
    return totalSuccessCount
  }

  // Extracts dicepool names from a chat call
  function dicePoolNames(msg) {
    let args = msg.content.split(' ')

    // valid msg contains "!rollWerewolf dicepoolX [dicepoolY]"
    if (args.length == 3) {
      return [args[1], args[2]]
    } else if (args.length == 2) {
      return args[1];
    } else {
      return []
    }
  }

  function rollDice(count) {
    let rollResult = []

    for (let i = 0; i < count; i++) {
      rollResult.push(randomInteger(DICE_TYPE));
    }

    return rollResult;
  }

  //returns total dice pool size
  function dicePoolSize(msg) {
    let names = dicePoolNames(msg);
    let charId = msg.rolledByCharacterId

    let dicepool = [getAttrByName(charId, names[0]), getAttrByName(charId, names[1])]

    dicepool = dicepool.map(val=>parseInt(val));
    dicepool = dicepool.filter(val=>!isNaN(val))

    return dicepool.reduce((acc, curVal) => acc + curVal);
  }

  function rageAmount(charId){
    return getAttrByName(charId, "rage")
  }

  function successDie(die) {
    return 6 <= die
  }

  // extracts rage dice
  function rageDice(diceRolls, rage) {
    // starting dice are considered rage dice in the pool
    let dice = diceRolls.slice(0, rage)
    return dice
  }

  function normalDice(diceRolls, rage) {
    return diceRolls.slice(rage)
  }

  function rollOutcome(diceRolls, rage) {
    let successes = successCount(diceRolls)

    if (brutalOutcome(diceRolls, rage)) {
      return OUTCOMES.brutalOutcome;
    }
    if (criticalRoll(diceRolls)) {
      return OUTCOMES.criticalHit;
    }
    if (successes === 0) {
      return OUTCOMES.totalFailure;
    }

    return OUTCOMES.neutral
  }

  function criticalRoll(diceRolls) {
    return 1 <= criticalCount(diceRolls)
  }

  function criticalCount(rollResult) {
    // criticals are pairs of 10s
    let amountOfTens = rollResult.filter(result => result == 10).length;
    let criticalCount = Math.floor(amountOfTens / 2)
    return criticalCount
  }

  function rollType(msg) {
    let names  = dicePoolNames(msg)

    if (names.length === 1) {
      if (ROLL_TYPES[names[0]] !== undefined) {
        return ROLL_TYPES[names[0]]
      } else {
        // if name is not contained in types it must be an attribute of some kind
        return ROLL_TYPES.attribute
      }
    }

    if (names.length === 2) {
      return ROLL_TYPES.attributeSkill
    }

    return ROLL_TYPES.invalid;
  }

  function rollMessage(dt) {
    return TEMPLATE + `{{rolls=${dt.rolls}}} {{successes=${dt.successes}}} {{type=${dt.type}}} {{rage=${dt.rage}}} {{outcome=${dt.outcome}}} {{rageDice=${dt.rageDiceResult}}} {{normalDice=${dt.normalDiceResult}}}`
  }

  return {
    // public
    roll: (msg) => {
      const rolls = rollDice(dicePoolSize(msg));
      const successes = successCount(rolls);
      const type = rollType(msg);
      const rage = rageAmount(msg.rolledByCharacterId);
      const outcome = rollOutcome(rolls, rage);
      const rageDiceResult = rageDice(rolls, rage);
      const normalDiceResult = normalDice(rolls, rage);

      return {
        rolls,
        successes,
        type,
        outcome,
        rageDiceResult,
        normalDiceResult,
      };
    },

    // Send the chat message
    sendRollMessage: (msg, rollData) => {
      const sender = `character|${msg.rolledByCharacterId}`;
      const message = rollMessage(rollData);
      sendChat(sender, message);
    }

  }
})();

on('chat:message', msg => {
  if ('api' === msg.type && /^!rollWerewolf(\b\s|$)/i.test(msg.content)) {
    let rollData = WerewolfApo.roll(msg);
    WerewolfApo.sendRollMessage(msg, rollData);
  }
});

on('ready', () => {
  sendChat('API', "I'm locked and loaded.")
});
