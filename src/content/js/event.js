define('event', ['jquery', 'parser', 'tooltipView', 'searchView', 'model', 'config'], function ($, parser, tooltipView, searchView, model, CONFIG){
    
    var elDoc = null;
    var delayTimer = null;
    var delayTime = 200;
    var cursorX = 0;
    var cursorY = 0;
    
    function getSelectionText(){
        var text = null;
        if(window.getSelection){
            text = window.getSelection().toString();
        }else if(elDoc && elDoc.selection && elDoc.selection.type != "Control"){
            text = elDoc.selection.createRange().text;
        }
        return text;
    }

    function setCursor(){
        cursorX = (window.Event) ? event.pageX : event.clientX + (elDoc.documentElement.scrollLeft ? elDoc.documentElement.scrollLeft : elDoc.body.scrollLeft);
        cursorY = (window.Event) ? event.pageY : event.clientY + (elDoc.documentElement.scrollTop ? elDoc.documentElement.scrollTop : elDoc.body.scrollTop);
    }
    
    var searchWord = function (query){
        var result = model.getResult(query);

        if(result){
            tooltipView.renderTooltip(CONFIG.SEARCH_TYPE.WORD, {query: query, result: result, cursorX: cursorX, cursorY: cursorY});
            model.increaseSearchCount(query);
        }else{
            chrome.runtime.sendMessage({type: 'word', query: query, cursorX: cursorX, cursorY: cursorY}, function (data){
                model.setResult(data.query, data.result);
                model.increaseSearchCount(query);
                tooltipView.renderTooltip(CONFIG.SEARCH_TYPE.WORD, data);
            });
        }
    };

    var searchSentence = function (query){
        chrome.runtime.sendMessage({type: 'sentence', query: query, cursorX: cursorX, cursorY: cursorY}, function (data){
            tooltipView.renderTooltip(CONFIG.SEARCH_TYPE.SENTENCE, data);
        });
    };
    
    var delaySearchWord = function (query){
        if(model.getResult(query) && tooltipView.isShowTooltip()){
            return;
        }
        clearTimeout(delayTimer);
        if(!query){
            tooltipView.hideTooltip();
            return;
        }
        
        delayTimer = setTimeout(function (){
            delayTimer = undefined;
            searchWord(query);
        }, parseInt(delayTime));
    };

    var delaySearchSentence = function (query){
        if(model.getResult(query) && tooltipView.isShowTooltip()){
            return;
        }
        clearTimeout(delayTimer);
        if(!query){
            tooltipView.hideTooltip();
            return;
        }

        delayTimer = setTimeout(function (){
            delayTimer = undefined;
            searchSentence(query);
        }, parseInt(delayTime));
    };
    
    var onLeave = function (e){
        delaySearchWord(null);
        $(elDoc).off('mouseleave', onLeave);
    };
    
    var onMove = function (e){
        elDoc = e.target.ownerDocument;
        tooltipView.setDocument(elDoc);
        searchView.setDocument(elDoc);
        setCursor();
        if(!tooltipView.isOccuredInTooltip(e) || !searchView.isOccuredInLayer(e)){
            delaySearchWord(parser.getText(elDoc, e));
        }

        $(elDoc).on('mouseleave', onLeave);
    };
    
    var onUp = function (e){
        elDoc = e.target.ownerDocument;
        tooltipView.setDocument(elDoc);
        searchView.setDocument(elDoc);
        setCursor();
        if(!tooltipView.isOccuredInTooltip(e) || !searchView.isOccuredInLayer(e)){
            delaySearchSentence(getSelectionText());
        }
        $(window).on('mousemove', onMove);
    };

    var onDown = function (e){
        delaySearchWord(null);
        elDoc = e.target.ownerDocument;
        $(elDoc).off('mouseleave', onLeave);
        $(window).off('mousemove', onMove);
    };
    
    var Event = {
        initialize: function (){
            this.setEventListener();
        },
        
        setEventListener: function (){
            $(window).on('mousemove', onMove);
            $(window).on('mousedown', onDown);
            $(window).on('mouseup', onUp);
        }
    };
    
    return Event;
    
});