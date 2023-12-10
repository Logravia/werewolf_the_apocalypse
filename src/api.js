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
  const OUTCOMES = {success: "success", totalFailure: "totalFailure", criticalHit: "criticalHit", brutalOutcome: "brutalOutcome", neutral: "" }
  const DICE_URLS = {rage: diceURLs("rage"), normal: diceURLs("normal")}
  const GRAPHICS = {success: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/success.png",
                    totalFailure: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/failure.png",
                    criticalHit: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/critical.png",
                    brutalOutcome: "https://raw.githubusercontent.com/Logravia/werewolf_the_apocalypse/main/images/roll_outcomes/brutal.png"}
  const OUTCOME_SIZING = { width: 180, height: 40 }
  const TEMPLATE = '&{template:werewolf-roll} '
  const DICE_SIZE = {normal: 30, larger: 35, large: 40}
  const POOL_NAMES = [
  "strength",
  "dexterity",
  "stamina",
  "charisma",
  "manipulation",
  "composure",
  "intelligence",
  "wits",
  "resolve",
  "health",
  "willpower",
  "willpower_status_num",
  "athletics",
  "brawl",
  "craft",
  "driving",
  "firearms",
  "larceny",
  "melee",
  "stealth",
  "survival",
  "animal_ken",
  "etiquette",
  "insight",
  "intimidation",
  "leadership",
  "performance",
  "persuasion",
  "streetwise",
  "subterfuge",
  "academics",
  "awareness",
  "finance",
  "investigation",
  "medicine",
  "occult",
  "politics",
  "science",
  "technology",
  "glory",
  "honor",
  "wisdom",
  "rage",
  "harano",
  "hauglosk"
];


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

  function extractDiceRollConfigurationFromMessage(msg) {
    log("Roll message:", msg)
    let diceRollConfiguration = {poolNames: [], modifier: 0}
    let args = msg.content.split(' ')

    args.forEach(arg => {
      if (parseInt(arg)){
        diceRollConfiguration.modifier = parseInt(arg)
      } else if(validDicePool(arg)) {
        diceRollConfiguration.poolNames.push(arg)
      }
    }
    )
    log("Returned dice configuration:", diceRollConfiguration)
    return diceRollConfiguration
  }

  function validDicePool(name){
    return POOL_NAMES.includes(name);
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
    let diceConfig = extractDiceRollConfigurationFromMessage(msg);
    let charId = msg.rolledByCharacterId
    let dicepool = [diceConfig.modifier]

    diceConfig.poolNames.forEach(name=>{
      dicepool.push(getAttrByName(charId, name))
    })

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
    //let diceRollConfiguration = {poolNames: [], modifier: 0}
    let poolNames = extractDiceRollConfigurationFromMessage(msg).poolNames
    let rollStr = poolNames[0]

    for (let i = 1; i < poolNames.length; i++) {
      rollStr += ` + ${poolNames[i]}`
    }

    return rollStr;
  }

  function makeImgFromURL(url, alt, size){
    if (url=="" || url == undefined){ return "" }
    return `<img src="${url}" alt="${alt}" width="${size.width}" height="${size.height}"/>`
  }

  function diceImages(type="normal", roll=[]) {
    let dice = DICE_URLS[type];
    let imgStr = ""
    roll.forEach((res,i)=>{
      imgStr+=`<img src="${dice[res-1]}" alt="d10, ${i+1}" width="${DICE_SIZE.larger}" height="${DICE_SIZE.larger}"/>`
    })

    return imgStr
  }

  function rollMessage(dt) {
    let rageDice = diceImages("rage", dt.rageDiceResult);
    let normalDice = diceImages("normal", dt.normalDiceResult)
    let outcomeImage = makeImgFromURL(GRAPHICS[dt.outcome], dt.outcome, OUTCOME_SIZING)

    return TEMPLATE + `{{rolls=${dt.rolls}}} {{successes=${dt.successes}}} {{type=${dt.type}}} {{rage=${dt.rage}}} {{outcome=${dt.outcome}}} {{rageDice=${rageDice}}} {{normalDice=${normalDice}}} {{outcomeImage=${outcomeImage}}}`
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

});
