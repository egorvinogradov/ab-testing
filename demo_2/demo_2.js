(function(){

    function ab(){
        /** @constructor */
    };

    ab.prototype.getGroup = function(experimentName, callback){

        // get from server

        if ( experimentName === 'red_button_vs_blue_button' ) {
            callback({
                status: 'OK',
                user: {
                    id: 1,
                    group: 'test'
                }
            });
        }
        else if ( experimentName === 'left_sidebar_vs_right_sidebar' ) {
            callback({
                status: 'OK',
                user: {
                    id: 2,
                    group: 'control'
                }
            });
        }
    };

    ab.prototype.getUserData = function(experimentName){
        var str = localStorage.getItem('ab_' + experimentName);
        var json;
        try {
            json = JSON.parse(str);
        }
        catch (e) {};
        return json || {};
    };

    ab.prototype.setUserData = function(experimentName, experimentData){
        localStorage.setItem('ab_' + experimentName, JSON.stringify(experimentData));
    };

    ab.prototype.saveUserData = function(experimentName, params, callback){
        // send history and group to server
        callback && callback();
    };

    ab.prototype.sendError = function(e){
        console.error(e.message, e);
        // todo: send
    };


    /* lib */

    ab.prototype.extend = function(){
        if ( arguments.length < 2 ) {
            return arguments[0];
        }
        var result = arguments[0];
        this.each(arguments, function(obj){
            for ( var key in obj ) {
                result[key] = obj[key];
            }
        }, this);
        return result;
    };

    ab.prototype.param = function(params){
        var result = [];
        for (var key in params) {
            result.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
        return result.join('&');
    };

    ab.prototype.createEl = function(tagName, attributes){
        var elem = document.createElement(tagName);
        for (var key in attributes) {
            elem[key] = attributes[key];
        }
        return elem;
    };

    ab.prototype.ajax = function(params){
        var id = 'ab-ajax_' + +new Date();
        var scriptEl;
        var onComplete = function(){
            var elem = document.getElementById(id);
            elem.parentNode.removeChild(elem);
            if (window[id]) {
                delete window[id];
            }
        };
        var getUrl = function(url, data){
            return url + ( data ? '?' + this.param(data) : '' );
        };
        window[id] = function (data) {
            if ( params.complete ) {
                params.complete(data);
            }
            else if ( params.success ) {
                params.success(data);
            }
            onComplete();
        };
        scriptEl = this.createEl('script', {
            id: id,
            src: getUrl(params.url, this.extend({
                callback: id
            }, params.data)),
            onerror: function (e) {
                params.error(e);
                onComplete();
            }
        });
        document
            .getElementsByTagName('body')[0]
            .appendChild(scriptEl);
    };

    ab.prototype.log = function(){
        if ( typeof console !== 'undefined' ) {
            Array.prototype.unshift.call(arguments, '[' + new Date() + ']');
            console.log.apply(console, arguments);
        }
    };

    ab.prototype.each = function(arr, func, context){
        if ( !arr || !func ) {
            return;
        }
        if ( Array.prototype.forEach ) {
            Array.prototype.forEach.call(arr, func, context);
        }
        else {
            for ( var i = 0, l = arr.length; i < l; i++ ) {
                func.call(context || window, arr[i], i, arr);
            }
        }
    };

    ab.prototype.filter = function(arr, func, context){
        if ( !arr ) {
            return;
        }
        if ( !func ) {
            return arr;
        }
        if ( Array.prototype.filter ) {
            return Array.prototype.filter.call(arr, func, context);
        }
        else {
            var result;
            for ( var i = 0, l = arr.length; i < l; i++ ) {
                var element = arr[i];
                if ( func.call(context || window, element, i, arr) ) {
                    result.push(element);
                }
            }
            return result;
        }
    };

    ab.prototype.proxy = function(func, context){
        return function(){
            func.apply(context || window, arguments);
        };
    };

    ab.prototype.inArray = function(arr, element){
        if ( arr && element ) {
            return !!this.filter(arr, function(el){
                return el === element;
            }).length;
        }
        return false;
    };

    /* / lib */


    ab.prototype.isGoalAdded = function(target, userData){
        return !!this.inArray(userData.targets, target);
    };

    ab.prototype.isStartedTracking = function(userData){
        return !!( userData.id && userData.group && userData.targets.length );
    };

    ab.prototype.isExperimentFinished = function(experiment, userData){
        var areTargetsEquals = experiment.targets.length === userData.targets.length;
        if ( areTargetsEquals ) {
            for ( var i = 0, l = experiment.targets.length; i < l; i++ ) {
                if ( !this.inArray(userData.targets, experiment.targets[i]) ) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    };

    ab.prototype.goal = function(target){
        if ( !this.experiments ) {
            if ( this.queue && queue.goals ) {
                this.queue.goals.push();
            }
            else {
                this.queue = {
                    goals: [target]
                };
            }
            return;
        };
        this.each(this.experiments, function(experiment){
            var userData = this.getUserData(experiment.name);
            if ( !this.isGoalAdded(target, userData) && experiment.targets[0] === target ) {
                this.startTracking(experiment, this.proxy(function(){
                    this.log('Started tracking:', experiment.name, experiment);
                }, this));
            }
            else if (
                !this.isGoalAdded(target, userData) &&
                this.isStartedTracking(userData) &&
                this.inArray(experiment.targets, target)
            ) {
                userData.targets.push(target);
                this.setUserData(experiment.name, userData);
                this.saveUserData(experiment.name, userData, this.proxy(function(){
                    this.log('Saved user data:', experiment.name, userData, experiment);
                }, this));
                if ( this.isExperimentFinished(experiment, userData) ) {
                    this.log('Experiment is finished:', experiment.name, userData, experiment);
                }
            }
        }, this);
    };

    ab.prototype.getExperiment = function(experimentName){
        return this.filter(this.experiments, function(experiment){
            return experiment.name === experimentName;
        })[0];
    };

    ab.prototype.test = function(experimentName){
        return this.getUserData(experimentName).group === 'test';
    };

    ab.prototype.control = function(experimentName){
        return !this.test(experimentName);
    };

    ab.prototype.write = function(experimentName, params){
        document.write(
            this.control(experimentName)
                ? params.control
                : params.test
        );
    };

    ab.prototype.execute = function(experimentName, params){
        var scriptEl;
        var scriptCode;
        if ( this.control(experimentName) ) {
            if ( params.control ) {
                scriptCode = '(' + params.control.toString() + '(\'' + experimentName + '\', \'control\'))';
            }
        }
        else {
            if ( params.test ) {
                scriptCode = '(' + params.test.toString() + '(\'' + experimentName + '\', \'test\'))';
            }
        }
        scriptEl = this.createEl('script', {
            className: 'ab_execute',
            innerHTML: scriptCode
        });
        document
            .getElementsByTagName('body')[0]
            .appendChild(scriptEl);
    };

    ab.prototype.startTracking = function(experiment, callback){
        this.getGroup(experiment.name, this.proxy(function(data){
            if ( data && data.status === 'OK' ) {
                var userData = {
                    id: data.user.id,
                    group: data.user.group,
                    targets: [experiment.targets[0]]
                };
                this.setUserData(experiment.name, userData);
                this.saveUserData(experiment.name, userData, callback);
            }
            else {
                this.sendError({
                    message: 'Can\'t load get new user group',
                    data: data
                });
            }
        }, this));
    };

    ab.prototype.getExperiments = function(callback){
        // from server
        callback({
            status: 'OK',
            experiments: [
                {
                    name: 'red_button_vs_blue_button',
                    targets: [
                        'index',
                        'catalog',
                        'promo'
                    ]
                },
                {
                    name: 'left_sidebar_vs_right_sidebar',
                    targets: [
                        'hotelpage',
                        'catalog',
                        'payment'
                    ]
                }
            ]
        });
    };

    ab.prototype.initialize = function(){
        this.getExperiments(this.proxy(function(data){
            if ( data && data.status === 'OK' ) {
                this.experiments = data.experiments;
                if ( this.queue && this.queue.goals ) {
                    this.each(this.queue.goals, function(goal){
                        this.goal(goal);
                    }, this);
                }
            }
            else {
                this.sendError({
                    message: 'Can\'t load experiments',
                    data: data
                });
            }
        }, this));
        window.onerror = this.proxy(function(e){
            var params = e.message ? e : {
                message: 'Unknown error',
                data: e
            };
            this.sendError(params);
        }, this);
    };

    window.AB = new ab();
    AB.initialize();

}());




/* remove */

function ii (){
    alert(qqq)
};

var go = function(){

};

var nn = function(){}

var ll = function(a){
    console.log('ll >>', a);
}

var ls = function(){
    return JSON.parse(localStorage.getItem('_ab'));
};


/* / remove */


