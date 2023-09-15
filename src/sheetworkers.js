function advantageFlawStrs(){
 let arr = [];
  for (let i = 0; i < 12; i++) {
    arr.push(`advantage_flaw_value${i}`);
  }
  return arr;
}

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
const MAX_ATTR_VALUE = 5
const OTHER_ATTRS = ["glory", "wisdom", "honor", "rage", "hauglosk", "harano"]
const HITPOINT_ATTRS = ["health_status", "willpower_status", "crinos_status"]
const HITPOINT_TYPES = ["health", "willpower", "crinos"]
const HITPOINT_ORDER = ["empty", "full", "scratch", "grievous"];
const MAX_HITPOINTS = 10;
const HITPOINT_TEMPLATE = {empty: 10, full: 0, scratch: 0, grievous: 0, max: 3, bonus: 0}
const ADVANTAGES_FLAWS = advantageFlawStrs();

/**
 * Applies .selected or .clear-me class to buttons within a set depending on value.
 * The buttons are always a set of five.
 * Example: Resolve ()()()()() found in the Attributes table.
 * All buttons within a set carry the class name of the set.
 * @param {string} name - of the attributes, skill or other.
 * @param {number} value - the value of the attribute i.e. how high the resolve is.
 * */
function applyClassToDotButtonSet(name, value) {
  const dotOne = $20(`.${name}[value='1']`);

  if (value === 0) {
    dotOne.removeClass("clear-me selected"); return;
  }

  for (let i = 1; i <= MAX_ATTR_VALUE; i++) {
    const dot = $20(`.${name}[value="${i}"]`);
    i <= value ? dot.addClass("selected") : dot.removeClass("selected");
  }

  if (value === 1) {
    dotOne.addClass("clear-me");
  }
}

/**
 * Determines if a click on the dot button should be treated as a reset click.
 * A reset click occurs when the first dot is clicked twice to remove its value.
 *
 * @param {object} clickHistory - Object containing the history of clicks.
 * @param {string} clickedAttributeName - The name of the attribute that was clicked.
 * @param {number} clickedAttributeValue - The value of the clicked attribute.
 * @returns {boolean} True if it's a reset click, otherwise false.
 */
function resetClick(hist, clickedAttrName, clickedAttrVal) {
  const prevName = hist.click_history.name
  const prevVal = hist.click_history.val
  const isReset = prevName === clickedAttrName && prevVal === 1 && clickedAttrVal === 1

  return isReset;
}

/**
 * @returns {Array} names of all the dot attributes such as resolve, driving, hauglosk etc*/
function dotAttributes(){
  return SKILLS.concat(ATTRS).concat(OTHER_ATTRS).concat(ADVANTAGES_FLAWS)
}

/**
 * Restores class attributes for dot sets in the sheet.
 * This function retrieves data for dot attributes and applies them to corresponding dot sets.*/
function restoreDotAttributeClasses(){
  getAttrs(dotAttributes(), (names_values)=> {
    let keys = Object.keys(names_values);
    keys.forEach(key=>{
      applyClassToDotButtonSet(key, names_values[key])
    })
  })
}

/**
 * Sets up event handling for dot-value buttons.
 *
 * This function adds a click event handler to elements with the 'dot-value-button' class.
 * When clicked, it updates the value of a dot button and tracks the click history.
 */
function setUpDotValueButton() {
  $20('.dot-value-button').on('click', e => {
    let clickedDotValue = parseInt(e.htmlAttributes.value);
    let name = e.htmlAttributes["data-name"];

    getAttrs(["click_history"], hist => {
      if (resetClick(hist, name, clickedDotValue)) {
        clickedDotValue = 0;
      }

      applyClassToDotButtonSet(name, clickedDotValue);

      setAttrs(
        {
          [name]: clickedDotValue,
          click_history: { name: name, val: clickedDotValue }
        });
    })
  })
}

/**
 * Clears hitpoint boxes by removing specified classes.
 *
 * @param {string} name - The name of the element group to clear hitpoint boxes.
 */
function clearHitpointBoxes(name){
  let classesToRemoveStr = HITPOINT_ORDER.join(" ")

  for (let i = 1; i <= MAX_HITPOINTS; i++) {
    $20(`.${name}`).removeClass(classesToRemoveStr)
  }
}
/**
 * Styles hitpoint boxes based on the provided status. Classes are applied specific order.
 *
 * @param {string} name - The name of the hitpoint boxes.
 * @param {object} status - The status object containing full, scratch, grievous, and empty values.
 */
function styleHitpointBoxes(name, status) {
  clearHitpointBoxes(name)

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
  for(; i<=status.grievous + status.scratch + status.full + status.empty; i++){
    $20(`.${name}[value="${i}"]`).addClass("empty")
  }
}

function restoreHitpointStyles(){
  getAttrs(HITPOINT_ATTRS, vals=>{
    HITPOINT_ATTRS.forEach((attr,i)=>{
      styleHitpointBoxes(HITPOINT_TYPES[i], vals[attr])
    })
  })
}

function nextHitpointState(curState){
  const currentIndex = HITPOINT_ORDER.indexOf(curState);
  const nextIndex = (currentIndex + 1) % HITPOINT_ORDER.length;
  return HITPOINT_ORDER[nextIndex];
}

function setUpHealthWillButton() {
  $20(".health-will-button").on("click", e => {
    let name = e.htmlAttributes["data-name"];
    let curHitpointState = e.htmlAttributes.class.split(" ").pop() // last class should be injury type, very brittle
    let attrStr = `${name}_status`
    let clickVal = parseInt(e.htmlAttributes.value);

    getAttrs([attrStr], vals => {
      let status = vals[attrStr]

      if (clickVal === 1 && status.full > 1) {
        status.full -= 1
        status.empty += 1
      } else {
        status[curHitpointState] -= 1
        status[nextHitpointState(curHitpointState)] += 1
      }

      styleHitpointBoxes(name, status);
      setAttrs({
        [attrStr] : status
      })
    })
  })
}

function initHealthWillCrinos(reset=false) {
  let hitpointContainers = ["health_status", "willpower_status", "crinos_status"];
  let containersToInit = {}

  getAttrs(hitpointContainers, vals=>{
    hitpointContainers.forEach(name=>{
      if (vals[name] === "empty" || reset) {
        containersToInit[name] = HITPOINT_TEMPLATE;
      }
    })
    if (Object.keys(containersToInit).length !== 0) {
      setAttrs(containersToInit)
    }
  })
}

function undamaged(health){
  return health.scratch === 0 && health.grievous === 0
}

function bonusHitpoints(health){
  let bonus = (health.full + health.scratch + health.grievous) - health.max
  if (bonus < 0) { return 0 };
  return bonus;
}

function setUpTabButtons(){
  $20(".tab-button").on("click", e=>{
    let tabName = e.htmlAttributes.value

    $20(".tab").removeClass("active")
    $20(`.${tabName}`).addClass("active")
  })
}

on("sheet:opened", () => {
  initHealthWillCrinos();
  setUpDotValueButton();
  setUpHealthWillButton();
  restoreDotAttributeClasses()
  restoreHitpointStyles();
  setUpTabButtons();
});

on("change:stamina", ()=>{
  getAttrs(["health_status", "stamina"], vals=>{
    let health = vals.health_status
    let stamina = vals.stamina

    health.max = stamina + 3

    if (undamaged(health)) {
      health.full = health.max
      health.empty = 10 - health.max
    }

    styleHitpointBoxes("health", health)
    setAttrs({health_status: health});
  })
})

on("change:resolve change:composure", ()=>{
  getAttrs(["willpower_status", "resolve", "composure"], vals=>{
    let composure = vals.composure
    let resolve = vals.resolve
    let willpower = vals.willpower_status

    willpower.max = composure + resolve

    if (undamaged(willpower)) {
      willpower.full = willpower.max
      willpower.empty = 10 - willpower.max
    }

    styleHitpointBoxes("willpower", willpower)
    setAttrs({willpower_status: willpower});
  })
})
