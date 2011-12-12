// The result of the ajax request will json which is then passed to
// the given callback func.
function makeAjaxRequest(url, params, callbackFunc) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callbackFunc(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET", url + params, true);
    xmlhttp.send();
}


// currently a huge hack, just so we can get the starting board layout.
function startGameRequest() {


    var start_game_callback = function(json) {
        console.log(json);
        var myJson = JSON.parse(json);
        console.log(myJson);

        if (myJson.log[0].action != "hexes_placed") {
            console.log("ERROR: data returned from /start_game is unexpected");
        }
        else {
            var hexes = myJson.log[0].args;

            initBoard(hexes);
        }

    }

    var create_game_callback = function(json) {
        gameID = parseInt(json);
        console.log("created new game with gameID: " + gameID);

        makeAjaxRequest(HOSTNAME + "/start_game",
                        "?user=" + userID
                        + "&game=" + gameID
                        + "&sequence=" + sequenceNum,
                        start_game_callback);
    }

    makeAjaxRequest(HOSTNAME + "/create_game", "?user=" + userID,
                   create_game_callback);
}

