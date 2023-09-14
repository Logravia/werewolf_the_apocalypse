const SKILLS = [
  'athletics',    'brawl',
  'craft',        'driving',
  'firearms',     'larceny',
  'melee',        'stealth',
  'survival',     'animal_ken',
  'etiquette',    'insight',
  'intimidation', 'leadership',
  'performance',  'persuasion',
  'streetwise',   'subterfuge',
  'academics',    'awareness',
  'finance',      'investigation',
  'medicine',     'occult',
  'politics',     'science',
  'technology'
]
const ATTRS = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve'
]
const OTHER_ATTRS = ["glory", "wisdom", "honor", "rage", "hauglosk", "harano"]

const HITPOINT_ORDER = ["empty", "full", "scratch", "grievous"];

const MAX_HITPOINTS = 10;

function applyStyleToDotButtonSet(name, value) {
  let dotOne = $20(`.${name}[value='1']`)
  if (value === 0 ) {
    dotOne.removeClass("clear-me selected")
    return;
  }

  for (let i = 1; i <=5; i++) {
    let dot = $20(`.${name}[value="${i}"]`);
    i<=value ? dot.addClass("selected") : dot.removeClass("selected")
  }

  if (value === 1) {
    dotOne.addClass("clear-me")
  }
}

function doubleResetClick(hist, curAttr, curVal) {
  let prevName = hist.click_history.name
  let prevVal = hist.click_history.val
  return prevName === curAttr && prevVal === 1 && curVal === 1
}

function restoreDotStyling(){
  restoreAttributeStyling(SKILLS.concat(ATTRS).concat(OTHER_ATTRS));
}

function restoreAttributeStyling(arr){
  getAttrs(arr, (names_values)=> {
    let keys = Object.keys(names_values);
    keys.forEach(key=>{
      applyStyleToDotButtonSet(key, names_values[key])
    })
  })
}

function setUpDotValueButton() {
  $20('.dot-value-button').on('click', e => {
    let dotValue = parseInt(e.htmlAttributes.value);
    let attrToChange = e.htmlAttributes["data-name"];

    getAttrs(["click_history"], hist => {
      if (doubleResetClick(hist, attrToChange, dotValue)) {
        dotValue = 0;
      }

      applyStyleToDotButtonSet(attrToChange, dotValue);

      setAttrs(
        {
          [attrToChange]: dotValue,
          click_history: { name: attrToChange, val: dotValue }
        });
    })
  })
}
function clearHitpointBoxes(name){
  let classesToRemoveStr = HITPOINT_ORDER.join(" ")

  for (let i = 1; i <= MAX_HITPOINTS; i++) {
    $20(`.${name}`).removeClass(classesToRemoveStr)
  }
}


function styleHitpointBoxes(name, status) {
  let i = 1

  for(; i<=status.full; i++){
    $20(`.${name}[value="${i}"]`).addClass("full")
  }

  for(; i<=status.scratch + status.full; i++){
    $20(`.${name}[value="${i}"]`).addClass("scratch")
  }

  for(; i<=status.grievous + status.scratch + status.full; i++){
    $20(`.${name}[value="${i}"]`).addClass("grievous")
  }
}

function nextHitpointState(curState){
  const currentIndex = HITPOINT_ORDER.indexOf(curState);
  const nextIndex = (currentIndex + 1) % HITPOINT_ORDER.length;
  return HITPOINT_ORDER[nextIndex];
}

function setUpHealthWillButton() {
  $20(".health-will-button").on("click", e => {
    let name = e.htmlAttributes["data-name"];
    let injury = e.htmlAttributes.class.split(" ").pop() // last class should be injury type
    let attrStr = `${name}_status`

    getAttrs([attrStr], vals => {
      let status = JSON.parse(vals[attrStr])

      styleHitpointBoxes(name, status);
    })
  })
}

on("sheet:opened", () => {
  setUpDotValueButton();
  setUpHealthWillButton();
  restoreDotStyling();
});

on("clicked:test", ()=>{
  clearHitpointBoxes("health");
  console.log("I've been called")
})
