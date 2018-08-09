/* eslint "require-jsdoc": ["error", {
    "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": false,
        "ClassDeclaration": false,
        "ArrowFunctionExpression": false,
        "FunctionExpression": false
    }
}]*/
/* eslint valid-jsdoc: "error"*/
/* eslint max-len: ["error", { "code": 200 }]*/
/* eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint brace-style: [0,{ "allowSingleLine": true }]*/

// Get all of the images that are marked up to lazy load


registerListener('load', setLazy);
registerListener('load', lazyLoad);
registerListener('scroll', lazyLoad);

let lazy = [];

function setLazy() {
    lazy = document.getElementsByClassName('restaurant-img');
    console.log('Found ' + lazy.length + ' lazy images');
}

function lazyLoad() {
    for(let i=0; i<lazy.length; i++) {
        if(isInViewport(lazy[i])){
            if (lazy[i].getAttribute('data-src')){
                lazy[i].src = lazy[i].getAttribute('data-src');
                lazy[i].removeAttribute('data-src');
            }
        }
    }
    cleanLazy();
}

function cleanLazy() {
    lazy = Array.prototype.filter.call(lazy, function(l){ return l.getAttribute('data-src');});
}

function isInViewport(el) {
    let rect = el.getBoundingClientRect();

    return (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth)
     );
}

function registerListener(event, func) {
    if (window.addEventListener) {
        window.addEventListener(event, func)
    } else {
        window.attachEvent('on' + event, func)
    }
}
