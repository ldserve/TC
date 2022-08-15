~function () {
    var jQuery = window.jQuery || '';


    function getSize(elem) {

        function getStyleSize(value) {
            var num = parseFloat(value); // not a percent like '100%', and a number

            var isValid = value.indexOf('%') == -1 && !isNaN(num);
            return isValid && num;
        }

        function noop() { }

        var logError = typeof console == 'undefined' ? noop : function (message) {
            console.error(message);
        };

        // -------------------------- measurements -------------------------- //
        var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];
        var measurementsLength = measurements.length;

        function getZeroSize() {
            var size = {
                width: 0,
                height: 0,
                innerWidth: 0,
                innerHeight: 0,
                outerWidth: 0,
                outerHeight: 0
            };

            for (var i = 0; i < measurementsLength; i++) {
                var measurement = measurements[i];
                size[measurement] = 0;
            }

            return size;
        }

        // -------------------------- getStyle -------------------------- //
        /**
         * getStyle, get style of element, check for Firefox bug
         * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
         */
        function getStyle(elem) {
            var style = getComputedStyle(elem);
            if (!style) {
                logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See https://bit.ly/getsizebug1');
            }
            return style;
        }

        // -------------------------- setup -------------------------- //
        var isSetup = false;
        var isBoxSizeOuter;
        /**
         * setup
         * check isBoxSizerOuter
         * do on first getSize() rather than on page load for Firefox bug
         */
        function setup() {
            // setup once
            if (isSetup) {
                return;
            }

            isSetup = true;
            // -------------------------- box sizing -------------------------- //
            /**
             * Chrome & Safari measure the outer-width on style.width on border-box elems
             * IE11 & Firefox<29 measures the inner-width
             */
            var div = document.createElement('div');
            div.style.width = '200px';
            div.style.padding = '1px 2px 3px 4px';
            div.style.borderStyle = 'solid';
            div.style.borderWidth = '1px 2px 3px 4px';
            div.style.boxSizing = 'border-box';
            var body = document.body || document.documentElement;
            body.appendChild(div);
            var style = getStyle(div); // round value for browser zoom. desandro/masonry#928

            isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
            getSize.isBoxSizeOuter = isBoxSizeOuter;
            body.removeChild(div);
        }

        // -------------------------- getSize -------------------------- //
        function getSize(elem) {
            setup(); // use querySeletor if elem is string

            if (typeof elem == 'string') {
                elem = document.querySelector(elem);
            } // do not proceed on non-objects


            if (!elem || _typeof(elem) != 'object' || !elem.nodeType) {
                return;
            }

            var style = getStyle(elem); // if hidden, everything is 0

            if (style.display == 'none') {
                return getZeroSize();
            }

            var size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;
            var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box'; // get all measurements

            for (var i = 0; i < measurementsLength; i++) {
                var measurement = measurements[i];
                var value = style[measurement];
                var num = parseFloat(value); // any 'auto', 'medium' value will be 0

                size[measurement] = !isNaN(num) ? num : 0;
            }
            // console.log('size- 1968 -', size);
            var paddingWidth = size.paddingLeft + size.paddingRight;
            var paddingHeight = size.paddingTop + size.paddingBottom;
            var marginWidth = size.marginLeft + size.marginRight;
            var marginHeight = size.marginTop + size.marginBottom;
            var borderWidth = size.borderLeftWidth + size.borderRightWidth;
            var borderHeight = size.borderTopWidth + size.borderBottomWidth;
            var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter; // overwrite width and height if we can get it from style

            var styleWidth = getStyleSize(style.width);

            if (styleWidth !== false) {
                size.width = styleWidth + ( // add padding and border unless it's already including it
                    isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
            }

            var styleHeight = getStyleSize(style.height);

            if (styleHeight !== false) {
                size.height = styleHeight + ( // add padding and border unless it's already including it
                    isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
            }

            size.innerWidth = size.width - (paddingWidth + borderWidth);
            size.innerHeight = size.height - (paddingHeight + borderHeight);
            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;
            return size;
        }

        return getSize(elem);
    }

    function matchesSelector(elem) {

        var matchesMethod = function () {
            var ElemProto = window.Element.prototype; // check for the standard method name first

            if (ElemProto.matches) {
                return 'matches';
            } // check un-prefixed


            if (ElemProto.matchesSelector) {
                return 'matchesSelector';
            } // check vendor prefixes


            var prefixes = ['webkit', 'moz', 'ms', 'o'];

            for (var i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i];
                var method = prefix + 'MatchesSelector';

                if (ElemProto[method]) {
                    return method;
                }
            }
        }();

        return function matchesSelector(elem, selector) {
            return elem[matchesMethod](selector);
        };
    };

    function matchesTag(tagName, element) {
        return tagName.toLowerCase() === element.tagName.toLowerCase();
    }


    function matchesId(id, element) {
        return id === element.id;
    }

    /* 事件委托器 */
    class Delegate {
        constructor(root) {
            this.listenerMap = [{}, {}];
            if (root) {
                this.root(root);
            }

            // this.handle = this.handle.bind(this) || function () { };
            this.removedListeners = [];
        }

        root(root) {
            var listenerMap = this.listenerMap;
            var eventType; // Remove master event listeners

            if (this.rootElement) {
                for (eventType in listenerMap[1]) {
                    if (listenerMap[1].hasOwnProperty(eventType)) {
                        this.rootElement.removeEventListener(eventType, this.handle, true);
                    }
                }
                for (eventType in listenerMap[0]) {
                    if (listenerMap[0].hasOwnProperty(eventType)) {
                        this.rootElement.removeEventListener(eventType, this.handle, false);
                    }
                }
            }
            // If no root or root is not
            // a dom node, then remove internal
            // root reference and exit here
            if (!root || !root.addEventListener) {
                if (this.rootElement) {
                    delete this.rootElement;
                }

                return this;
            }

            /**
             * The root node at which
             * listeners are attached.
             *
             * @type Node
             */
            this.rootElement = root; // Set up master event listeners
            for (eventType in listenerMap[1]) {
                if (listenerMap[1].hasOwnProperty(eventType)) {
                    this.rootElement.addEventListener(eventType, this.handle, true);
                }
            }

            for (eventType in listenerMap[0]) {
                if (listenerMap[0].hasOwnProperty(eventType)) {
                    this.rootElement.addEventListener(eventType, this.handle, false);
                }
            }
            console.log('listenerMap', this.listenerMap)
            return this;
        };
        // 
        captureForType(eventType) {
            return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
        };

        on(eventType, selector, handler, useCapture) {
            var root;
            var listenerMap;
            var matcher;
            var matcherParam;

            if (!eventType) {
                throw new TypeError('Invalid event type: ' + eventType);
            }
            // handler can be passed as
            // the second or third argument
            if (typeof selector === 'function') {
                useCapture = handler;
                handler = selector;
                selector = null;
            }
            // Fallback to sensible defaults
            // if useCapture not set
            if (useCapture === undefined) {
                useCapture = this.captureForType(eventType);
            }

            if (typeof handler !== 'function') {
                throw new TypeError('Handler must be a type of Function');
            }

            root = this.rootElement;
            listenerMap = this.listenerMap[useCapture ? 1 : 0]; // Add master handler for type if not created yet

            if (!listenerMap[eventType]) {
                if (root) {
                    root.addEventListener(eventType, this.handle, useCapture);
                }

                listenerMap[eventType] = [];
            }

            if (!selector) {
                matcherParam = null;
                // COMPLEX - matchesRoot needs to have access to
                // this.rootElement, so bind the function to this.
                matcher = matchesRoot.bind(this); // Compile a matcher for the given selector
            } else if (/^[a-z]+$/i.test(selector)) {
                matcherParam = selector;
                matcher = matchesTag;
            } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
                matcherParam = selector.slice(1);
                matcher = matchesId;
            } else {
                matcherParam = selector;
                matcher = Element.prototype.matches;
            } // Add to the list of listeners
            listenerMap[eventType].push({
                selector: selector,
                handler: handler,
                matcher: matcher,
                matcherParam: matcherParam
            });
            return this;
        };

        off(eventType, selector, handler, useCapture) {
            var i;
            var listener;
            var listenerMap;
            var listenerList;
            var singleEventType; // Handler can be passed as
            // the second or third argument

            if (typeof selector === 'function') {
                useCapture = handler;
                handler = selector;
                selector = null;
            } // If useCapture not set, remove
            // all event listeners


            if (useCapture === undefined) {
                this.off(eventType, selector, handler, true);
                this.off(eventType, selector, handler, false);
                return this;
            }

            listenerMap = this.listenerMap[useCapture ? 1 : 0];

            if (!eventType) {
                for (singleEventType in listenerMap) {
                    if (listenerMap.hasOwnProperty(singleEventType)) {
                        this.off(singleEventType, selector, handler);
                    }
                }

                return this;
            }
            listenerList = listenerMap[eventType];

            if (!listenerList || !listenerList.length) {
                return this;
            }
            // Remove only parameter matches
            // if specified
            for (i = listenerList.length - 1; i >= 0; i--) {
                listener = listenerList[i];

                if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
                    this._removedListeners.push(listener);

                    listenerList.splice(i, 1);
                }
            }
            // All listeners removed
            if (!listenerList.length) {
                delete listenerMap[eventType]; // Remove the main handler
                if (this.rootElement) {
                    this.rootElement.removeEventListener(eventType, this.handle, useCapture);
                }
            }
            return this;
        };

        handlefunction(event) {
            var i;
            var l;
            var type = event.type;
            var root;
            var phase;
            var listener;
            var returned;
            var listenerList = [];
            var target;
            var eventIgnore = 'ftLabsDelegateIgnore';

            if (event[eventIgnore] === true) {
                return;
            }

            target = event.target; // Hardcode value of Node.TEXT_NODE
            // as not defined in IE8

            if (target.nodeType === 3) {
                target = target.parentNode;
            } // Handle SVG <use> elements in IE


            if (target.correspondingUseElement) {
                target = target.correspondingUseElement;
            }

            root = this.rootElement;
            phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2); // eslint-disable-next-line default-case

            switch (phase) {
                case 1:
                    //Event.CAPTURING_PHASE:
                    listenerList = this.listenerMap[1][type];
                    break;

                case 2:
                    //Event.AT_TARGET:
                    if (this.listenerMap[0] && this.listenerMap[0][type]) {
                        listenerList = listenerList.concat(this.listenerMap[0][type]);
                    }

                    if (this.listenerMap[1] && this.listenerMap[1][type]) {
                        listenerList = listenerList.concat(this.listenerMap[1][type]);
                    }

                    break;

                case 3:
                    //Event.BUBBLING_PHASE:
                    listenerList = this.listenerMap[0][type];
                    break;
            }

            var toFire = []; // Need to continuously check
            // that the specific list is
            // still populated in case one
            // of the callbacks actually
            // causes the list to be destroyed.

            l = listenerList.length;

            while (target && l) {
                for (i = 0; i < l; i++) {
                    listener = listenerList[i]; // Bail from this loop if
                    // the length changed and
                    // no more listeners are
                    // defined between i and l.

                    if (!listener) {
                        break;
                    }

                    if (target.tagName && ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 && target.hasAttribute("disabled")) {
                        // Remove things that have previously fired
                        toFire = [];
                    } // Check for match and fire
                    // the event if there's one
                    //
                    // TODO:MCG:20120117: Need a way
                    // to check if event#stopImmediatePropagation
                    // was called. If so, break both loops.
                    else if (listener.matcher.call(target, listener.matcherParam, target)) {
                        toFire.push([event, target, listener]);
                    }
                } // TODO:MCG:20120117: Need a way to
                // check if event#stopPropagation
                // was called. If so, break looping
                // through the DOM. Stop if the
                // delegation root has been reached


                if (target === root) {
                    break;
                }

                l = listenerList.length; // Fall back to parentNode since SVG children have no parentElement in IE

                target = target.parentElement || target.parentNode; // Do not traverse up to document root when using parentNode, though

                if (target instanceof HTMLDocument) {
                    break;
                }
            }

            var ret;

            for (i = 0; i < toFire.length; i++) {
                // Has it been removed during while the event function was fired
                if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
                    continue;
                }

                returned = this.fire.apply(this, toFire[i]); // Stop propagation to subsequent
                // callbacks if the callback returned
                // false

                if (returned === false) {
                    toFire[i][0][eventIgnore] = true;
                    toFire[i][0].preventDefault();
                    ret = false;
                    break;
                }
            }

            return ret;
        };

        fire(event, target, listener) {
            return listener.handler.call(target, event, target);
        };

        destroy = function () {
            this.off();
            this.root();
        };
    }


    // 计算子元素位置
    class Cell {
        constructor(elem, parent) {
            this.element = elem;
            this.parent = parent;
            this.create();
            this.setDefaultTarget = this.updateTarget
        }

        create() {
            this.element.style.position = 'absolute';
            this.element.setAttribute('aria-hidden', 'true');
            this.x = 0;
            this.shift = 0;
        };

        destroy() {
            // reset style
            this.unselect();
            this.element.style.position = '';
            var side = this.parent.originSide;
            this.element.style[side] = '';
        };

        getSize() {
            this.size = getSize(this.element);
        };

        setPosition(x) {
            this.x = x;
            this.updateTarget();
            this.renderPosition(x);
        }; // setDefaultTarget v1 method, backwards compatibility, remove in v3


        updateTarget() {
            var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
            this.target = this.x + this.size[marginProperty] + this.size.width * this.parent.cellAlign;
        };

        renderPosition(x) {
            // render position of cell with in slider
            var side = this.parent.originSide;
            this.parent.getPositionValue = Animate.prototype.getPositionValue
            this.element.style[side] = this.parent.getPositionValue(x);
            console.log('debug 578');
        };

        select() {
            this.element.classList.add('is-selected');
            this.element.removeAttribute('aria-hidden');
        };

        unselect() {
            this.element.classList.remove('is-selected');
            this.element.setAttribute('aria-hidden', 'true');
        };


        wrapShift(shift) {
            this.shift = shift;
            this.renderPosition(this.x + this.parent.slideableWidth * shift);
        };

        remove() {
            this.element.parentNode.removeChild(this.element);
        };

    }

    // 工具
    class Utils {

        constructor() { }

        extend(a, b) {
            for (var prop in b) {
                a[prop] = b[prop];
            }
            return a;
        };
        modulo(num, div) {
            return (num % div + div) % div;
        };

        makeArray(obj) {
            var arraySlice = Array.prototype.slice; // turn element or nodeList into an array
            if (Array.isArray(obj)) {
                // use object if already an array
                return obj;
            } // return empty array if undefined or null. #6

            if (obj === null || obj === undefined) {
                return [];
            }
            var isArrayLike = _typeof(obj) == 'object' && typeof obj.length == 'number';

            if (isArrayLike) {
                // convert nodeList to array
                return arraySlice.call(obj);
            } // array of single index

            return [obj];
        };

        // ----- removeFrom ----- //
        removeFrom(ary, obj) {
            var index = ary.indexOf(obj);

            if (index != -1) {
                ary.splice(index, 1);
            }
        };
        // ----- getParent ----- //
        getParent(elem, selector) {
            while (elem.parentNode && elem != document.body) {
                elem = elem.parentNode;

                if (matchesSelector(elem, selector)) {
                    return elem;
                }
            }
        };

        // ----- getQueryElement ----- //
        // use element as selector string
        getQueryElement(elem) {
            if (typeof elem == 'string') {
                return document.querySelector(elem);
            }
            return elem;
        };

        // ----- handleEvent ----- //
        // enable .ontype to trigger from .addEventListener( elem, 'type' )
        handleEvent(event) {
            var method = 'on' + event.type;

            if (this[method]) {
                this[method](event);
            }
        };

        // ----- filterFindElements ----- //
        filterFindElements(elems, selector) {
            // make array of elems
            elems = this.makeArray(elems);
            var ffElems = [];
            elems.forEach(function (elem) {
                // check that elem is an actual element
                if (!(elem instanceof HTMLElement)) {
                    return;
                }
                // add elem if no selector

                if (!selector) {
                    ffElems.push(elem);
                    return;
                }
                // filter & find items if we have a selector
                // filter
                if (matchesSelector(elem, selector)) {
                    ffElems.push(elem);
                }
                // find children
                var childElems = elem.querySelectorAll(selector);
                // concat childElems to filterFound array

                for (var i = 0; i < childElems.length; i++) {
                    ffElems.push(childElems[i]);
                }
            });
            return ffElems;
        };

        // ----- debounceMethod ----- //
        debounceMethod(_class, methodName, threshold) {
            threshold = threshold || 100; // original method

            var method = _class.prototype[methodName];
            var timeoutName = methodName + 'Timeout';

            _class.prototype[methodName] = function () {
                var timeout = this[timeoutName];
                clearTimeout(timeout);
                var args = arguments;

                var _this = this;

                this[timeoutName] = setTimeout(function () {
                    method.apply(_this, args);
                    delete _this[timeoutName];
                }, threshold);
            };
        };

        // ----- docReady ----- //
        docReady(callback) {
            var readyState = document.readyState;
            if (readyState == 'complete' || readyState == 'interactive') {
                // do async to allow for other scripts to run. metafizzy/flickity#441
                setTimeout(callback);
            } else {
                document.addEventListener('DOMContentLoaded', callback);
            }
        };

        // ----- htmlInit ----- //
        // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
        toDashed(str) {
            return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
                return $1 + '-' + $2;
            }).toLowerCase();
        };

        // var console = window.console;
        /**
         * allow user to initialize classes via [data-namespace] or .js-namespace class
         * htmlInit( Widget, 'widgetName' )
         * options are parsed from data-namespace-options
         */
        htmlInit(WidgetClass, namespace) {
            this.docReady(function () {
                var dashedNamespace = utils.toDashed(namespace);
                var dataAttr = 'data-' + dashedNamespace;
                var dataAttrElems = document.querySelectorAll('[' + dataAttr + ']');
                var jsDashElems = document.querySelectorAll('.js-' + dashedNamespace);
                var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
                var dataOptionsAttr = dataAttr + '-options';
                console.log('- 765 -', elems)

                elems.forEach(function (elem) {
                    var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
                    var options;

                    try {
                        options = attr && JSON.parse(attr);
                    } catch (error) {
                        // log error, do not initialize
                        if (console) {
                            console.error('Error parsing ' + dataAttr + ' on ' + elem.className + ': ' + error);
                        }

                        return;
                    } // initialize


                    var instance = new WidgetClass(elem, options); // make available via $().data('namespace')

                    if (jQuery) {
                        jQuery.data(elem, namespace, instance);
                    }
                });
            });
        };

    }

    const utils = new Utils()

    function moveElements(elems, toElem) {
        elems = utils.makeArray(elems);

        while (elems.length) {
            toElem.appendChild(elems.shift());
        }
    }

    // 事件触发器
    class EvEmitter {
        constructor() { }

        on(eventName, listener) {
            if (!eventName || !listener) {
                return;
            }
            // set events hash
            var events = this.events = this.events || {}; // set listeners array
            var listeners = events[eventName] = events[eventName] || []; // only add once
            if (listeners.indexOf(listener) == -1) {
                listeners.push(listener);
            }
            return this;
        };

        once(eventName, listener) {
            if (!eventName || !listener) {
                return;
            }
            // add event
            this.on(eventName, listener); // set once flag
            // set onceEvents hash
            var onceEvents = this.onceEvents = this.onceEvents || {}; // set onceListeners object
            var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {}; // set flag
            onceListeners[listener] = true;
            return this;
        };

        off(eventName, listener) {
            var listeners = this.events && this.events[eventName];

            if (!listeners || !listeners.length) {
                return;
            }
            var index = listeners.indexOf(listener);
            if (index != -1) {
                listeners.splice(index, 1);
            }

            return this;
        };

        emitEvent(eventName, args) {
            var listeners = this.events && this.events[eventName];

            if (!listeners || !listeners.length) {
                return;
            }

            console.log('emitEvent', eventName, listeners, args);
            // copy over to avoid interference if .off() in listener
            listeners = listeners.slice(0);
            args = args || []; // once stuff

            var onceListeners = this.onceEvents && this.onceEvents[eventName];
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                var isOnce = onceListeners && onceListeners[listener];

                if (isOnce) {
                    // remove listener
                    // remove before trigger to prevent recursion
                    this.off(eventName, listener); // unset once flag
                    delete onceListeners[listener];
                }
                // trigger listener
                listener.apply(this, args);
            }
            return this;
        };

        allOff() {
            delete this.events;
            delete this.onceEvents;
        };

    }

    // 创建滑块元素
    class Flickity extends EvEmitter {
        constructor(element, options) {
            super()
            this.GUID = 0; // internal store of all Flickity intances
            this.instances = {};
            this.constructor.defaults = {
                accessibility: true,
                // adaptiveHeight: false,
                cellAlign: 'center',
                // cellSelector: undefined,
                // contain: false,
                freeScrollFriction: 0.075,
                // friction when free-scrolling
                friction: 0.28,
                // friction when selecting
                namespaceJQueryEvents: true,
                // initialIndex: 0,
                percentPosition: true,
                resize: true,
                selectedAttraction: 0.025,
                setGallerySize: true // watchCSS: false,
                // wrapAround: false

            }; // hash of methods triggered on _create()
            // this.createMethods = ['createLazyload','startAnimation'];
            this.createMethods = ['createLazyload'];
            this.init(element, options)

        }


        // -------------------------- Flickity -------------------------- //
        // globally unique identifiers
        init(element, options) {
            console.log('debug - 938 - Flickity Init');
            var queryElement = utils.getQueryElement(element);
            if (!queryElement) {
                if (console) {
                    console.error('Bad element for Flickity: ' + (queryElement || element));
                }
                return;
            }

            this.element = queryElement; // do not initialize twice on same element

            // utils.extend(this, EvEmitter.prototype);

            if (this.element.flickityGUID) {
                var instance = this.instances[this.element.flickityGUID];
                instance.option(options);
                return instance;
            }

            // add jQuery
            // if (jQuery) {
            //     this.$element = jQuery(this.element);
            // }

            // options
            this.options = utils.extend({}, this.constructor.defaults);
            this.option(options); // kick things off

            // console.log('- 946 -', this);
            // utils.extend(this, Animate.prototype)
            console.log('- 947 -', this);
            this.create();
            this.instance()
            console.log('debug - 971 - Flickity Init END');
        }

        create() {
            console.log('debug - 977 - create');
            // add id for Flickity.data
            var id = this.guid = ++this.GUID;
            this.element.flickityGUID = id; // expando

            this.instances[id] = this;
            // associate via id
            // initial properties

            this.selectedIndex = 0; // how many frames slider has been in same position
            this.restingFrames = 0; // initial physics properties

            this.x = 0;
            this.velocity = 0;
            this.originSide = this.options.rightToLeft ? 'right' : 'left'; // create viewport & slider

            this.viewport = document.createElement('div');
            this.viewport.className = 'flickity-viewport';

            this.createSlider();
            if (this.options.resize || this.options.watchCSS) {
                window.addEventListener('resize', this);

            }

            // console.log('- 974 -',this.slider)
            // add listeners from on option
            console.log('event - 999', this.options);

            for (var eventName in this.options.on) {
                var listener = this.options.on[eventName];
                this.on(eventName, listener);
            }

            this.createMethods.forEach(function (method) {
                this[method]();
            }, this);

            if (this.options.watchCSS) {
                this.watchCSS();
            } else {
                this.activate();
            }
            console.log('debug - 1020 - create END');
        };

        option(opts) {
            utils.extend(this.options, opts);
            console.log('debug - 1025 - option END');
        };

        activate() {
            console.log('debug - 1029 - activate');

            if (this.isActive) {
                return;
            }

            this.isActive = true;
            this.element.classList.add('flickity-enabled');

            if (this.options.rightToLeft) {
                this.element.classList.add('flickity-rtl');
            }

            this.getSize(); // move initial cell elements so they can be loaded as cells
            var cellElems = this.filterFindCellElements(this.element.children);
            console.log('- 1015 - activate -');

            moveElements(cellElems, this.slider);
            this.viewport.appendChild(this.slider);
            this.element.appendChild(this.viewport); // get cells from children

            this.reloadCells();
            console.log('- 1022 activate center-');

            if (this.options.accessibility) {
                // allow element to focusable
                this.element.tabIndex = 0; // listen for key presses

                this.element.addEventListener('keydown', this);
            }

            // this.emitEvent = EvEmitter.prototype.emitEvent
            this.emitEvent('activate');
            this.selectInitialIndex(); // flag for initial activation, for using initialIndex
            this.isInitActivated = true; // ready event. #493

            this.dispatchEvent('ready');

            console.log('debug - 1068 - activate END');
        };


        // lazyLoad START
        createLazyload() {
            this.on('select', this.lazyLoad);
        };

        lazyLoad() {
            var lazyLoad = this.options.lazyLoad;
            var _this = this
            if (!lazyLoad) {
                return;
            }
            // get adjacent cells, use lazyLoad option for adjacent count

            var adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
            var cellElems = this.getAdjacentCellElements(adjCount); // get lazy images in those cells

            var lazyImages = [];
            cellElems.forEach(function (cellElem) {
                var lazyCellImages = _this.getCellLazyImages(cellElem);
                lazyImages = lazyImages.concat(lazyCellImages);
            });

            console.log('debug - 1089 - lazyLoad', lazyImages);
            // load lazy images
            lazyImages.forEach(function (img) {
                new LazyLoader(img, this);
            }, this);
        };

        getCellLazyImages(cellElem) {
            // check if cell element is lazy image
            if (cellElem.nodeName == 'IMG') {
                var lazyloadAttr = cellElem.getAttribute('data-flickity-lazyload');
                var srcAttr = cellElem.getAttribute('data-flickity-lazyload-src');
                var srcsetAttr = cellElem.getAttribute('data-flickity-lazyload-srcset');

                if (lazyloadAttr || srcAttr || srcsetAttr) {
                    return [cellElem];
                }
            }
            // select lazy images in cell
            var lazySelector = 'img[data-flickity-lazyload], ' + 'img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]';
            var imgs = cellElem.querySelectorAll(lazySelector);
            return utils.makeArray(imgs);
        }

        // createSlider
        createSlider() {
            // slider element does all the positioning
            var slider = document.createElement('div');
            slider.className = 'flickity-slider';
            slider.style[this.originSide] = 0;
            this.slider = slider;
            console.log('debug - 1077 - createSlider END');
        };

        filterFindCellElements(elems) {
            console.log('debug - 1081 - filterFindCellElements END');
            return utils.filterFindElements(elems, this.options.cellSelector);
        }; // goes through all children


        reloadCells() {
            // collection of item elements
            console.log('1080 - reloadCells start',);
            this.cells = this.makeCells(this.slider.children);
            this.positionCells();
            this.getWrapShiftCells();
            this.setGallerySize();
            console.log('- 1086 - reloadCells END');
        };

        makeCells(elems) {
            var cellElems = this.filterFindCellElements(elems); // create new Flickity for collection


            var cells = cellElems.map(function (cellElem) {
                return new Cell(cellElem, this);
            }, this);
            console.log('debug - 1103 - makeCells END');
            return cells;
        };

        getLastCell() {
            console.log('debug - 1108 - getLastCell END');
            return this.cells[this.cells.length - 1];
        };

        getLastSlide() {
            console.log('debug - 1113 - getLastSlide END');
            return this.slides[this.slides.length - 1];
        }; // positions all cells



        positionCells(index) {
            // size all cells
            console.log('debug -1088 - positionCells');

            this.sizeCells(this.cells);
            // position all cells

            index = index || 0; // also measure maxCellHeight
            // start 0 if positioning all cells

            this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
            var cellX = 0; // get cellX

            if (index > 0) {
                var startCell = this.cells[index - 1];
                cellX = startCell.x + startCell.size.outerWidth;
            }

            var len = this.cells.length;

            for (var i = index; i < len; i++) {
                var cell = this.cells[i];
                cell.setPosition(cellX);
                cellX += cell.size.outerWidth;
                this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
            }
            // keep track of cellX for wrap-around

            this.slideableWidth = cellX; // slides

            this.updateSlides(); // contain slides target
            this.containSlides(); // update slidesWidth

            this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
            console.log('debug -1120 - positionCells END');

        };

        sizeCells(cells) {
            cells.forEach(function (cell) {
                cell.getSize();
            });
            console.log('debug - 1161 - sizeCells END');
        };

        updateSlides() {
            console.log('debug - 1164 - updateSlides');
            this.slides = [];

            if (!this.cells.length) {
                return;
            }

            var slide = new Slide(this);
            this.slides.push(slide);
            var isOriginLeft = this.originSide == 'left';
            var nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';

            var canCellFit = this.getCanCellFit();

            this.cells.forEach(function (cell, i) {
                // just add cell if first cell in slide
                if (!slide.cells.length) {
                    slide.addCell(cell);
                    return;
                }

                var slideWidth = slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);

                if (canCellFit.call(this, i, slideWidth)) {
                    slide.addCell(cell);
                } else {
                    // doesn't fit, new slide
                    slide.updateTarget();
                    slide = new Slide(this);
                    this.slides.push(slide);
                    slide.addCell(cell);
                }
            }, this); // last slide

            slide.updateTarget(); // update .selectedSlide

            this.updateSelectedSlide();
            console.log('debug - 1202 - updateSlides END');
        };

        getCanCellFit() {
            console.log('debug - 1206 - getCanCellFit END');
            var groupCells = this.options.groupCells;

            if (!groupCells) {
                return function () {
                    return false;
                };
            } else if (typeof groupCells == 'number') {
                // group by number. 3 -> [0,1,2], [3,4,5], ...
                var number = parseInt(groupCells, 10);
                return function (i) {
                    return i % number !== 0;
                };
            } // default, group by width of slide
            // parse '75%


            var percentMatch = typeof groupCells == 'string' && groupCells.match(/^(\d+)%$/);
            var percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
            return function (i, slideWidth) {
                return slideWidth <= (this.size.innerWidth + 1) * percent;
            };
        };

        // alias _init for jQuery plugin .flickity()
        // init = reposition() {
        //         this.positionCells();
        //         this.positionSliderAtSelected();
        //     };

        getSize() {
            this.size = getSize(this.element);
            this.setCellAlign();
            // console.log('- 1199 -', this.size);
            this.cursorPosition = this.size.innerWidth * this.cellAlign;
            console.log('debug - 1241 - getSize END');
        };


        setCellAlign() {
            var cellAlignShorthands = {
                // cell align, then based on origin side
                center: {
                    left: 0.5,
                    right: 0.5
                },
                left: {
                    left: 0,
                    right: 1
                },
                right: {
                    right: 0,
                    left: 1
                }
            };
            var shorthand = cellAlignShorthands[this.options.cellAlign];
            this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
            console.log('debug - 1263 - setCellAlign END');
        };

        setGallerySize() {
            if (this.options.setGallerySize) {
                var height = this.options.adaptiveHeight && this.selectedSlide ? this.selectedSlide.height : this.maxCellHeight;
                this.viewport.style.height = height + 'px';
            }
            console.log('debug - 1271 - setGallerySize ');
        };

        getWrapShiftCells() {
            // only for wrap-around
            if (!this.options.wrapAround) {
                return;
            } // unshift previous cells
            this.unshiftCells(this.beforeShiftCells);

            this.unshiftCells(this.afterShiftCells); // get before cells
            // initial gap

            var gapX = this.cursorPosition;
            var cellIndex = this.cells.length - 1;
            this.beforeShiftCells = this.getGapCells(gapX, cellIndex, -1); // get after cells
            // ending gap between last cell and end of gallery viewport

            gapX = this.size.innerWidth - this.cursorPosition; // start cloning at first cell, working forwards

            this.afterShiftCells = this.getGapCells(gapX, 0, 1);
            console.log('debug - 1292 - getWrapShiftCells END ');
        };

        getGapCells(gapX, cellIndex, increment) {
            // keep adding cells until the cover the initial gap
            var cells = [];

            while (gapX > 0) {
                var cell = this.cells[cellIndex];

                if (!cell) {
                    break;
                }

                cells.push(cell);
                cellIndex += increment;
                gapX -= cell.size.outerWidth;
            }
            console.log('debug - 1310 - getGapCells END ');
            return cells;
        };

        // ----- contain ----- //
        // contain cell targets so no excess sliding
        containSlides() {
            if (!this.options.contain || this.options.wrapAround || !this.cells.length) {
                return;
            }

            var isRightToLeft = this.options.rightToLeft;
            var beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
            var endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
            var contentWidth = this.slideableWidth - this.getLastCell().size[endMargin]; // content is less than gallery size

            var isContentSmaller = contentWidth < this.size.innerWidth; // bounds

            var beginBound = this.cursorPosition + this.cells[0].size[beginMargin];
            var endBound = contentWidth - this.size.innerWidth * (1 - this.cellAlign); // contain each cell target

            this.slides.forEach(function (slide) {
                if (isContentSmaller) {
                    // all cells fit inside gallery
                    slide.target = contentWidth * this.cellAlign;
                } else {
                    // contain to bounds
                    slide.target = Math.max(slide.target, beginBound);
                    slide.target = Math.min(slide.target, endBound);
                }
            }, this);
            console.log('debug - 1341 - containSlides END ');
        }; // -----  ----- //

        /**
         * emits events via eventEmitter and jQuery events
         * @param {String} type - name of event
         * @param {Event} event - original event
         * @param {Array} args - extra arguments
         */
        dispatchEvent(type, event, args) {
            var emitArgs = event ? [event].concat(args) : args;
            this.emitEvent(type, emitArgs);

            if (jQuery && this.$element) {
                // default trigger with type if no event
                type += this.options.namespaceJQueryEvents ? '.flickity' : '';
                var $event = type;

                if (event && jQuery) {
                    // create jQuery event
                    var jQEvent = jQuery.Event(event);
                    jQEvent.type = type;
                    $event = jQEvent;
                }

                this.$element.trigger($event, args);
            }
            console.log('debug - 1368 - dispatchEvent END ');
        };


        /**
         * @param {Integer} index - index of the slide
         * @param {Boolean} isWrap - will wrap-around to last/first if at the end
         * @param {Boolean} isInstant - will immediately set position at selected cell
         */
        select(index, isWrap, isInstant) {
            if (!this.isActive) {
                return;
            }

            index = parseInt(index, 10);

            this.wrapSelect(index);

            if (this.options.wrapAround || isWrap) {
                index = utils.modulo(index, this.slides.length);
            } // bail if invalid index


            if (!this.slides[index]) {
                return;
            }

            var prevIndex = this.selectedIndex;
            this.selectedIndex = index;
            this.updateSelectedSlide();

            if (isInstant) {
                // this.positionSliderAtSelected();
            } else {
                this.startAnimation();
            }

            if (this.options.adaptiveHeight) {
                this.setGallerySize();
            } // events


            this.dispatchEvent('select', null, [index]); // change event if new index

            if (index != prevIndex) {
                this.dispatchEvent('change', null, [index]);
            } // old v1 event name, remove in v3


            this.dispatchEvent('cellSelect');
            console.log('debug - 1418 - select END ');
        }; // wraps position for wrapAround, to move to closest slide. #113


        wrapSelect(index) {
            var len = this.slides.length;
            var isWrapping = this.options.wrapAround && len > 1;

            if (!isWrapping) {
                return index;
            }

            var wrapIndex = utils.modulo(index, len); // go to shortest

            var delta = Math.abs(wrapIndex - this.selectedIndex);
            var backWrapDelta = Math.abs(wrapIndex + len - this.selectedIndex);
            var forewardWrapDelta = Math.abs(wrapIndex - len - this.selectedIndex);

            if (!this.isDragSelect && backWrapDelta < delta) {
                index += len;
            } else if (!this.isDragSelect && forewardWrapDelta < delta) {
                index -= len;
            } // wrap position so slider is within normal area


            if (index < 0) {
                this.x -= this.slideableWidth;
            } else if (index >= len) {
                this.x += this.slideableWidth;
            }
            console.log('debug - 1448 - wrapSelect END ');
        };

        previous(isWrap, isInstant) {
            this.select(this.selectedIndex - 1, isWrap, isInstant);
            console.log('debug - 1453 - previous END ');
        };

        next(isWrap, isInstant) {
            this.select(this.selectedIndex + 1, isWrap, isInstant);
            console.log('debug - 1458 - next END ');
        };

        updateSelectedSlide() {
            var slide = this.slides[this.selectedIndex]; // selectedIndex could be outside of slides, if triggered before resize()

            if (!slide) {
                return;
            } // unselect previous selected slide

            console.log('slid', slide)
            this.unselectSelectedSlide(); // update new selected slide

            this.selectedSlide = slide;
            slide.select();
            this.selectedCells = slide.cells;
            this.selectedElements = slide.getCellElements(); // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
            // Remove in v3?

            this.selectedCell = slide.cells[0];
            this.selectedElement = this.selectedElements[0];
            console.log('debug - 1479 - updateSelectedSlide END ');
        };

        unselectSelectedSlide() {
            if (this.selectedSlide) {
                this.selectedSlide.unselect();
            }
            console.log('debug - 1486 - unselectSelectedSlide END ');
        };

        selectInitialIndex() {
            var initialIndex = this.options.initialIndex; // already activated, select previous selectedIndex

            if (this.isInitActivated) {
                this.select(this.selectedIndex, false, true);
                return;
            } // select with selector string


            if (initialIndex && typeof initialIndex == 'string') {
                var cell = this.queryCell(initialIndex);

                if (cell) {
                    this.selectCell(initialIndex, false, true);
                    return;
                }
            }

            var index = 0; // select with number

            if (initialIndex && this.slides[initialIndex]) {
                index = initialIndex;
            } // select instantly


            this.select(index, false, true);
            console.log('debug - 1515 - selectInitialIndex END ');
        };


        selectCell(value, isWrap, isInstant) {
            // get cell
            var cell = this.queryCell(value);

            if (!cell) {
                return;
            }

            var index = this.getCellSlideIndex(cell);
            this.select(index, isWrap, isInstant);
            console.log('debug - 1529 - selectCell END ');
        };

        getCellSlideIndex(cell) {
            // get index of slides that has cell
            for (var i = 0; i < this.slides.length; i++) {
                var slide = this.slides[i];
                var index = slide.cells.indexOf(cell);

                if (index != -1) {
                    return i;
                }
            }
            console.log('debug - 1542 - getCellSlideIndex END ');
        };

        // -------------------------- get cells -------------------------- //
        /**
         * get Flickity.Cell, given an Element
         * @param {Element} elem
         * @returns {Flickity.Cell} item
         */
        getCell(elem) {
            // loop through cells to get the one that matches
            for (var i = 0; i < this.cells.length; i++) {
                var cell = this.cells[i];

                if (cell.element == elem) {
                    return cell;
                }
            }
            console.log('debug - 1560 - getCell END ');
        };

        /**
         * get collection of Flickity.Cells, given Elements
         * @param {Element, Array, NodeList} elems
         * @returns {Array} cells - Flickity.Cells
         */
        getCells = function (elems) {
            elems = utils.makeArray(elems);
            var cells = [];
            elems.forEach(function (elem) {
                var cell = this.getCell(elem);

                if (cell) {
                    cells.push(cell);
                }
            }, this);
            console.log('debug - 1578 - getCells END ');
            return cells;
        };


        /**
         * get cell elements
         * @returns {Array} cellElems
         */
        getCellElements() {
            console.log('debug - 1588 - getCellElements END ');
            return this.cells.map(function (cell) {
                return cell.element;
            });
        };


        /**
         * get parent cell from an element
         * @param {Element} elem
         * @returns {Flickit.Cell} cell
         */
        getParentCell(elem) {
            // first check if elem is cell
            var cell = this.getCell(elem);

            if (cell) {
                return cell;
            } // try to get parent cell elem

            console.log('debug - 1608 - getParentCell END ');
            elem = utils.getParent(elem, '.flickity-slider > *');
            return this.getCell(elem);
        };


        /**
         * get cells adjacent to a slide
         * @param {Integer} adjCount - number of adjacent slides
         * @param {Integer} index - index of slide to start
         * @returns {Array} cells - array of Flickity.Cells
         */
        getAdjacentCellElements(adjCount, index) {
            if (!adjCount) {
                return this.selectedSlide.getCellElements();
            }

            index = index === undefined ? this.selectedIndex : index;
            var len = this.slides.length;

            if (1 + adjCount * 2 >= len) {
                return this.getCellElements();
            }

            var cellElems = [];

            for (var i = index - adjCount; i <= index + adjCount; i++) {
                var slideIndex = this.options.wrapAround ? utils.modulo(i, len) : i;
                var slide = this.slides[slideIndex];

                if (slide) {
                    cellElems = cellElems.concat(slide.getCellElements());
                }
            }
            console.log('debug - 1642 - getAdjacentCellElements  END ');

            return cellElems;
        };


        /**
         * select slide from number or cell element
         * @param {Element, Selector String, or Number} selector
         */
        queryCell(selector) {
            if (typeof selector == 'number') {
                // use number as index
                return this.cells[selector];
            }

            if (typeof selector == 'string') {
                // do not select invalid selectors from hash: #123, #/. #791
                if (selector.match(/^[#\.]?[\d\/]/)) {
                    return;
                } // use string as selector, get element


                selector = this.element.querySelector(selector);
            } // get cell from element

            console.log('debug - 1668 - queryCell  END ');
            return this.getCell(selector);
        };

        // -------------------------- events -------------------------- //
        uiChange() {
            this.emitEvent('uiChange');
            console.log('debug - 1675 - uiChange  END ');
        }; // keep focus on element when child UI elements are clicked


        childUIPointerDown(event) {
            // HACK iOS does not allow touch events to bubble up?!
            if (event.type != 'touchstart') {
                event.preventDefault();
            }

            this.focus();
            console.log('debug - 1686 - childUIPointerDown  END ');
        };

        // ----- resize ----- //
        onresize = function () {
            this.watchCSS();
            this.resize();
            console.log('debug - 1693 - onresize  END ');
        };


        resize() {
            if (!this.isActive) {
                return;
            }

            this.getSize(); // wrap values

            if (this.options.wrapAround) {
                this.x = utils.modulo(this.x, this.slideableWidth);
            }

            this.positionCells();

            this.getWrapShiftCells();

            this.setGallerySize();
            this.emitEvent('resize');
            // update selected index for group slides, instant
            // TODO: position can be lost between groups of various numbers

            var selectedElement = this.selectedElements && this.selectedElements[0];
            this.selectCell(selectedElement, false, true);
            console.log('debug - 1719 - resize  END ');
        };

        // watches the :after property, activates/deactivates
        watchCSS = function () {
            var watchOption = this.options.watchCSS;

            if (!watchOption) {
                return;
            }

            var afterContent = getComputedStyle(this.element, ':after').content; // activate if :after { content: 'flickity' }
            console.log('- 1668 watchCSS-', afterContent)

            if (afterContent.indexOf('flickity') != -1) {
                this.activate();
            } else {
                this.deactivate();
            }
            console.log('- 1675 watchCSS-END');
        };

        // ----- keydown ----- //
        // go previous/next if left/right keys pressed
        onkeydown(event) {
            // only work if element is in focus
            var isNotFocused = document.activeElement && document.activeElement != this.element;

            if (!this.options.accessibility || isNotFocused) {
                return;
            }

            var handler = Flickity.keyboardHandlers[event.keyCode];

            if (handler) {
                handler.call(this);
            }
            console.log('debug - 1756 - onkeydown  END ');
        };



        // ----- focus ----- //
        focus() {
            // TODO remove scrollTo once focus options gets more support
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#Browser_compatibility
            var prevScrollY = window.pageYOffset;
            this.element.focus({
                preventScroll: true
            }); // hack to fix scroll jump after focus, #76

            if (window.pageYOffset != prevScrollY) {
                window.scrollTo(window.pageXOffset, prevScrollY);
            }
            console.log('debug - 1773 - focus  END ');
        };

        // -------------------------- destroy -------------------------- //
        // deactivate all Flickity functionality, but keep stuff available
        deactivate() {
            if (!this.isActive) {
                return;
            }

            this.element.classList.remove('flickity-enabled');
            this.element.classList.remove('flickity-rtl');
            this.unselectSelectedSlide(); // destroy cells

            this.cells.forEach(function (cell) {
                cell.destroy();
            });
            this.element.removeChild(this.viewport); // move child elements back into element

            moveElements(this.slider.children, this.element);

            if (this.options.accessibility) {
                this.element.removeAttribute('tabIndex');
                this.element.removeEventListener('keydown', this);
            } // set flags


            this.isActive = false;
            this.emitEvent('deactivate');
            console.log('debug - 1802 - deactivate  END ');
        };

        destroy() {
            this.deactivate();
            window.removeEventListener('resize', this);
            this.allOff();
            this.emitEvent('destroy');

            if (jQuery && this.$element) {
                jQuery.removeData(this.element, 'flickity');
            }

            delete this.element.flickityGUID;
            delete this.instances[this.guid];
            console.log('debug - 1817 - destroy  END ');
        };


        // -------------------------- prototype -------------------------- //
        // -------------------------- extras -------------------------- //
        /**
         * get Flickity instance from element
         * @param {Element} elem
         * @returns {Flickity}
         */
        instance() {
            utils.debounceMethod(Flickity, 'onresize', 150);
            // utils.extend(this, animatePrototype);

            Flickity.keyboardHandlers = {
                // left arrow
                37: function _() {
                    var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
                    this.uiChange();
                    this[leftMethod]();
                },
                // right arrow
                39: function _() {
                    var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
                    this.uiChange();
                    this[rightMethod]();
                }
            };
            var instances = this.instances
            Flickity.data = function (elem) {
                elem = utils.getQueryElement(elem);
                var id = elem && elem.flickityGUID;
                return id && instances[id];
            };

            utils.htmlInit(Flickity, 'flickity');

            if (jQuery && jQuery.bridget) {
                jQuery.bridget('flickity', Flickity);
            }
            // set internal jQuery, for Webpack + jQuery v3, #478

            // Flickity.setJQuery = function (jq) {
            //     jQuery = jq;
            // };

            Flickity.Cell = Cell;
            Flickity.Slide = Slide;
            console.log('debug - 1866 - instance  END ');
        }


        cellSizeChange = function (elem) {
            var cell = this.getCell(elem);
            if (!cell) {
                return;
            }

            cell.getSize();
            var index = this.cells.indexOf(cell);
            this.cellChange(index);
        };


        /**
         * logic any time a cell is changed: added, removed, or size changed
         * @param {Integer} changedCellIndex - index of the changed cell, optional
         */
        cellChange(changedCellIndex, isPositioningSlider) {
            var prevSelectedElem = this.selectedElement;

            this.positionCells(changedCellIndex);

            this.getWrapShiftCells();

            this.setGallerySize(); // update selectedIndex
            // try to maintain position & select previous selected element

            var cell = this.getCell(prevSelectedElem);
            if (cell) {
                this.selectedIndex = this.getCellSlideIndex(cell);
            }

            this.selectedIndex = Math.min(this.slides.length - 1, this.selectedIndex);
            this.emitEvent('cellChange', [changedCellIndex]); // position slider

            this.select(this.selectedIndex); // do not position slider after lazy load

            if (isPositioningSlider) {
                this.positionSliderAtSelected();
            }
        };

    }

    class Slide {
        constructor(parent) {
            this.parent = parent;
            this.isOriginLeft = parent.originSide == 'left';
            this.cells = [];
            this.outerWidth = 0;
            this.height = 0;
        }

        addCell(cell) {
            this.cells.push(cell);
            this.outerWidth += cell.size.outerWidth;
            this.height = Math.max(cell.size.outerHeight, this.height); // first cell stuff

            if (this.cells.length == 1) {
                this.x = cell.x; // x comes from first cell

                var beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
                this.firstMargin = cell.size[beginMargin];
            }
        };

        updateTarget() {
            var endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
            var lastCell = this.getLastCell();
            var lastMargin = lastCell ? lastCell.size[endMargin] : 0;
            var slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
            this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
        };

        getLastCell() {
            return this.cells[this.cells.length - 1];
        };

        select() {
            this.cells.forEach(function (cell) {
                cell.select();
            });
        };

        unselect() {
            this.cells.forEach(function (cell) {
                cell.unselect();
            });
        };

        getCellElements() {
            return this.cells.map(function (cell) {
                return cell.element;
            });
        };


    }

    class Animate {

        constructor() {

        }
        startAnimation() {
            if (this.isAnimating) {
                return;
            }

            this.isAnimating = true;
            this.restingFrames = 0;
            this.animate();
        };

        animate() {
            this.applyDragForce();
            this.applySelectedAttraction();
            var previousX = this.x;
            this.integratePhysics();
            this.positionSlider();
            this.settle(previousX); // animate next frame

            if (this.isAnimating) {
                var _this = this;

                requestAnimationFrame(function animateFrame() {
                    _this.animate();
                });
            }
        };

        positionSlider() {
            var x = this.x; // wrap position around

            if (this.options.wrapAround && this.cells.length > 1) {
                x = utils.modulo(x, this.slideableWidth);
                x = x - this.slideableWidth;
                this.shiftWrapCells(x);
            }

            this.setTranslateX(x, this.isAnimating);
            this.dispatchScrollEvent();
        };

        setTranslateX(x, is3d) {
            x += this.cursorPosition; // reverse if right-to-left and using transform

            x = this.options.rightToLeft ? -x : x;
            var translateX = this.getPositionValue(x); // use 3D tranforms for hardware acceleration on iOS
            // but use 2D when settled, for better font-rendering

            this.slider.style.transform = is3d ? 'translate3d(' + translateX + ',0,0)' : 'translateX(' + translateX + ')';
        };

        dispatchScrollEvent() {
            var firstSlide = this.slides[0];

            if (!firstSlide) {
                return;
            }

            var positionX = -this.x - firstSlide.target;
            var progress = positionX / this.slidesWidth;
            this.dispatchEvent('scroll', null, [progress, positionX]);
        };

        positionSliderAtSelected() {
            if (!this.cells.length) {
                return;
            }

            this.x = -this.selectedSlide.target;
            this.velocity = 0; // stop wobble

            this.positionSlider();
        };

        getPositionValue(position) {
            if (this.options.percentPosition) {
                // percent position, round to 2 digits, like 12.34%
                return Math.round(position / this.size.innerWidth * 10000) * 0.01 + '%';
            } else {
                // pixel positioning
                return Math.round(position) + 'px';
            }
        };

        settle(previousX) {
            // keep track of frames where x hasn't moved
            if (!this.isPointerDown && Math.round(this.x * 100) == Math.round(previousX * 100)) {
                this.restingFrames++;
            } // stop animating if resting for 3 or more frames


            if (this.restingFrames > 2) {
                this.isAnimating = false;
                delete this.isFreeScrolling; // render position with translateX when settled

                this.positionSlider();
                this.dispatchEvent('settle', null, [this.selectedIndex]);
            }
        };

        shiftWrapCells(x) {
            // shift before cells
            var beforeGap = this.cursorPosition + x;

            this._shiftCells(this.beforeShiftCells, beforeGap, -1); // shift after cells


            var afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);

            this._shiftCells(this.afterShiftCells, afterGap, 1);
        };

        shiftCells(cells, gap, shift) {
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var cellShift = gap > 0 ? shift : 0;
                cell.wrapShift(cellShift);
                gap -= cell.size.outerWidth;
            }
        };

        unshiftCells(cells) {
            if (!cells || !cells.length) {
                return;
            }

            for (var i = 0; i < cells.length; i++) {
                cells[i].wrapShift(0);
            }
        };

        // -------------------------- physics -------------------------- //
        integratePhysics() {
            this.x += this.velocity;
            this.velocity *= this.getFrictionFactor();
        };

        applyForce(force) {
            this.velocity += force;
        };

        getFrictionFactor() {
            return 1 - this.options[this.isFreeScrolling ? 'freeScrollFriction' : 'friction'];
        };

        getRestingPosition() {
            // my thanks to Steven Wittens, who simplified this math greatly
            return this.x + this.velocity / (1 - this.getFrictionFactor());
        };

        applyDragForce() {
            if (!this.isDraggable || !this.isPointerDown) {
                return;
            } // change the position to drag position by applying force


            var dragVelocity = this.dragX - this.x;
            var dragForce = dragVelocity - this.velocity;
            this.applyForce(dragForce);
        };

        applySelectedAttraction() {
            // do not attract if pointer down or no slides
            var dragDown = this.isDraggable && this.isPointerDown;

            if (dragDown || this.isFreeScrolling || !this.slides.length) {
                return;
            }

            var distance = this.selectedSlide.target * -1 - this.x;
            var force = distance * this.options.selectedAttraction;
            this.applyForce(force);
        };

    }

    // Flickity.animatePrototype=Animate
    /** class to handle loading images **/
    class LazyLoader {
        constructor(img, flickity) {
            this.img = img;
            this.flickity = flickity;
            this.load();
            this.handleEvent = utils.handleEvent;
        }

        load() {
            this.img.addEventListener('load', this);
            this.img.addEventListener('error', this); // get src & srcset

            var src = this.img.getAttribute('data-flickity-lazyload') || this.img.getAttribute('data-flickity-lazyload-src');
            var srcset = this.img.getAttribute('data-flickity-lazyload-srcset'); // set src & serset

            this.img.src = src;

            if (srcset) {
                this.img.setAttribute('srcset', srcset);
            } // remove attr

            this.img.removeAttribute('data-flickity-lazyload');
            this.img.removeAttribute('data-flickity-lazyload-src');
            this.img.removeAttribute('data-flickity-lazyload-srcset');
        };

        onload(event) {
            this.complete(event, 'flickity-lazyloaded');
        };

        onerror(event) {
            this.complete(event, 'flickity-lazyerror');
        };

        complete(event, className) {
            // unbind events
            this.img.removeEventListener('load', this);
            this.img.removeEventListener('error', this);
            var cell = this.flickity.getParentCell(this.img);
            var cellElem = cell && cell.element;
            this.flickity.cellSizeChange(cellElem);
            this.img.classList.add(className);
            this.flickity.dispatchEvent('lazyLoad', event, cellElem);
        };
    }

    Flickity.LazyLoader = LazyLoader;

    // 懒加载处理
    window.lazySizes = function () {
        /*jshint eqnull:true */

        var lazysizes, lazySizesCfg;
        (function () {
            var prop;
            var lazySizesDefaults = {
                lazyClass: 'lazyload',
                loadedClass: 'lazyloaded',
                loadingClass: 'lazyloading',
                preloadClass: 'lazypreload',
                errorClass: 'lazyerror',
                //strictClass: 'lazystrict',
                autosizesClass: 'lazyautosizes',
                srcAttr: 'data-src',
                srcsetAttr: 'data-srcset',
                sizesAttr: 'data-sizes',
                //preloadAfterLoad: false,
                minSize: 40,
                customMedia: {},
                init: true,
                expFactor: 1.5,
                hFac: 0.8,
                loadMode: 2,
                loadHidden: true,
                ricTimeout: 0,
                throttleDelay: 125
            };
            lazySizesCfg = window.lazySizesConfig || window.lazysizesConfig || {};

            for (prop in lazySizesDefaults) {
                if (!(prop in lazySizesCfg)) {
                    lazySizesCfg[prop] = lazySizesDefaults[prop];
                }
            }
        })();

        if (!document || !document.getElementsByClassName) {
            return {
                init: function init() { },
                cfg: lazySizesCfg,
                noSupport: true
            };
        }

        var docElem = document.documentElement;
        var supportPicture = window.HTMLPictureElement;
        var _addEventListener = 'addEventListener';
        var _getAttribute = 'getAttribute';
        /**
         * Update to bind to window because 'this' becomes null during SSR
         * builds.
         */

        var addEventListener = window[_addEventListener].bind(window);

        var setTimeout = window.setTimeout;
        var requestAnimationFrame = window.requestAnimationFrame || setTimeout;
        var requestIdleCallback = window.requestIdleCallback;
        var regPicture = /^picture$/i;
        var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];
        var regClassCache = {};
        var forEach = Array.prototype.forEach;

        var hasClass = function hasClass(ele, cls) {
            if (!regClassCache[cls]) {
                regClassCache[cls] = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            }

            return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
        };

        var addClass = function addClass(ele, cls) {
            if (!hasClass(ele, cls)) {
                ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
            }
        };

        var removeClass = function removeClass(ele, cls) {
            var reg;
            if (reg = hasClass(ele, cls)) {
                ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
            }
        };

        var addRemoveLoadEvents = function addRemoveLoadEvents(dom, fn, add) {
            var action = add ? _addEventListener : 'removeEventListener';

            if (add) {
                addRemoveLoadEvents(dom, fn);
            }
            loadEvents.forEach(function (evt) {
                dom[action](evt, fn);
            });
        };

        // 自定义事件
        var triggerEvent = function triggerEvent(elem, name, detail, noBubbles, noCancelable) {
            var event = document.createEvent('Event');

            if (!detail) {
                detail = {};
            }

            detail.instance = lazysizes;
            event.initEvent(name, !noBubbles, !noCancelable);
            event.detail = detail;
            elem.dispatchEvent(event);
            return event;
        };

        var updatePolyfill = function updatePolyfill(el, full) {
            var polyfill;

            if (!supportPicture && (polyfill = window.picturefill || lazySizesCfg.pf)) {
                if (full && full.src && !el[_getAttribute]('srcset')) {
                    el.setAttribute('srcset', full.src);
                }

                polyfill({
                    reevaluate: true,
                    elements: [el]
                });
            } else if (full && full.src) {
                el.src = full.src;
            }
        };

        var getCSS = function getCSS(elem, style) {
            return (getComputedStyle(elem, null) || {})[style];
        };

        var getWidth = function getWidth(elem, parent, width) {
            width = width || elem.offsetWidth;

            while (width < lazySizesCfg.minSize && parent && !elem._lazysizesWidth) {
                width = parent.offsetWidth;
                parent = parent.parentNode;
            }

            return width;
        };

        var rAF = function () {
            var running, waiting;
            var firstFns = [];
            var secondFns = [];
            var fns = firstFns;

            var run = function run() {
                var runFns = fns;
                fns = firstFns.length ? secondFns : firstFns;
                running = true;
                waiting = false;

                while (runFns.length) {
                    runFns.shift()();
                }

                running = false;
            };

            var rafBatch = function rafBatch(fn, queue) {
                if (running && !queue) {
                    fn.apply(this, arguments);
                } else {
                    fns.push(fn);

                    if (!waiting) {
                        waiting = true;
                        (document.hidden ? setTimeout : requestAnimationFrame)(run);
                    }
                }
            };

            rafBatch._lsFlush = run;
            return rafBatch;
        }();

        var rAFIt = function rAFIt(fn, simple) {
            return simple ? function () {
                rAF(fn);
            } : function () {
                var that = this;
                var args = arguments;
                rAF(function () {
                    fn.apply(that, args);
                });
            };
        };

        var throttle = function throttle(fn) {
            var running;
            var lastTime = 0;
            var gDelay = lazySizesCfg.throttleDelay;
            var rICTimeout = lazySizesCfg.ricTimeout;

            var run = function run() {
                running = false;
                lastTime = Date.now();
                fn();
            };

            var idleCallback = requestIdleCallback && rICTimeout > 49 ? function () {
                requestIdleCallback(run, {
                    timeout: rICTimeout
                });

                if (rICTimeout !== lazySizesCfg.ricTimeout) {
                    rICTimeout = lazySizesCfg.ricTimeout;
                }
            } : rAFIt(function () {
                setTimeout(run);
            }, true);
            return function (isPriority) {
                var delay;

                if (isPriority = isPriority === true) {
                    rICTimeout = 33;
                }

                if (running) {
                    return;
                }

                running = true;
                delay = gDelay - (Date.now() - lastTime);

                if (delay < 0) {
                    delay = 0;
                }

                if (isPriority || delay < 9) {
                    idleCallback();
                } else {
                    setTimeout(idleCallback, delay);
                }
            };
        }; //based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html


        var debounce = function debounce(func) {
            var timeout, timestamp;
            var wait = 99;

            var run = function run() {
                timeout = null;
                func();
            };

            var later = function later() {
                var last = Date.now() - timestamp;

                if (last < wait) {
                    setTimeout(later, wait - last);
                } else {
                    (requestIdleCallback || run)(run);
                }
            };

            return function () {
                timestamp = Date.now();

                if (!timeout) {
                    timeout = setTimeout(later, wait);
                }
            };
        };

        var loader = function () {
            var preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;
            var eLvW, elvH, eLtop, eLleft, eLright, eLbottom, isBodyHidden;
            var regImg = /^img$/i;
            var regIframe = /^iframe$/i;
            var supportScroll = 'onscroll' in window && !/(gle|ing)bot/.test(navigator.userAgent);
            var shrinkExpand = 0;
            var currentExpand = 0;
            var isLoading = 0;
            var lowRuns = -1;

            var resetPreloading = function resetPreloading(e) {
                isLoading--;

                if (!e || isLoading < 0 || !e.target) {
                    isLoading = 0;
                }
            };

            var isVisible = function isVisible(elem) {
                if (isBodyHidden == null) {
                    isBodyHidden = getCSS(document.body, 'visibility') == 'hidden';
                }

                return isBodyHidden || !(getCSS(elem.parentNode, 'visibility') == 'hidden' && getCSS(elem, 'visibility') == 'hidden');
            };

            var isNestedVisible = function isNestedVisible(elem, elemExpand) {
                var outerRect;
                var parent = elem;
                var visible = isVisible(elem);
                eLtop -= elemExpand;
                eLbottom += elemExpand;
                eLleft -= elemExpand;
                eLright += elemExpand;

                while (visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem) {
                    visible = (getCSS(parent, 'opacity') || 1) > 0;

                    if (visible && getCSS(parent, 'overflow') != 'visible') {
                        outerRect = parent.getBoundingClientRect();
                        visible = eLright > outerRect.left && eLleft < outerRect.right && eLbottom > outerRect.top - 1 && eLtop < outerRect.bottom + 1;
                    }
                }

                return visible;
            };

            var checkElements = function checkElements() {
                var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal, defaultExpand, preloadExpand, hFac;
                var lazyloadElems = lazysizes.elements;

                if ((loadMode = lazySizesCfg.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)) {
                    i = 0;
                    lowRuns++;

                    for (; i < eLlen; i++) {
                        if (!lazyloadElems[i] || lazyloadElems[i]._lazyRace) {
                            continue;
                        }

                        if (!supportScroll || lazysizes.prematureUnveil && lazysizes.prematureUnveil(lazyloadElems[i])) {
                            unveilElement(lazyloadElems[i]);
                            continue;
                        }

                        if (!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)) {
                            elemExpand = currentExpand;
                        }

                        if (!defaultExpand) {
                            defaultExpand = !lazySizesCfg.expand || lazySizesCfg.expand < 1 ? docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370 : lazySizesCfg.expand;
                            lazysizes._defEx = defaultExpand;
                            preloadExpand = defaultExpand * lazySizesCfg.expFactor;
                            hFac = lazySizesCfg.hFac;
                            isBodyHidden = null;

                            if (currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden) {
                                currentExpand = preloadExpand;
                                lowRuns = 0;
                            } else if (loadMode > 1 && lowRuns > 1 && isLoading < 6) {
                                currentExpand = defaultExpand;
                            } else {
                                currentExpand = shrinkExpand;
                            }
                        }

                        if (beforeExpandVal !== elemExpand) {
                            eLvW = innerWidth + elemExpand * hFac;
                            elvH = innerHeight + elemExpand;
                            elemNegativeExpand = elemExpand * -1;
                            beforeExpandVal = elemExpand;
                        }

                        rect = lazyloadElems[i].getBoundingClientRect();

                        if ((eLbottom = rect.bottom) >= elemNegativeExpand && (eLtop = rect.top) <= elvH && (eLright = rect.right) >= elemNegativeExpand * hFac && (eLleft = rect.left) <= eLvW && (eLbottom || eLright || eLleft || eLtop) && (lazySizesCfg.loadHidden || isVisible(lazyloadElems[i])) && (isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4) || isNestedVisible(lazyloadElems[i], elemExpand))) {
                            unveilElement(lazyloadElems[i]);
                            loadedSomething = true;

                            if (isLoading > 9) {
                                break;
                            }
                        } else if (!loadedSomething && isCompleted && !autoLoadElem && isLoading < 4 && lowRuns < 4 && loadMode > 2 && (preloadElems[0] || lazySizesCfg.preloadAfterLoad) && (preloadElems[0] || !elemExpandVal && (eLbottom || eLright || eLleft || eLtop || lazyloadElems[i][_getAttribute](lazySizesCfg.sizesAttr) != 'auto'))) {
                            autoLoadElem = preloadElems[0] || lazyloadElems[i];
                        }
                    }

                    if (autoLoadElem && !loadedSomething) {
                        unveilElement(autoLoadElem);
                    }
                }
            };

            var throttledCheckElements = throttle(checkElements);

            var switchLoadingClass = function switchLoadingClass(e) {
                var elem = e.target;

                if (elem._lazyCache) {
                    delete elem._lazyCache;
                    return;
                }

                resetPreloading(e);
                addClass(elem, lazySizesCfg.loadedClass);
                removeClass(elem, lazySizesCfg.loadingClass);
                addRemoveLoadEvents(elem, rafSwitchLoadingClass);
                triggerEvent(elem, 'lazyloaded');
            };

            var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);

            var rafSwitchLoadingClass = function rafSwitchLoadingClass(e) {
                rafedSwitchLoadingClass({
                    target: e.target
                });
            };

            var changeIframeSrc = function changeIframeSrc(elem, src) {
                try {
                    elem.contentWindow.location.replace(src);
                } catch (e) {
                    elem.src = src;
                }
            };

            var handleSources = function handleSources(source) {
                var customMedia;

                var sourceSrcset = source[_getAttribute](lazySizesCfg.srcsetAttr);

                if (customMedia = lazySizesCfg.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) {
                    source.setAttribute('media', customMedia);
                }

                if (sourceSrcset) {
                    source.setAttribute('srcset', sourceSrcset);
                }
            };

            var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg) {
                var src, srcset, parent, isPicture, event, firesLoad;

                if (!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented) {
                    if (sizes) {
                        if (isAuto) {
                            addClass(elem, lazySizesCfg.autosizesClass);
                        } else {
                            elem.setAttribute('sizes', sizes);
                        }
                    }

                    srcset = elem[_getAttribute](lazySizesCfg.srcsetAttr);
                    src = elem[_getAttribute](lazySizesCfg.srcAttr);

                    if (isImg) {
                        parent = elem.parentNode;
                        isPicture = parent && regPicture.test(parent.nodeName || '');
                    }

                    firesLoad = detail.firesLoad || 'src' in elem && (srcset || src || isPicture);
                    event = {
                        target: elem
                    };
                    addClass(elem, lazySizesCfg.loadingClass);

                    if (firesLoad) {
                        clearTimeout(resetPreloadingTimer);
                        resetPreloadingTimer = setTimeout(resetPreloading, 2500);
                        addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
                    }

                    if (isPicture) {
                        forEach.call(parent.getElementsByTagName('source'), handleSources);
                    }

                    if (srcset) {
                        elem.setAttribute('srcset', srcset);
                    } else if (src && !isPicture) {
                        if (regIframe.test(elem.nodeName)) {
                            changeIframeSrc(elem, src);
                        } else {
                            elem.src = src;
                        }
                    }

                    if (isImg && (srcset || isPicture)) {
                        updatePolyfill(elem, {
                            src: src
                        });
                    }
                }

                if (elem._lazyRace) {
                    delete elem._lazyRace;
                }

                removeClass(elem, lazySizesCfg.lazyClass);
                rAF(function () {
                    // Part of this can be removed as soon as this fix is older: https://bugs.chromium.org/p/chromium/issues/detail?id=7731 (2015)
                    var isLoaded = elem.complete && elem.naturalWidth > 1;

                    if (!firesLoad || isLoaded) {
                        if (isLoaded) {
                            addClass(elem, 'ls-is-cached');
                        }

                        switchLoadingClass(event);
                        elem._lazyCache = true;
                        setTimeout(function () {
                            if ('_lazyCache' in elem) {
                                delete elem._lazyCache;
                            }
                        }, 9);
                    }

                    if (elem.loading == 'lazy') {
                        isLoading--;
                    }
                }, true);
            });

            var unveilElement = function unveilElement(elem) {
                if (elem._lazyRace) {
                    return;
                }

                var detail;
                var isImg = regImg.test(elem.nodeName); //allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")

                var sizes = isImg && (elem[_getAttribute](lazySizesCfg.sizesAttr) || elem[_getAttribute]('sizes'));

                var isAuto = sizes == 'auto';

                if ((isAuto || !isCompleted) && isImg && (elem[_getAttribute]('src') || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesCfg.errorClass) && hasClass(elem, lazySizesCfg.lazyClass)) {
                    return;
                }

                detail = triggerEvent(elem, 'lazyunveilread').detail;

                if (isAuto) {
                    autoSizer.updateElem(elem, true, elem.offsetWidth);
                }

                elem._lazyRace = true;
                isLoading++;
                lazyUnveil(elem, detail, isAuto, sizes, isImg);
            };

            var afterScroll = debounce(function () {
                lazySizesCfg.loadMode = 3;
                throttledCheckElements();
            });

            var altLoadmodeScrollListner = function altLoadmodeScrollListner() {
                if (lazySizesCfg.loadMode == 3) {
                    lazySizesCfg.loadMode = 2;
                }

                afterScroll();
            };

            var onload = function onload() {
                if (isCompleted) {
                    return;
                }

                if (Date.now() - started < 999) {
                    setTimeout(onload, 999);
                    return;
                }

                isCompleted = true;
                lazySizesCfg.loadMode = 3;
                throttledCheckElements();
                addEventListener('scroll', altLoadmodeScrollListner, true);
            };

            return {
                _: function _() {
                    started = Date.now();
                    lazysizes.elements = document.getElementsByClassName(lazySizesCfg.lazyClass);
                    preloadElems = document.getElementsByClassName(lazySizesCfg.lazyClass + ' ' + lazySizesCfg.preloadClass);
                    addEventListener('scroll', throttledCheckElements, true);
                    addEventListener('resize', throttledCheckElements, true);
                    addEventListener('pageshow', function (e) {
                        if (e.persisted) {
                            var loadingElements = document.querySelectorAll('.' + lazySizesCfg.loadingClass);

                            if (loadingElements.length && loadingElements.forEach) {
                                requestAnimationFrame(function () {
                                    loadingElements.forEach(function (img) {
                                        if (img.complete) {
                                            unveilElement(img);
                                        }
                                    });
                                });
                            }
                        }
                    });

                    if (window.MutationObserver) {
                        new MutationObserver(throttledCheckElements).observe(docElem, {
                            childList: true,
                            subtree: true,
                            attributes: true
                        });
                    } else {
                        docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);

                        docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);

                        setInterval(throttledCheckElements, 999);
                    }

                    addEventListener('hashchange', throttledCheckElements, true); //, 'fullscreenchange'

                    ['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend'].forEach(function (name) {
                        document[_addEventListener](name, throttledCheckElements, true);
                    });

                    if (/d$|^c/.test(document.readyState)) {
                        onload();
                    } else {
                        addEventListener('load', onload);

                        document[_addEventListener]('DOMContentLoaded', throttledCheckElements);

                        setTimeout(onload, 20000);
                    }

                    if (lazysizes.elements.length) {
                        checkElements();

                        rAF._lsFlush();
                    } else {
                        throttledCheckElements();
                    }
                },
                checkElems: throttledCheckElements,
                unveil: unveilElement,
                _aLSL: altLoadmodeScrollListner
            };
        }();

        var autoSizer = function () {
            var autosizesElems;
            var sizeElement = rAFIt(function (elem, parent, event, width) {
                var sources, i, len;
                elem._lazysizesWidth = width;
                width += 'px';
                elem.setAttribute('sizes', width);

                if (regPicture.test(parent.nodeName || '')) {
                    sources = parent.getElementsByTagName('source');

                    for (i = 0, len = sources.length; i < len; i++) {
                        sources[i].setAttribute('sizes', width);
                    }
                }

                if (!event.detail.dataAttr) {
                    updatePolyfill(elem, event.detail);
                }
            });

            var getSizeElement = function getSizeElement(elem, dataAttr, width) {
                var event;
                var parent = elem.parentNode;

                if (parent) {
                    width = getWidth(elem, parent, width);
                    event = triggerEvent(elem, 'lazybeforesizes', {
                        width: width,
                        dataAttr: !!dataAttr
                    });

                    if (!event.defaultPrevented) {
                        width = event.detail.width;

                        if (width && width !== elem._lazysizesWidth) {
                            sizeElement(elem, parent, event, width);
                        }
                    }
                }
            };

            var updateElementsSizes = function updateElementsSizes() {
                var i;
                var len = autosizesElems.length;

                if (len) {
                    i = 0;

                    for (; i < len; i++) {
                        getSizeElement(autosizesElems[i]);
                    }
                }
            };

            var debouncedUpdateElementsSizes = debounce(updateElementsSizes);
            return {
                _: function _() {
                    autosizesElems = document.getElementsByClassName(lazySizesCfg.autosizesClass);
                    addEventListener('resize', debouncedUpdateElementsSizes);
                },
                checkElems: debouncedUpdateElementsSizes,
                updateElem: getSizeElement
            };
        }();

        var init = function init() {
            if (!init.i && document.getElementsByClassName) {
                init.i = true;

                autoSizer._();

                loader._();
            }
        };

        setTimeout(function () {
            if (lazySizesCfg.init) {
                init();
            }
        });
        lazysizes = {
            cfg: lazySizesCfg,
            autoSizer: autoSizer,
            loader: loader,
            init: init,
            uP: updatePolyfill,
            aC: addClass,
            rC: removeClass,
            hC: hasClass,
            fire: triggerEvent,
            gW: getWidth,
            rAF: rAF
        };
        return lazysizes;
    }();

    // 图片尺寸处理
    (function (window, factory) {
        var globalInstall = function globalInstall() {
            factory(window.lazySizes);
            window.removeEventListener('lazyunveilread', globalInstall, true);
        };

        factory = factory.bind(null, window, window.document);
        window.addEventListener('lazyunveilread', globalInstall, true);

    })(window, function (window, document, lazySizes) {
        console.log('2254 --- lazy');
        var config, riasCfg;
        var lazySizesCfg = lazySizes.cfg;
        var replaceTypes = {
            string: 1,
            number: 1
        };
        var regNumber = /^\-*\+*\d+\.*\d*$/;
        var regPicture = /^picture$/i;
        var regWidth = /\s*\{\s*width\s*\}\s*/i;
        var regHeight = /\s*\{\s*height\s*\}\s*/i;
        var regPlaceholder = /\s*\{\s*([a-z0-9]+)\s*\}\s*/ig;
        var regObj = /^\[.*\]|\{.*\}$/;
        var regAllowedSizes = /^(?:auto|\d+(px)?)$/;
        var anchor = document.createElement('a');
        var img = document.createElement('img');
        var buggySizes = 'srcset' in img && !('sizes' in img);
        var supportPicture = !!window.HTMLPictureElement && !buggySizes;

        (function () {
            var prop;

            var noop = function noop() { };

            var riasDefaults = {
                prefix: '',
                postfix: '',
                srcAttr: 'data-src',
                absUrl: false,
                modifyOptions: noop,
                widthmap: {},
                ratio: false,
                traditionalRatio: false,
                aspectratio: false
            };
            config = lazySizes && lazySizes.cfg;

            if (!config.supportsType) {
                config.supportsType = function (type
                    /*, elem*/
                ) {
                    return !type;
                };
            }

            if (!config.rias) {
                config.rias = {};
            }

            riasCfg = config.rias;

            if (!('widths' in riasCfg)) {
                riasCfg.widths = [];

                (function (widths) {
                    var width;
                    var i = 0;

                    while (!width || width < 3000) {
                        i += 5;

                        if (i > 30) {
                            i += 1;
                        }

                        width = 36 * i;
                        widths.push(width);
                    }
                })(riasCfg.widths);
            }

            for (prop in riasDefaults) {
                if (!(prop in riasCfg)) {
                    riasCfg[prop] = riasDefaults[prop];
                }
            }
        })();

        function getElementOptions(elem, src) {
            var attr, parent, setOption, options;
            var elemStyles = window.getComputedStyle(elem);
            parent = elem.parentNode;
            options = {
                isPicture: !!(parent && regPicture.test(parent.nodeName || ''))
            };

            setOption = function setOption(attr, run) {
                var attrVal = elem.getAttribute('data-' + attr);

                if (!attrVal) {
                    // no data- attr, get value from the CSS
                    var styles = elemStyles.getPropertyValue('--ls-' + attr); // at least Safari 9 returns null rather than
                    // an empty string for getPropertyValue causing
                    // .trim() to fail

                    if (styles) {
                        attrVal = styles.trim();
                    }
                }

                if (attrVal) {
                    if (attrVal == 'true') {
                        attrVal = true;
                    } else if (attrVal == 'false') {
                        attrVal = false;
                    } else if (regNumber.test(attrVal)) {
                        attrVal = parseFloat(attrVal);
                    } else if (typeof riasCfg[attr] == 'function') {
                        attrVal = riasCfg[attr](elem, attrVal);
                    } else if (regObj.test(attrVal)) {
                        try {
                            attrVal = JSON.parse(attrVal);
                        } catch (e) { }
                    }

                    options[attr] = attrVal;
                } else if (attr in riasCfg && typeof riasCfg[attr] != 'function') {
                    options[attr] = riasCfg[attr];
                } else if (run && typeof riasCfg[attr] == 'function') {
                    options[attr] = riasCfg[attr](elem, attrVal);
                }
            };

            for (attr in riasCfg) {
                setOption(attr);
            }

            src.replace(regPlaceholder, function (full, match) {
                if (!(match in options)) {
                    setOption(match, true);
                }
            });
            return options;
        }

        function replaceUrlProps(url, options) {
            var candidates = [];

            var replaceFn = function replaceFn(full, match) {
                return replaceTypes[_typeof(options[match])] ? options[match] : full;
            };

            candidates.srcset = [];

            if (options.absUrl) {
                anchor.setAttribute('href', url);
                url = anchor.href;
            }

            url = ((options.prefix || '') + url + (options.postfix || '')).replace(regPlaceholder, replaceFn);
            options.widths.forEach(function (width) {
                var widthAlias = options.widthmap[width] || width;
                var ratio = options.aspectratio || options.ratio;
                var traditionalRatio = !options.aspectratio && riasCfg.traditionalRatio;
                var candidate = {
                    u: url.replace(regWidth, widthAlias).replace(regHeight, ratio ? traditionalRatio ? Math.round(width * ratio) : Math.round(width / ratio) : ''),
                    w: width
                };
                candidates.push(candidate);
                candidates.srcset.push(candidate.c = candidate.u + ' ' + width + 'w');
            });
            return candidates;
        }

        function setSrc(src, opts, elem) {
            var elemW = 0;
            var elemH = 0;
            var sizeElement = elem;

            if (!src) {
                return;
            }

            if (opts.ratio === 'container') {
                // calculate image or parent ratio
                elemW = sizeElement.scrollWidth;
                elemH = sizeElement.scrollHeight;

                while ((!elemW || !elemH) && sizeElement !== document) {
                    sizeElement = sizeElement.parentNode;
                    elemW = sizeElement.scrollWidth;
                    elemH = sizeElement.scrollHeight;
                }

                if (elemW && elemH) {
                    opts.ratio = opts.traditionalRatio ? elemH / elemW : elemW / elemH;
                }
            }

            src = replaceUrlProps(src, opts);
            src.isPicture = opts.isPicture;

            if (buggySizes && elem.nodeName.toUpperCase() == 'IMG') {
                elem.removeAttribute(config.srcsetAttr);
            } else {
                elem.setAttribute(config.srcsetAttr, src.srcset.join(', '));
            }

            Object.defineProperty(elem, '_lazyrias', {
                value: src,
                writable: true
            });
        }

        function createAttrObject(elem, src) {
            var opts = getElementOptions(elem, src);
            riasCfg.modifyOptions.call(elem, {
                target: elem,
                details: opts,
                detail: opts
            });
            lazySizes.fire(elem, 'lazyriasmodifyoptions', opts);
            return opts;
        }

        function getSrc(elem) {
            return elem.getAttribute(elem.getAttribute('data-srcattr') || riasCfg.srcAttr) || elem.getAttribute(config.srcsetAttr) || elem.getAttribute(config.srcAttr) || elem.getAttribute('data-pfsrcset') || '';
        }

        addEventListener('lazybeforesizes', function (e) {
            if (e.detail.instance != lazySizes) {
                return;
            }

            var elem, src, elemOpts, parent, sources, i, len, sourceSrc, sizes, detail, hasPlaceholder, modified, emptyList;
            elem = e.target;

            if (!e.detail.dataAttr || e.defaultPrevented || riasCfg.disabled || !((sizes = elem.getAttribute(config.sizesAttr) || elem.getAttribute('sizes')) && regAllowedSizes.test(sizes))) {
                return;
            }

            src = getSrc(elem);
            elemOpts = createAttrObject(elem, src);
            hasPlaceholder = regWidth.test(elemOpts.prefix) || regWidth.test(elemOpts.postfix);

            if (elemOpts.isPicture && (parent = elem.parentNode)) {
                sources = parent.getElementsByTagName('source');

                for (i = 0, len = sources.length; i < len; i++) {
                    if (hasPlaceholder || regWidth.test(sourceSrc = getSrc(sources[i]))) {
                        setSrc(sourceSrc, elemOpts, sources[i]);
                        modified = true;
                    }
                }
            }

            if (hasPlaceholder || regWidth.test(src)) {
                setSrc(src, elemOpts, elem);
                modified = true;
            } else if (modified) {
                emptyList = [];
                emptyList.srcset = [];
                emptyList.isPicture = true;
                Object.defineProperty(elem, '_lazyrias', {
                    value: emptyList,
                    writable: true
                });
            }

            if (modified) {
                if (supportPicture) {
                    elem.removeAttribute(config.srcAttr);
                } else if (sizes != 'auto') {
                    detail = {
                        width: parseInt(sizes, 10)
                    };
                    polyfill({
                        target: elem,
                        detail: detail
                    });
                }
            }
        }, true); // partial polyfill

        var polyfill = function () {
            var ascendingSort = function ascendingSort(a, b) {
                return a.w - b.w;
            };

            var reduceCandidate = function reduceCandidate(srces) {
                var lowerCandidate, bonusFactor;
                var len = srces.length;
                var candidate = srces[len - 1];
                var i = 0;

                for (i; i < len; i++) {
                    candidate = srces[i];
                    candidate.d = candidate.w / srces.w;

                    if (candidate.d >= srces.d) {
                        if (!candidate.cached && (lowerCandidate = srces[i - 1]) && lowerCandidate.d > srces.d - 0.13 * Math.pow(srces.d, 2.2)) {
                            bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

                            if (lowerCandidate.cached) {
                                lowerCandidate.d += 0.15 * bonusFactor;
                            }

                            if (lowerCandidate.d + (candidate.d - srces.d) * bonusFactor > srces.d) {
                                candidate = lowerCandidate;
                            }
                        }

                        break;
                    }
                }

                return candidate;
            };

            var getWSet = function getWSet(elem, testPicture) {
                var src;

                if (!elem._lazyrias && lazySizes.pWS && (src = lazySizes.pWS(elem.getAttribute(config.srcsetAttr || ''))).length) {
                    Object.defineProperty(elem, '_lazyrias', {
                        value: src,
                        writable: true
                    });

                    if (testPicture && elem.parentNode) {
                        src.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';
                    }
                }

                return elem._lazyrias;
            };

            var getX = function getX(elem) {
                var dpr = window.devicePixelRatio || 1;
                var optimum = lazySizes.getX && lazySizes.getX(elem);
                return Math.min(optimum || dpr, 2.4, dpr);
            };

            var getCandidate = function getCandidate(elem, width) {
                var sources, i, len, media, srces, src;
                srces = elem._lazyrias;

                if (srces.isPicture && window.matchMedia) {
                    for (i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++) {
                        if (getWSet(sources[i]) && !sources[i].getAttribute('type') && (!(media = sources[i].getAttribute('media')) || (matchMedia(media) || {}).matches)) {
                            srces = sources[i]._lazyrias;
                            break;
                        }
                    }
                }

                if (!srces.w || srces.w < width) {
                    srces.w = width;
                    srces.d = getX(elem);
                    src = reduceCandidate(srces.sort(ascendingSort));
                }

                return src;
            };

            var _polyfill = function polyfill(e) {
                if (e.detail.instance != lazySizes) {
                    return;
                }

                var candidate;
                var elem = e.target;

                if (!buggySizes && (window.respimage || window.picturefill || lazySizesCfg.pf)) {
                    document.removeEventListener('lazybeforesizes', _polyfill);
                    return;
                }

                if (!('_lazyrias' in elem) && (!e.detail.dataAttr || !getWSet(elem, true))) {
                    return;
                }

                candidate = getCandidate(elem, e.detail.width);

                if (candidate && candidate.u && elem._lazyrias.cur != candidate.u) {
                    elem._lazyrias.cur = candidate.u;
                    candidate.cached = true;
                    lazySizes.rAF(function () {
                        elem.setAttribute(config.srcAttr, candidate.u);
                        elem.setAttribute('src', candidate.u);
                    });
                }
            };

            if (!supportPicture) {
                addEventListener('lazybeforesizes', _polyfill);
            } else {
                _polyfill = function _polyfill() { };
            }

            return _polyfill;
        }();
    });



    class SectionContainer {
        constructor() {
            this.constructors = [];
            this.instances = [];
            this.attachListeners();
        }

        attachListeners() {
            document.addEventListener('shopify:section:load', this.onSectionLoad.bind(this));
            document.addEventListener('shopify:section:unload', this.onSectionUnload.bind(this));
            document.addEventListener('shopify:section:select', this.onSelect.bind(this));
            document.addEventListener('shopify:section:deselect', this.onDeselect.bind(this));
            document.addEventListener('shopify:section:reorder', this.onReorder.bind(this));
            document.addEventListener('shopify:block:select', this.onBlockSelect.bind(this));
            document.addEventListener('shopify:block:deselect', this.onBlockDeselect.bind(this));
        }
        register(type, constructor) {
            var _this = this;

            this.constructors[type] = constructor;
            document.querySelectorAll("[data-section-type=".concat(type, "]")).forEach(function (container) {
                _this.createInstance(container, constructor);
            });
        }
        findInstance(array, key, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] === value) {
                    return array[i];
                }
            }
        }
        removeInstance(array, key, value) {
            var i = array.length;

            while (i--) {
                if (array[i][key] === value) {
                    array.splice(i, 1);
                    break;
                }
            }

            return array;
        }

        onSectionLoad(event) {
            console.log('event', event)
            var container = event.target.querySelector('[data-section-id]');

            if (container) {
                this.createInstance(container);
            }
        }

        onSectionUnload(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (!instance) {
                return;
            }

            if (typeof instance.onUnload === 'function') {
                instance.onUnload(event);
            }

            this.instances = this.removeInstance(this.instances, 'id', event.detail.sectionId);
        }
        onSelect(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (instance && typeof instance.onSelect === 'function') {
                instance.onSelect(event);
            }
        }

        onDeselect(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (instance && typeof instance.onDeselect === 'function') {
                instance.onDeselect(event);
            }
        }
        onReorder(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (instance && typeof instance.onReorder === 'function') {
                instance.onReorder(event);
            }
        }
        onBlockSelect(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (instance && typeof instance.onBlockSelect === 'function') {
                instance.onBlockSelect(event);
            }
        }
        onBlockDeselect(event) {
            var instance = this.findInstance(this.instances, 'id', event.detail.sectionId);

            if (instance && typeof instance.onBlockDeselect === 'function') {
                instance.onBlockDeselect(event);
            }
        }
        createInstance(container, constructor) {
            var id = container.getAttribute('data-section-id'),
                type = container.getAttribute('data-section-type');
            constructor = constructor || this.constructors[type];

            if (typeof constructor === 'undefined') {
                return;
            }
            try {
                var instance = Object.assign(new constructor(container), {
                    id: id,
                    type: type,
                    container: container
                });
                this.instances.push(instance);
            } catch (exception) {
                console.error('Logged exception (this may happen if you have tried to edit the code without properly adjusting the JavaScript): ' + exception.message);
            }
        }
    }


    class FeaturedCollectionSection {
        constructor(element) {

            this.element = element;
            this.delegateElement = new Delegate(this.element);

            this.options = JSON.parse(this.element.getAttribute('data-section-settings'));

            if (!this.options['stackable']) {
                this.flickityInstance = new Flickity(this.element.querySelector('.product-list'), {
                    watchCSS: true,
                    pageDots: false,
                    prevNextButtons: true,
                    contain: true,
                    resize: false,
                    groupCells: true,
                    cellAlign: 'left',
                    lazyLoad: true,
                    draggable: !window.matchMedia('(-moz-touch-enabled: 0), (hover: hover)').matches
                });

                var lastWidth = window.innerWidth;
                var _this = this
                window.addEventListener('resize', function () {
                    if (window.innerWidth !== lastWidth) {
                        _this.flickityInstance.resize();
                        lastWidth = window.innerWidth;
                    }
                });
            }

            // this.productItemColorSwatch = new ProductItemColorSwatch(this.element);
            this.fixSafari();
            this.attachListeners();
        }

        onUnload() {
            if (!this.options['stackable']) {
                this.flickityInstance.destroy();
            }

            window.removeEventListener('resize', this.fixSafariListener);
            this.delegateElement.off('change');
            this.productItemColorSwatch.destroy();

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        }
        attachListeners() {
            var _this2 = this;

            this.fixSafariListener = this.fixSafari.bind(this);
            window.addEventListener('resize', this.fixSafariListener);
            this.delegateElement.on('click', '[data-action="add-to-cart"]', this.addToCart.bind(this));
            this.delegateElement.on('click', '[data-secondary-action="open-quick-view"]', this.openQuickView.bind(this));

            if (window.ResizeObserver && this.flickityInstance) {
                this.resizeObserver = new ResizeObserver(function () {
                    _this2.flickityInstance.resize();
                });
                this.element.querySelectorAll('.product-item').forEach(function (item) {
                    _this2.resizeObserver.observe(item);
                });
            }
        }

        fixSafari() {
            var userAgent = window.navigator.userAgent.toLowerCase();
            if (userAgent.includes('safari') && (userAgent.includes('version/10.1') || userAgent.includes('version/10.3') || userAgent.includes('version/11.0'))) {
                var isPhone = Responsive.matchesBreakpoint('phone');
                this.element.querySelectorAll('.product-item__image-wrapper .aspect-ratio, .product-item__image-wrapper .placeholder-svg')?.forEach(function (image) {
                    if (isPhone) {
                        image.parentNode.style.height = null;
                    } else {
                        image.parentNode.style.height = "".concat(image.clientHeight, "px");
                    }
                });
            }
        }
        openQuickView(event, target) {
            console.log('enent', event);
            var productUrl = new URL("".concat(window.location.origin).concat(target.getAttribute('data-product-url')));
            // If we are on mobile or tablet, we redirect to product page directly

            if (Responsive.matchesBreakpoint('phone') || Responsive.matchesBreakpoint('tablet')) {
                window.location.href = productUrl.href;
                return false;
            }

            var modal = document.getElementById(target.getAttribute('aria-controls'));
            modal.classList.add('is-loading');
            productUrl.searchParams.set('view', 'quick-view');
            fetch(productUrl.href, {
                credentials: 'same-origin',
                method: 'GET'
            }).then(function (response) {
                response.text().then(function (content) {
                    modal.querySelector('.modal__inner').innerHTML = content;
                    modal.classList.remove('is-loading'); // Register a new section to power the JS

                    var modalProductSection = new ProductSection(modal.querySelector('[data-section-type="product"]')); // We set a listener so we can cleanup on close

                    var doCleanUp = function doCleanUp() {
                        modalProductSection.onUnload();
                        modal.removeEventListener('modal:closed', doCleanUp);
                    };

                    modal.addEventListener('modal:closed', doCleanUp);
                });
            });
        }
        addToCart(event, target) {
            var _this3 = this;

            if (window.theme.cartType === 'page') {
                return; // When using a cart type of page, we just simply redirect to the cart page
            }

            event.preventDefault(); // Prevent form to be submitted

            event.stopPropagation(); // First, we switch the status of the button

            target.setAttribute('disabled', 'disabled');
            document.dispatchEvent(new CustomEvent('theme:loading:start')); // Then we add the product in Ajax

            var formElement = target.closest('form[action*="/cart/add"]');
            fetch("".concat(window.routes.cartAddUrl, ".js"), {
                body: JSON.stringify(Form.serialize(formElement)),
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' // This is needed as currently there is a bug in Shopify that assumes this header

                }
            }).then(function (response) {
                target.removeAttribute('disabled');

                if (response.ok) {
                    // We simply trigger an event so the mini-cart can re-render
                    _this3.element.dispatchEvent(new CustomEvent('product:added', {
                        bubbles: true,
                        detail: {
                            button: target,
                            variant: null,
                            quantity: parseInt(formElement.querySelector('[name="quantity"]').value)
                        }
                    }));
                } else {
                    document.dispatchEvent(new CustomEvent('theme:loading:end'));
                }
            });
            event.preventDefault();
        }

    }


    const sections = new SectionContainer()
    sections.register('featured-collection', FeaturedCollectionSection)
}();