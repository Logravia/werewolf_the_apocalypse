const WerewolfApo = (function() {
  // private variables and functions
  const DICE_TYPE = 10
  const OUTCOMES = { failure: "failure", success: "success", totalFailure: "total failure", criticalSuccess: "critical success", brutalOutcome: "Brutal outcome" }

  function brutalOutcome(rollResult, rage) {
    // starting dice are considered rage dice in the pool
    let rageDice = rollResult.slice(0, rage)
    // all dice 2 or below are brutal dice
    let brutalResultCount = rageDice.filter(result => result <= 2)
    // if there are two or more brutal dice it's a brutal outcome
    return brutalResultCount >= 2
  }

  function successCount(diceRolls) {
    return diceRolls.filter(rollResult => successDie(rollResult))
  }

  // Extracts dicepool names from a chat call
  function dicePoolNames(msg) {
    let args = msg.split(' ')

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
      diceResult.push(randomInteger(DICE_TYPE));
    }

    return rollResult;
  }

  //returns total dice pool size
  function dicePoolSize(names) {

  }

  function successDie(die) {
    return 6 <= die
  }

  function rollOutcome(diceRolls, difficulty, rage) {
    let successes = successCount(diceRolls)

    if (brutalOutcome(diceRolls, rage)) {
      return OUTCOMES.brutalOutcome;
    }

    if (successes >= difficulty && criticalRoll(diceRolls)) {
      return OUTCOMES.criticalSuccess;
    }

    if (successes >= difficulty) {
      return OUTCOMES.success;
    }

    if (successes === 0) {
      return OUTCOMES.totalFailure;
    }

    return OUTCOMES.failure;
  }

  function criticalRoll(rollResult) {
    return criticalCount >= criticalCount(rollResult)
  }

  function criticalCount(rollResult) {
    // criticals are pairs of 10s
    let amountOfTens = rollResult.filter(result => result == 10).length;
    let criticalCount = floor(amountOfTens / 2)
    return criticalCount
  }

    return {
      // Public functions
    }
})();

on('ready', () => {
  const roll = (player, dicepool1, dicepool2) => {
    sendChat("Jack", `{&{template:werewolf-roll} {{name=Jack}} {{normalDice=No dice}}`);
  };

  on('chat:message', msg => {
    if ('api' === msg.type && /^!rollWerewolf(\b\s|$)/i.test(msg.content)) {
      roll();
    }
  });

  sendChat('API', "I'm locked and loaded.")
});
