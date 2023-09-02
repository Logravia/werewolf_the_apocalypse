const WerewolfApo = (function () {
  // private variables and functions
  const DICE_TYPE = 10
  const ROLL_TYPES = {check: "check", harano: "harano", hauglosk: "hauglosk", willpower: "willpower", attribute: "attribute", "attributeAttribute": "attribute + attribute", attributeSkill: "attribute + skill", invalid: "invalid roll"}
  const OUTCOMES = { failure: "failure", success: "success", totalFailure: "total failure", criticalHit: "critical success", brutalOutcome: "Brutal outcome", neutral: "" }
  const TEMPLATE = '&{template:werewolf-roll} '

  function brutalOutcome(rollResult, rage) {
    // starting dice are considered rage dice in the pool
    let rageDice = rollResult.slice(0, rage)
    // all dice 2 or below are brutal dice
    let brutalResultCount = rageDice.filter(result => result <= 2).length
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
    return 2 >= criticalCount(diceRolls)
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

  function rollMessage(diceRolls, rollOutcome, type, rage, successes) {
    return TEMPLATE + `{{rollName=${type}}} {{dice=${diceRolls}}} {{outcome=${rollOutcome}}} {{rage=${rage}}} {{successes=${successes}}}`
  }

  return {
    // public
    roll: (msg) => {
      let rolls = rollDice(dicePoolSize(msg))
      let successes = successCount(rolls)
      let type = rollType(msg)
      let rage = rageAmount(msg.rolledByCharacterId)
      let outcome = rollOutcome(rolls, rage)

      let sender = `character|${msg.rolledByCharacterId}`

      let message = rollMessage(rolls, outcome, type, rage, successes)

      sendChat(sender, message)
    }
  }
})();

on('chat:message', msg => {
  if ('api' === msg.type && /^!rollWerewolf(\b\s|$)/i.test(msg.content)) {
    WerewolfApo.roll(msg);
  }
});

on('ready', () => {
  sendChat('API', "I'm locked and loaded.")
});
