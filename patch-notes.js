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
  "v0.1": {
    title: "Update V0.1",
    subtitle: "New content and fixes",
    sections: [
      { heading: "New Features", items: [
        "Enemy drops now favor weapons for your chosen class. Mage mana costs and drop rates were adjusted, and successful Archer hits restore a small amount of mana.",
        "Elite enemies now appear in ordinary rooms from floor 5, gaining a random Fire, Water, Earth, or Wind affinity. Their landed damaging attacks can inflict Burn, Freeze, Cripple, or Blind.",
        "Four-enemy fights with an elite may lose one normal enemy on floors 5–14; the chance tapers from 50% to 5%. Bosses are unchanged."
      ] },
      { heading: "Bugs", items: [
        "Armor and item inventory lists now stay selected and preserve their position after equipment, use, and sell actions.",
        "Floor generation now preserves the boss path, preventing the boss room from being replaced by a fountain or another room.",
        "Combat now consistently removes defeated enemies, including kills from Sundering Strike and chained damage.",
        "Mages can make a reduced-damage, mana-free Staff strike while shielded; shields still prevent spellcasting."
      ] }
    ]
  }
};
