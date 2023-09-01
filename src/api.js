const WerewolfApo = (function() {
    // private variables and functions

    return {
      // Extracts dicepool names from a chat call
      dicePoolNames: function(msg) {
        let args = msg.split(' ')

        // valid msg contains either "!rollWerewolf dicepoolX"
        // or
        // "!rollWerewolf dicepoolX dicepool Y"
        if (args.length == 3) {
          return [args[1], args[2]]
        } else if (args.length == 2) {
          return args[1];
        } else {
          return []
        }
      }
    }
})();

on('ready',()=>{

  const roll = (player, dicepool1, dicepool2)=>{

    sendChat("Jack", `{&{template:werewolf-roll} {{name=Jack}} {{normalDice=No dice}}`);
  };

  on('chat:message',msg=>{
    if('api'===msg.type && /^!rollWerewolf(\b\s|$)/i.test(msg.content)){
      roll();
    }
  });

  sendChat('API', "I'm locked and loaded.")
});
