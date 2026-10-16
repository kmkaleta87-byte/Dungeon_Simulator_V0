window.GAME_PATCH_NOTES = {
  v0: {
    title: "V0",
    subtitle: "Initial release",
    sections: [
      { heading: "Release", items: [
        "The first browser release of Dungeon Simulation.",
        "Turn-based dungeon exploration, combat, inventory, equipment, shops, saves, and leaderboards."
      ] }
    ]
  },
  "v0-patch-1": {
    title: "V0 Patch 1",
    subtitle: "Bug fixes",
    sections: [
      { heading: "Fixed", items: [
        "Armor and item inventory views now remain selected after equipment, use, and sell actions.",
        "Floor generation reserves the boss path and cannot replace the boss room with a fountain or another room.",
        "Combat damage sources now consistently remove defeated enemies, including Sundering Strike effects and chained damage."
      ] }
    ]
  },
  "v0-patch-2": {
    title: "V0 Patch 2",
    subtitle: "Class balance and resource fixes",
    sections: [
      { heading: "Balance", items: [
        "Tweaked mana consumption and drop rates to prevent Mage soft locking.",
        "Weapon drops now favor your chosen class, while Warriors find mana potions less often.",
        "Archer attacks restore small amounts of mana on a successful hit."
      ] }
    ]
  },
  "v0-patch-3": {
    title: "V0 Patch 3",
    subtitle: "Elemental elite enemies",
    sections: [
      { heading: "Combat", items: [
        "Elite enemies can now appear within ordinary enemy rooms starting on floor 5. Each enemy rolls independently, with the chance rising by 3 percentage points per floor to a 30% cap on floor 14.",
        "Elites have a random Fire, Water, Earth, or Wind affinity. Their damaging attacks have a fixed 15% chance to inflict Burn, Freeze, Cripple, or Blind, respectively.",
        "Four-enemy encounters with an elite may be reduced by one normal enemy on floors 5–14; this chance tapers from 50% to 5%. Bosses are unchanged."
      ] }
    ]
  }
};
