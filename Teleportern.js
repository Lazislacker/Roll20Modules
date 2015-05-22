/*
    |-------------------------------------------------------------------------------------------------------|
    |Name: Teleporter Plugin                    															|
	|-------------------------------------------------------------------------------------------------------|
	|Setup Requirements:																					|
	|	A token should be placed at each location a teleporter can be. The token should be labelled as:		|
	|		<TeleporterName><A/B>[TP]																		|
	|			TeleporterName	: Any name you wish to give the teleporter pair.							|
	|			A/B				: One side of the teleporter should be labelled each.						|
	|			[TP]			: Tag used by the script to tell which tokens are teleporters.				|
	|-------------------------------------------------------------------------------------------------------|
	|Usage Info:																							|
	|	!teleporter-reset 	: This function is used to reinitialize the teleporters for the current page.	|
	|		Use this when a teleporter is added to the current page.										|
	|	!teleporter-toggle 	: This function toggles the script on and off.									|
	|	!teleporter-list 	: This function provides a list of all currently active teleporters.			|
	|-------------------------------------------------------------------------------------------------------|
*/
teleporterPlugin = function(){
	//Versioning Info//
	this.name 		= "teleporterPlugin";
	this.version 	= "0.1";
	
	//Globals//
	this.DMName 	= "DM";
    this.Enabled    = "True";
	state.teleporterPlugin = {
    teleporterTokens: undefined,
    teleporterNames: undefined
	};	
};

//Fetches all tokens with the "[tp]" tag on the active page
teleporterPlugin.prototype.getTokens = function(){
     log("getTokens running...");
	var allTokens = findObjs({
		_subtype: "token",
		_pageid: Campaign().get("playerpageid")
	});
	if (allTokens == undefined){
		sendChat(this.name, "/w "+this.DMName+" Error: No tokens were found for this page!");
		return;
	}
	var teleporterTokens = {};
    var tokenNames = [];
	for (var i = 0; i < allTokens.length; ++i){
        var Token = allTokens[i];
		if (Token.get("name").toLowerCase().indexOf("[tp]") != -1){
			teleporterTokens[Token.get("name")] = Token;
            tokenNames.push(Token.get("name"));
		}
			//teleporterTokens.push({Token.get("name"):Token});
	}
	if (teleporterTokens.length == 0){
		sendChat(this.name, "/w "+this.DMName+" Error: No teleporter tokens were found for this page!");
		return;
	}
	return [teleporterTokens, tokenNames];
};

//Cleans out our state variables
teleporterPlugin.prototype.cleanGlobals = function(){
     log("cleanGlobals running...");
	state.teleporterPlugin = {
    teleporterTokens: undefined,
    teleporterNames: undefined
	};
};

//Checks a move to see if we should shift the token
teleporterPlugin.prototype.checkMove = function(movingToken){
	//Do we already have our teleporter tokens stored in state?
	if (state.teleporterPlugin.teleporterTokens == undefined){
		var tokens = this.getTokens();
		state.teleporterPlugin.teleporterTokens = tokens[0];
        state.teleporterPlugin.teleporterNames = tokens[1];
	}
	//log("Check Move Running...");
	var tokenList = state.teleporterPlugin.teleporterTokens;
    var nameList =  state.teleporterPlugin.teleporterNames;
	for (var i in nameList){
		var token = tokenList[nameList[i]];
		if (token.get("left") == movingToken.get("left") && token.get("top") == movingToken.get("top")){
			//Shift moving token to the other end of the teleporter
			var target = nameList[i];
            target = target.split("[")[0];
            var letter = target.slice(-1);
            letter = (letter == "A")?"B":"A";
            target = target.slice(0,-1)+letter+"[tp]";
            var targetToken = tokenList[target];
            var xloc = targetToken.get("left");
            var yloc = targetToken.get("top");
            movingToken.set("left",xloc);
            movingToken.set("top",yloc);
            sendChat(this.name, "/w "+this.DMName+" Successfully moved token: "+movingToken.get("name"));
            return;
		}
    }
};

//Toggle plugin on and off
teleporterPlugin.prototype.Toggle = function(){
    this.Enabled = (this.Enabled == "True")?"False":"True";
    var end = (this.Enabled == "True")?"enabled":"disabled";
    sendChat(this.name, "/w "+this.DMName+" "+this.name+" has been "+end);
};
//Initializes the plugin
Teleinit = function(Teleinstance){
	//Perform Initialization here//
	on("chat:message", function(msg){
		//Check our exit conditions
		if (msg.type != "api")
			return;
		if (msg.content.indexOf("!teleporter") == -1)
			return;
            
        if (msg.content.indexOf("!teleporter-toggle") != -1)
            Teleinstance.Toggle();
		if (Teleinstance.Enabled == "False")
            return;
		if (msg.content.indexOf("!teleporter-reset") != -1){
            log("Reset running...");
			Teleinstance.cleanGlobals();
			sendChat(Teleinstance.name, "/w "+Teleinstance.DMName+" Registered teleporters reset");
		}
		if (msg.content.indexOf("!teleporter-list") != -1){
             log("List running...");
			var list = Teleinstance.getTokens()[1];
			sendChat(Teleinstance.name, "/w "+Teleinstance.DMName+" Listing Teleporter Names:");
			_.each(list, function(Obj){
                sendChat(Teleinstance.name, "/w "+Teleinstance.DMName+" "+Obj);    		
			});
		}
		if (msg.content.indexOf("!teleporter-test") != -1){
            log("Test running...");
            //Teleinstance.checkMove(undefined)
        }
	});
    on("change:graphic:lastmove", function(Token){
        if (Teleinstance.Enabled == "False")
            return;
        Teleinstance.checkMove(Token);
    });
	on("change:campaign:playerpageid", function(){
        if (Teleinstance.Enabled == "False")
            return;
		//log("Page changed, clearing state variables...");
		Teleinstance.cleanGlobals();
	});
    log(Teleinstance.name+" "+Teleinstance.version+" loaded...");
};

on("ready", function(){
	teleporter = new teleporterPlugin();
	Teleinit(teleporter);
});