/*
    |-------------------------------------------------------------------------------------------------------|
    |Name: Language Plugin                    																|
	|-------------------------------------------------------------------------------------------------------|
	|Setup Requirements:																					|
	|	DMNAME should be set to the name of the DM, !lang-activate should be called for each character		|
	|	that is going to use the plugin.																	|
	|-------------------------------------------------------------------------------------------------------|
	|Usage Info:																							|
	|	!lang <language> <message> : Sends out a message in the given language								|
	|	!lang-activate <characterName> : Activates the plugin for the given character						|
	|	!lang-deactivate <characterName> : Deactivates the plugin for the given character					|
	|-------------------------------------------------------------------------------------------------------|
*/

langPlugin = function(){
	//Versioning Information
	this.name 			= "languagePlugin";
	this.version 		= "0.1";
	
	//Globals//
	this.DMNAME 		= "DM";
	this.ATTRIBUTE 		= "_lang";
	this.DEBUG			= true;
};

//Returns the player from a given message
langPlugin.prototype.getPlayer = function(msg){
	   var playerName = msg.who;
    if (playerName.indexOf(" (GM)") != -1)
        playerName = playerName.slice(0,-5);
    var player = findObjs({
			_type:"player",
			_displayname:playerName
	});
    if (player == null)  //Maybe they typed as a character?
    {
        player = findObjs({
				_type:"character",
				_name:msg.who
		});
        if (player == null) //No idea who's talking...
            return;
        //Get the controller of that character
        player = findObjs({
				_type:"player",
				_displayname:player.controlledby
		});
    }
    return player[0];
};

//Deactivates the plugin
langPlugin.prototype.Deactivate = function(msg){
    var player = this.getPlayer(msg);
    
    //Check to see if they're GM...
   if (!playerIsGM(player.get("_id")))
        return;
        
    //Set _lang property attribute to 1
    var Charname = msg.content.split(" ");
    Charname.splice(0,1);
    Charname = Charname.join(" ");
    
    character = findObjs({
			_type:"character",
			_name:Charname},
	{caseInsensitive: true});
    character = character[0];
    var attr = findObjs({
			name:"_lang",
			_type:"attribute",
			_characterid: character.get("_id")
	})[0];
    if (attr == undefined)
        createObj("attribute",{
			name:"_lang",
			current: 0,
			characterid: character.id
	});
    else
        attr.set("current", 0);
    log("Deactivated "+this.name+" for "+character.get("_name"));
    sendChat(this.name, "/w "+player.get("_displayname")+" deactivated for "+character.get("name"));
    return;
};

langPlugin.prototype.Activate = function(msg){
	var player = this.getPlayer(msg);
    
    //Check to see if they're GM...
   if (!playerIsGM(player.get("_id")))
        return;
        
    //Set _lang property attribute to 1
    var Charname = msg.content.split(" ");
    Charname.splice(0,1);
    Charname = Charname.join(" ");
    
    character = findObjs({
			_type:"character",
			_name:Charname},
	{caseInsensitive: true});
    character = character[0];
    var attr = findObjs({
			name:"_lang",
			_type:"attribute",
			_characterid: character.get("_id")
	})[0];
    if (attr == undefined)
        createObj("attribute", {
				name:"_lang",
				current: 1,
				characterid: character.id
	});
    else
        attr.set("current", 1);
    log("Activated "+this.name+" for "+character.get("_name"));
    sendChat(this.name, "/w "+player.get("_displayname")+" activated for "+character.get("name"));
    return;
};

//Translates a given message
langPlugin.prototype.Translate = function(msg){
	log("Language Message from "+msg.who+" detected.");
    log("---------------------------------------------------");
    var all = msg.content.split(" ");
    var language = all[1];
    var message = all;
    message.splice(0,2);
    message = message.join(' ');
    var characters = findObjs({
        _type:"attribute",
        _name:"_lang",
        _current:1,
    },  {caseInsensitive: true});
    _.each(characters, function(Obj){
        var char = findObjs({
          //  _type:"character",
            _id:Obj.get("_characterid"),
        });
        char = char[0];
        var languagesSpoken = getAttrByName(char.get("_id"), "prolanguages");
        languagesSpoken = languagesSpoken.split(", ");
        var found = false;
        _.each(languagesSpoken,function(lang){
            if (lang.toLowerCase() == language.toLowerCase())
                found = true;
        })
        var player = findObjs({
				_type:"player",
				_id:char.get("controlledby")
		});
        if (found)
        {
            //Write message prefixed with (In <language>)
            log ("/w "+player[0].get("_displayname")+" (In "+language+") "+message);
            sendChat(msg.who, "/w "+player[0].get("_displayname")+" (In "+language+") "+message);
        }
        else
        {
            //Write gibberish
            log( "/w "+player[0].get("_displayname")+" (Gibberish)");
            sendChat(msg.who, "/w "+player[0].get("_displayname")+" (Gibberish)");
        }
    }); 
    log("--------------------------------------------------------");
};

Langinit =  function(langInstance){
	on ('chat:message', function(msg){
        //log(langInstance)
        if (msg.type != "api")
            return;
        if (msg.content.indexOf("!lang-activate") != -1)
            langInstance.Activate(msg);
        else if (msg.content.indexOf("!lang-deactivate") != -1)
            langInstance.Deactivate(msg);
        else if (msg.content.indexOf("!lang") != -1)
            langInstance.Translate(msg);
    });
    log("Loading "+langInstance.name+" v"+langInstance.version+" ...");
};

on("ready", function(){
    var lang = new langPlugin();
    Langinit(lang);
});