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

on("sheet:opened", () => {
  setUpDotValueButton();
  restoreDotStyling();
});
