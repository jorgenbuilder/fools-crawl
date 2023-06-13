- Tutorial is displayed based on localStorage boolean flag.
- First room contains one of each suit
- Dialogue "COINS provide a shield to block incoming attacks."
- Hint "Choose the X of Coins to take the shield."
- User must select the COINS card. Show an indicator of some kind on this card.
- Dialogue "SWORDS and WANDS attack and damage you."
- Dialogue "Your shield will block monsters of decreasing power."
- Hint "Choose the X of X to fight."
- User must select the higher of the monster cards. Show indicator.
- Dialogue "The last blocked monster's power is displayed here."
- Show indicator over the shield parenthesis number.
- Dialogue "A monster that matches or exceeds this number will break your shield."
- Hint "Choose the X of X to fight."
- User must select the next monster card. Show indicator
- Dialogue "CUPS are healing potions. Drinking more than one in a row has no effect."
- Hint "Choose X of CUPS to heal."
- User must select the potion card. Show indicator.
- Dialogue "A dangerous can be escaped, if you didn't run from the last room."
- Dialogue "A room with no monster can also be escaped, saving valuable cards for the end of the dungeon."
- Dialogue "Good luck!"

----

Not sure best way to build this.
Don't want to have to mutate existing code.

Rule Engine?
    - Remove all escape rules so that player can't escape first room
    - Remove all folding rules so player can't fold during dialogues
    - Apply new rule so player can only fold specific card, then remove it

UI and triggers?
    - Tutorial machine
        - Observes dungeon machine to trigger transitions
        - Alters rules (can't fold cards until after reading dialogues?)

Initialization?
    - On new game, if player hasn't done tutorial, init tutorial and create tutorial deck. Pass tutorial deck to dungeon.
        - This gets quirky with the deck based preloader. Feels like that needs to be tidied up a bit.