import {OTHER_ATTRS, HITPOINT_ATTRS, HITPOINT_TYPES, HITPOINT_ORDER, SKILLS, ATTRS, ADVANTAGES_FLAWS, MAX_ATTR_VALUE} from './attribute_constants'
import {MAX_HITPOINTS, HITPOINT_TEMPLATE} from './hitpoint_constants'
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
    dotOne.removeClass("clear-me selected");
    return;
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
  const prevName = hist.click_history.name;
  const prevVal = hist.click_history.val;
  const isReset =
    prevName === clickedAttrName && prevVal === 1 && clickedAttrVal === 1;

  return isReset;
}

/**
 * @returns {Array} names of all the dot attributes such as resolve, driving, hauglosk etc*/
function dotAttributes() {
  return SKILLS.concat(ATTRS).concat(OTHER_ATTRS).concat(ADVANTAGES_FLAWS);
}

/**
 * Restores class attributes for dot sets in the sheet.
 * This function retrieves data for dot attributes and applies them to corresponding dot sets.*/
function restoreDotAttributeClasses() {
  getAttrs(dotAttributes(), (names_values) => {
    let keys = Object.keys(names_values);
    keys.forEach((key) => {
      applyClassToDotButtonSet(key, names_values[key]);
    });
  });
}

/**
 * Sets up event handling for dot-value buttons.
 *
 * This function adds a click event handler to elements with the 'dot-value-button' class.
 * When clicked, it updates the value of a dot button and tracks the click history.
 */
function setUpDotValueButton() {
  $20(".dot-value-button").on("click", (e) => {
    let clickedDotValue = parseInt(e.htmlAttributes.value);
    let name = e.htmlAttributes["data-name"];

    getAttrs(["click_history"], (hist) => {
      if (resetClick(hist, name, clickedDotValue)) {
        clickedDotValue = 0;
      }

      applyClassToDotButtonSet(name, clickedDotValue);

      setAttrs({
        [name]: clickedDotValue,
        click_history: { name: name, val: clickedDotValue },
      });
    });
  });
}

/**
 * Clears hitpoint boxes by removing specified classes.
 *
 * @param {string} name - The name of the element group to clear hitpoint boxes.
 */
function clearHitpointBoxes(name) {
  let classesToRemoveStr = HITPOINT_ORDER.join(" ");

  for (let i = 1; i <= MAX_HITPOINTS; i++) {
    $20(`.${name}`).removeClass(classesToRemoveStr);
  }
}
/**
 * Styles hitpoint boxes based on the provided status. Classes are applied specific order.
 *
 * @param {string} name - The name of the hitpoint boxes.
 * @param {object} status - The status object containing full, scratch, grievous, and empty values.
 */
function styleHitpointBoxes(name, status) {
  clearHitpointBoxes(name);

  let i = 1;
  for (; i <= status.full; i++) {
    $20(`.${name}[value="${i}"]`).addClass("full");
  }

  for (; i <= status.scratch + status.full; i++) {
    $20(`.${name}[value="${i}"]`).addClass("scratch");
  }

  for (; i <= status.grievous + status.scratch + status.full; i++) {
    $20(`.${name}[value="${i}"]`).addClass("grievous");
  }
  for (
    ;
    i <= status.grievous + status.scratch + status.full + status.empty;
    i++
  ) {
    $20(`.${name}[value="${i}"]`).addClass("empty");
  }
}

/** Restores styles for health and willpower */
function restoreHitpointStyles() {
  getAttrs(HITPOINT_ATTRS, (vals) => {
    HITPOINT_ATTRS.forEach((attr, i) => {
      styleHitpointBoxes(HITPOINT_TYPES[i], vals[attr]);
    });
  });
}
/** Hitpoint box value on a click should rotate from empty>full>scratch>grievous>empty
 * @param {string} curState
 * @return {string} next rotation value based on curState
 * */
function nextHitpointState(curState) {
  const currentIndex = HITPOINT_ORDER.indexOf(curState);
  const nextIndex = (currentIndex + 1) % HITPOINT_ORDER.length;
  return HITPOINT_ORDER[nextIndex];
}

/**
 * Set up click event handling for health and willpower buttons.
 */
function setUpHealthWillButton() {
  $20(".health-will-button").on("click", (e) => {
    // Extract data from the clicked element
    let name = e.htmlAttributes["data-name"];
    let curHitpointState = e.htmlAttributes.class.split(" ").pop(); // last class is assumed be injury type, very brittle
    let attrStr = `${name}_status`;
    let clickVal = parseInt(e.htmlAttributes.value);

    getAttrs([attrStr], (vals) => {
      let status = vals[attrStr];

      // Allow hitbox count to be reduced if clicked on one
      if (clickVal === 1 && status.full > 1) {
        status.full -= 1;
        status.empty += 1;
      } else {
        // if you click on a hitpoint box, its value disappears and gets replaced by the value in the next rotation
        status[curHitpointState] -= 1;
        status[nextHitpointState(curHitpointState)] += 1;
      }

      styleHitpointBoxes(name, status);
      setAttrs({
        [attrStr]: status,
        [`${attrStr}_num`]: status.full
      });
    });
  });
}

/**
 * Initializes health, willpower, and crinos data for Roll20.
 * This ensures that Roll20 saves a proper and empty JSON object to their Firebase.
 * @param {boolean} [reset=false] - Whether to reset the data.
 * */
function initHealthWillCrinos(reset = false) {
  let hitpointContainers = [
    "health_status",
    "willpower_status",
    "crinos_status",
  ];
  let containersToInit = {};

  getAttrs(hitpointContainers, (vals) => {
    hitpointContainers.forEach((name) => {
      if (vals[name] === "empty" || reset) {
        containersToInit[name] = HITPOINT_TEMPLATE;
      }
    });
    if (Object.keys(containersToInit).length !== 0) {
      setAttrs(containersToInit);
    }
  });
}

function damaged(health) {
  return health.scratch > 0 || health.grievous > 0;
}

function setUpTabButtons() {
  $20(".tab-button").on("click", (e) => {
    let tabName = e.htmlAttributes.value;
    //All tabs get removed .active class
    $20(".tab").removeClass("active");
    //The clicked tab gets assigned .active class, thus becomes visible
    $20(`.${tabName}`).addClass("active");
  });
}
/**
 * Initializes various UI elements for onclick events.
 * Makes sure the UI elements are styled according to the saved data*/
on("sheet:opened", () => {
  initHealthWillCrinos();
  setUpDotValueButton();
  setUpHealthWillButton();
  restoreDotAttributeClasses();
  restoreHitpointStyles();
  setUpTabButtons();
});

on("change:stamina", () => {
  getAttrs(["health_status", "stamina"], (vals) => {
    if (damaged(vals.health_status)) {
      return;
    } // Only changes health hitpoint on full hitpoints

    let health = vals.health_status;
    health.max = vals.stamina + 3;
    health.full = health.max;
    health.empty = 10 - health.max;

    styleHitpointBoxes("health", health);
    setAttrs({ health_status: health, health_status_num: health.full });
  });
});

on("change:resolve change:composure", () => {
  getAttrs(["willpower_status", "resolve", "composure"], (vals) => {
    if (damaged(vals.willpower_status)) {
      return;
    } //Only change willpower on full hitpoints

    let composure = vals.composure;
    let resolve = vals.resolve;
    let willpower = vals.willpower_status;

    willpower.max = composure + resolve;

    willpower.full = willpower.max;
    willpower.empty = 10 - willpower.max;

    styleHitpointBoxes("willpower", willpower);
    setAttrs({ willpower_status: willpower, willpower_status_num: willpower.full});
  });
});
