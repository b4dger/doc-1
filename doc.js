(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.doc = factory();
    }
}(this, function () {
    var arrayProto = [],
        window = this.window,
        // Allows instantiation in node for libs that require() it.
        document = window && window.document;

    function getTarget(target){
        if(isString(target)){
            return document.querySelector(target);
        }

        return target;
    }

    function getTargets(target){
        if(isString(target)){
            return document.querySelectorAll(target);
        }

        return target;
    }

///[README.md]

    function doc(target){
        if(!(this instanceof doc)){
            return new doc(target);
        }

        var instance = function(){
                var target = isString(instance._target) ? doc.find(instance._target) : instance._target || document,
                    result = target;

                while (instance._query.length) {
                    var step = instance._query.shift();

                    result = step.fn.apply(instance, [target].concat(arrayProto.slice.call(step.args)));
                    if(result !== instance){
                        instance._target = result;
                    }
                }

                return result;
            };

        instance.__proto__ = doc.prototype;

        instance.items = function(){
            return doc(instance._target)();
        };

        instance._target = target;
        instance._query = [];

        return instance;
    }

    function isString(thing){
        return typeof thing === 'string';
    }

    /**

        ## .find

        finds elements that match the query within the scope of target

            //fluent
            doc(target).find(query)();

            //legacy
            doc.find(target, query);
    */

    function find(target, query){
        if(query == null){
            query = target;
            target = document;
        }
        target = getTarget(target);

        if(target && target.length){
            var results = [];
            for (var i = 0; i < target.length; i++) {
                results = results.concat(arrayProto.slice.call(doc.find(target[i], query)));
            }
            for (var i = 0; i < results.length; i++) {
                if(results.lastIndexOf(results[i]) !== i){
                    results.splice(i--,1);
                }
            }
            return results;
        }

        return target ? target.querySelectorAll(query) : [];
    };

    /**

        ## .findOne

        finds the first element that matches the query within the scope of target

            //fluent
            doc(target).findOne(query)();

            //legacy
            doc.findOne(target, query);
    */

    function findOne(target, query){
        if(query == null){
            query = target;
            target = document;
        }
        target = getTarget(target);

        if(target && target.length){
            var result;
            for (var i = 0; i < target.length; i++) {
                result = doc.findOne(target[i], query);
                if(result){
                    break;
                }
            }
            return result;
        }

        return target ? target.querySelector(query) : null;
    };

    /**

        ## .closest

        recurses up the DOM from the target node, checking if the current element matches the query

            //fluent
            doc(target).closest(query)();

            //legacy
            doc.closest(target, query);
    */

    function closest(target, query){
        target = getTarget(target);

        if(target && target.length){
            target = target[0];
        }

        while(
            target &&
            target.ownerDocument &&
            !doc.is(target, query)
        ){
            target = target.parentNode;
        }

        return target === document && target !== query ? null : target;
    };

    /**

        ## .is

        returns true if the target element matches the query

            //fluent
            doc(target).is(query)();

            //legacy
            doc.is(target, query);
    */

    function is(target, query){
        target = getTarget(target);

        if(target && target.length){
            target = target[0];
        }

        if(!target.ownerDocument || typeof query !== 'string'){
            return target === query;
        }
        return target === query || Array.prototype.slice.call(doc.find(target.parentNode, query)).indexOf(target) >= 0;
    };

    /**

        ## .addClass

        adds classes to the target

            //fluent
            doc(target).addClass(query)();

            //legacy
            doc.addClass(target, query);
    */

    function addClass(target, classes){
        target = getTarget(target);

        if(target && target.length){
            for (var i = 0; i < target.length; i++) {
                doc.addClass(target[i], classes);
            }
            return this;
        }
        if(!classes){
            return this;
        }

        var classes = classes.split(' '),
            currentClasses = target.className.split(' ');

        for(var i = 0; i < classes.length; i++){
            var classToAdd = classes[i];
            if(!classToAdd || classToAdd === ' '){
                continue;
            }
            if(target.classList){
                target.classList.add(classToAdd);
            } else if(!currentClasses.indexOf(classToAdd)>=0){
                currentClasses.push(classToAdd);
            }
        }
        if(!target.classList){
            target.className = currentClasses.join(' ');
        }
        return this;
    };

    /**

        ## .removeClass

        removes classes from the target

            //fluent
            doc(target).removeClass(query)();

            //legacy
            doc.removeClass(target, query);
    */

    function removeClass(target, classes){
        target = getTarget(target);

        if(target && target.length){
            for (var i = 0; i < target.length; i++) {
                doc.removeClass(target[i], classes);
            }
            return this;
        }

        if(!classes){
            return this;
        }

        var classes = classes.split(' '),
            currentClasses = target.className.split(' ');

        for(var i = 0; i < classes.length; i++){
            var classToRemove = classes[i];
            if(!classToRemove || classToRemove === ' '){
                continue;
            }
            if(target.classList){
                target.classList.remove(classToRemove);
                continue;
            }
            var removeIndex = currentClasses.indexOf(classToRemove);
            if(removeIndex >= 0){
                currentClasses.splice(removeIndex, 1);
            }
        }
        if(!target.classList){
            target.className = currentClasses.join(' ');
        }
        return this;
    };

    function addEvent(settings){
        var target = getTarget(settings.target);
        if(target){
            target.addEventListener(settings.event, settings.callback, false);
        }else{
            console.warn('No elements matched the selector, so no events were bound.');
        }
    }

    /**

        ## .on

        binds a callback to a target when a DOM event is raised.

            //fluent
            doc(target/proxy).on(events, target[optional], callback)();

        note: if a target is passed to the .on function, doc's target will be used as the proxy.

            //legacy
            doc.on(events, target, query, proxy[optional]);
    */

    function on(events, target, callback, proxy){

        if(typeof target === 'object' && target.length){
            var multiRemoveCallbacks = [];
            for (var i = 0; i < target.length; i++) {
                multiRemoveCallbacks.push(doc.on(events, target[i], callback, proxy));
            }
            return function(){
                while(multiRemoveCallbacks.length){
                    multiRemoveCallbacks.pop()();
                }
            };
        }

        var removeCallbacks = [];

        if(typeof events === 'string'){
            events = events.split(' ');
        }

        for(var i = 0; i < events.length; i++){
            var eventSettings = {};
            if(proxy){
                if(proxy === true){
                    proxy = document;
                }
                eventSettings.target = proxy;
                eventSettings.callback = function(event){
                    var closestTarget = doc.closest(event.target, target);
                    if(closestTarget){
                        callback(event, closestTarget);
                    }
                };
            }else{
                eventSettings.target = target;
                eventSettings.callback = callback;
            }

            eventSettings.event = events[i];

            addEvent(eventSettings);

            removeCallbacks.push(eventSettings);
        }

        return function(){
            while(removeCallbacks.length){
                var removeCallback = removeCallbacks.pop();
                getTarget(removeCallback.target).removeEventListener(removeCallback.event, removeCallback.callback);
            }
        }
    };

    /**

        ## .off

        removes events assigned to a target.

            //fluent
            doc(target/proxy).off(events, target[optional], callback)();

        note: if a target is passed to the .on function, doc's target will be used as the proxy.

            //legacy
            doc.off(events, target, callback, proxy);
    */

    function off(events, target, callback, proxy){
        if(target && target.length){
            for (var i = 0; i < target.length; i++) {
                doc.off(events, target[i], callback, proxy);
            }
            return this;
        }

        if(typeof events === 'string'){
            events = events.split(' ');
        }

        if(typeof callback !== 'function'){
            proxy = callback;
            callback = null;
        }

        proxy = proxy ? getTarget(proxy) : document;

        var targets = find(target, proxy);

        for(var targetIndex = 0; targetIndex < targets.length; targetIndex++){
            var currentTarget = targets[targetIndex];

            for(var i = 0; i < events.length; i++){
                currentTarget.removeEventListener(events[i], callback);
            }
        }
        return this;
    };

    /**

        ## .append

        adds elements to a target

            //fluent
            doc(target).append(children);

            //legacy
            doc.append(target, children);
    */

    function append(target, children){
        var target = getTarget(target),
            children = getTarget(children);

        if(target && target.length){
            target = target[0];
        }

        if(children.length){
            children = arrayProto.slice.call(children);
            for (var i = 0; i < children.length; i++) {
                doc.append(target, children[i]);
            }
            return;
        }

        target.appendChild(children);
    };

    /**

        ## .prepend

        adds elements to the front of a target

            //fluent
            doc(target).prepend(children);

            //legacy
            doc.prepend(target, children);
    */

    function prepend(target, children){
        var target = getTarget(target),
            children = getTarget(children);

        if(target && target.length){
            target = target[0];
        }

        if(children.length){
            children = arrayProto.slice.call(children);

            //reversed because otherwise the would get put in in the wrong order.
            for (var i = children.length -1; i; i--) {
                doc.prepend(target, children[i]);
            }
            return;
        }

        target.insertBefore(children, target.firstChild);
    };

    /**

        ## .isVisible

        checks if an element or any of its parents display properties are set to 'none'

            //fluent
            doc(target).isVisible();

            //legacy
            doc.isVisible(target);
    */

    function isVisible(target){
        var target = getTarget(target);
        if(!target){
            return;
        }
        if(target.length){
            var result = true,
                i = -1;

            while (target[i++] && doc.isVisible(target[i])) {}
            return target.length >= i;
        }
        while(target.parentNode && target.style.display !== 'none'){
            target = target.parentNode;
        }

        return target === document;
    };

    doc.find = find;
    doc.findOne = findOne;
    doc.closest = closest;
    doc.is = is;
    doc.addClass = addClass;
    doc.removeClass = removeClass;
    doc.off = off;
    doc.on = on;
    doc.append = append;
    doc.prepend = prepend;
    doc.isVisible = isVisible;

    /**

        ## .addFunction

        Used to add functionality to doc. This is needed because of the way doc's fluent functions queue.

            doc.addFunction('myFunc', myFunc, fluentMyFunc);

        the fluentFunction propery only needs to be passed if needed, examples are .on and .off.

    */

    function addFunction(functionName, docFunction, fluentFunction){
        doc[functionName] = docFunction;
        doc.prototype[functionName] = fluentFunction || function(){
            this._query.push({
                fn: docFunction,
                args: arguments
            });
            return this;
        }
    }
    doc.addFunction = addFunction;

    function addFluentFunctions(){
        // create fluent versions of doc functions.
        for (var key in doc) {
            if(doc.hasOwnProperty(key) && typeof doc[key] === 'function'){
                addFunction(key, doc[key]);
            }
        };

    }

    addFluentFunctions();

    addFunction('on', on, function(events, target, callback){
        var proxy = this._target;
        if(typeof target === 'function'){
            callback = target;
            target = this._target;
            proxy = null;
        }
        doc.on(events, target, callback, proxy);
        return this;
    });

    addFunction('off', on, function(events, target, callback){
        var reference = this._target;
        if(typeof target === 'function'){
            callback = target;
            target = this._target;
            reference = null;
        }
        doc.off(events, target, callback, reference);
        return this;
    });

    return doc;
}));