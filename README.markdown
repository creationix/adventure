# Adventure!

Adventure is a proof of concept of making a massive real-time game in node.js.  The backend database is custom coded for this specific use case and is available at <http://github.com/creationix/world-db>

The communication is using websockets with fallbacks (powered by socket.io).  I have tested the game on Firefox 3.6, 4.0, Chrome 6, 7, Safari 5, Mobile Safari and Android browser.

## How to Play

Simply go to http://creationix.no.de/ and scroll around the massive world. You can either drag the screen or use the keyboard arrows. There are no limits other than the ram of my box at Joyent.  Since each tile takes only one byte (yes 8-bits) of ram to store, it's pretty efficient.

Once you've chosen a place as home start drawing away.  There are four layers in the map.

  - Top - Shift + Click
  - Mid - Shift + Alt + Click
  - Base - Click
  - Ground - Alt + Click

You simple click on a tile on the left (including the empty tile at top) and then click on the map to place it.  When you see it appear that means it's round-tripped to the server and everyone who is watching that viewport just saw your change.

## The Challenge

The game has no physics or moving characters, but it's still a game.  To play, you need to stake out a place on the map, build you kingdom, and share the url (with the hash-tag) on twitter. Try to make the best landscape and even join up with neighbors.  But beware.  This is real-time and the moment you publish the url, people may try to deface it.  It's your job to keep it tidy.

Have Fun!