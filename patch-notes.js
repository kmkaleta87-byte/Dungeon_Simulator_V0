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
  }
};
