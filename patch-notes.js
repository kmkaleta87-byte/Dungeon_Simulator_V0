window.GAME_PATCH_NOTES = {
  v1: {
    title: "V1",
    subtitle: "Initial release",
    sections: [
      { heading: "Release", items: [
        "The first browser release of Dungeon Simulation.",
        "Turn-based dungeon exploration, combat, inventory, equipment, shops, saves, and leaderboards."
      ] }
    ]
  },
  "v1.1": {
    title: "Update V1.1",
    subtitle: "New content and fixes",
    sections: [
      { heading: "New Features", items: [
        "Enemy drops now favor weapons for your chosen class. Mage mana costs and drop rates were adjusted, and successful Archer hits restore a small amount of mana.",
        "Elite enemies now appear in ordinary rooms from floor 5, gaining a random Fire, Water, Earth, or Wind affinity. Their landed damaging attacks can inflict Burn, Freeze, Cripple, or Blind.",
        "Four-enemy fights with an elite may lose one normal enemy on floors 5–14; the chance tapers from 50% to 5%. Bosses are unchanged.",
        "Matching potions stack in the inventory. The Armor tab now has Equip Best to select the highest-defense piece in each slot.",
        "Stats now keep their full effectiveness above 20. Upgrades cost more skill points after 20, with the cost increasing by one every five stat levels."
      ] },
      { heading: "Bugs", items: [
        "Armor and item inventory lists now stay selected and preserve their position after equipment, use, and sell actions.",
        "Floor generation now preserves the boss path, preventing the boss room from being replaced by a fountain or another room.",
        "Combat now consistently removes defeated enemies, including kills from Sundering Strike and chained damage.",
        "Mages can make a reduced-damage, mana-free Staff strike while shielded; shields still prevent spellcasting."
      ] }
    ]
  },
  "v1.2": {
    title: "Update V1.2",
    subtitle: "Regions, tactical combat, meaningful choices, and bug fixes",
    sections: [
      { heading: "New Features", items: [
        "Weapons from any class can be equipped without changing your chosen class; off-class weapon attacks deal 25% less damage, retain their effects, and use their normal mana or shared-arrow costs. The shop forge accepts any owned weapon.",
        "A shield Block that fully absorbs a hit automatically counters its attacker once per Block, dealing half a basic attack without crits, effects, or resource costs.",
        "Combat attack previews and hit messages clarify elemental matchups and damage reductions from enemy defense, Guard, and Wards.",
        "Shop gear offers compare weapon type, damage, critical chance, element, attacks, and off-class penalty, or armor defense, reduction, health, and slot against equipped gear.",
        "The Index includes a Quick Guide for class roles, resources, elemental matchups, fountains, and off-class weapons.",
        "Some enemy encounters form a guarded line: a Warrior vanguard intercepts single-target attacks aimed at an Archer or Mage until the vanguard falls. Area attacks bypass the formation.",
        "Enemy races now have readable, consistent traits, including Skeleton ranged damage, Specter evasion, Vampire life steal, Werewolf critical hits, and Golem defense.",
        "Some floors offer a forked enemy encounter: take a small guaranteed gold reward and skip the fight, or face an extra, tougher enemy for 50% more gold and XP plus guaranteed loot.",
        "Bosses follow recognizable, repeating combat patterns with their next intent telegraphed; the pattern stays visible during the fight.",
        "The dungeon cycles through four five-floor regions: Undead Catacombs, Goblin Warrens, Haunted Hollows, and Feral Stone Depths. The cycle repeats every 20 floors with deeper enemy scaling.",
        "Each region uses its own regular-enemy and boss pool, with a short in-game briefing, regional rule, and an Index page describing its roster.",
        "Skeletons, Goblins, Specters, Golems, and other themed enemies keep their readable race traits; Zombie Warriors, Archers, and Mages join the Undead Catacombs roster.",
        "Every 20th floor features the tougher Threshold Warden milestone boss. After victory, choose to end the run and submit its score, or continue into the next regional cycle.",
        "The milestone choice survives a saved run and reload. Ending the run records the local personal best and submits to the global leaderboard when configured."
      ] },
      { heading: "Bugs", items: [
        "Boss rooms remain on the main route and can be reached on every generated floor.",
        "Boss combat keeps its attack, inventory, and potion choices available; fleeing is clearly unavailable.",
        "Mages retain a usable reduced-damage Staff strike after Aegis, at zero mana, and while a shield blocks spells.",
        "Armor equipment keeps the Armor list selected and preserves its scroll position while equipping multiple pieces.",
        "Leveling continues to award skill points for every level gained, including when one reward crosses multiple XP thresholds.",
        "Bow and crossbow ammunition uses one shared count, stays visible at zero, and reports arrow costs and gains in combat.",
        "Leaderboard connection failures show an unavailable state with Retry instead of appearing as an empty board.",
        "Maximum health gained when descending to a new floor now persists after the game refreshes and saves the run.",
        "Reopening a shop no longer restores potion offers that were already purchased; remaining stock lasts until a paid reroll or the next floor.",
        "Local leaderboard records are now saved when a run ends without a configured global board, and each difficulty keeps its own top 100.",
        "Failed global score submissions can be retried from the run-end screen.",
        "Character and saved log text is escaped before display, preventing markup in the event log from being interpreted as HTML."
      ] },
      { heading: "Second-pass Audit", items: [
        "A fresh adversarial review found that combat health and mana potions can reappear after use when the last item in a stack is consumed. This issue is documented in AUDIT_SUPPLEMENT_V1.2.md and is not fixed in this update.",
        "The global score retry is available while the run-end screen remains active, but a pending request that fails after leaving or reloading that screen may remain marked as submitted in the saved run. See the audit supplement for reproduction details and coverage limits."
      ] }
    ]
  }
};
