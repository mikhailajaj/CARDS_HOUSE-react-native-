// AiLogic.js

/**
 * AI logic for card game decision-making.
 * Includes strategies for playing cards based on the game state.
 */

// Function to choose a card to play based on the AI's position in turn order and game state
function chooseCardToPlay(player, playedNumber, playedSuitNumber) {
    console.log("AI deciding card to play");
    if (playedNumber === 0) {
        return playHighestCard(player);
    } else if (playedNumber === 1) {
        return playCardAiSecond(player, playedSuitNumber);
    } else if (playedNumber === 2) {
        return playCardAiThird(player, playedSuitNumber);
    } else if (playedNumber === 3) {
        return playCardAiFourth(player, playedSuitNumber);
    }
}

function playHighestCard(player) {
    console.log("from playHighestCard");
    var temp = player.cardList;
    temp.sort(function (a, b) {
        console.log(b);
        return b.value - a.value;
    });
    return temp[0]; // Assuming temp[0] is the sorted highest card
}

function playCardAiSecond(player, playedSuitNumber) {
    console.log("from playCardAiSecond");
    var card = playLowestCardSuit(player, playedSuitNumber);
    if (card) {
        return card;
    } else {
        card = playLowestCardSuit(player, player.tarneeb);
        if (card) {
            return card;
        } else {
            return playLowestCard(player);
        }
    }
}

function playCardAiThird(player, playedSuitNumber) {
    console.log("from playCardAiThird");
    var card = playHighestCardSuit(player, playedSuitNumber);
    if (card) {
        return card;
    } else {
        card = playLowestCardSuit(player, player.tarneeb);
        if (card) {
            return card;
        }
        return playLowestCard(player);
    }
}

function playCardAiFourth(player, playedSuitNumber) {
    console.log("from playCardAiFourth");
    var card = playHighestCardSuit(player, playedSuitNumber);
    if (card) {
        return card;
    } else {
        card = playLowestCardSuit(player, player.tarneeb);
        if (card) {
            return card;
        }
        return playLowestCard(player);
    }
}

function playHighestCardSuit(player, cardSuit) {
    console.log("playHighestCardSuit");
    // Sort the player's cards in descending order by value
    var temp = [...player.cardList]; // Create a shallow copy to avoid mutating the original array
    temp.sort((a, b) => b.value - a.value);
    
    // Find the highest card in the specified suit
    var card = temp.find(card => card.suit === cardSuit);
    
    // If such a card exists, remove it from the player's hand and return it
    if (card) {
        let index = player.cardList.findIndex(c => c === card);
        return player.cardList.splice(index, 1)[0];
    }
    
    // If no card in the specified suit is found, return null or an appropriate value
    return null;
}
function playLowestCardSuit(player, cardSuit) {
    console.log("playLowestCardSuit");
    var temp = [...player.cardList];
    temp.sort((a, b) => a.value - b.value); // Sort in ascending order for lowest card
    
    var card = temp.find(card => card.suit === cardSuit);
    
    if (card) {
        let index = player.cardList.findIndex(c => c === card);
        return player.cardList.splice(index, 1)[0]; // Remove and return the lowest card of the suit
    }
    
    return null; // Return null if no card of the suit is found
}

function playLowestCard(player) {
    console.log("playLowestCard");
    var temp = [...player.cardList];
    temp.sort((a, b) => a.value - b.value); // Sort in ascending order for the lowest card
    
    return temp.length > 0 ? temp.splice(0, 1)[0] : null; // Remove and return the lowest card
}

// Export the AI logic functions to be used by the game engine
export { chooseCardToPlay, playHighestCard, playCardAiSecond, playCardAiThird, playCardAiFourth };
