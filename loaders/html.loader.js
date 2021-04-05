const path = require('path');
const fs = require('fs');

const defaults = ["{{", "}}"];

let lwnConfig;
try {
    lwnConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../lwn.config.json")));
} catch(e) {}

const config = Object.assign([], defaults, lwnConfig?.interpolation ?? []);

module.exports = function (source, map) {
    this.callback(null, createTemplateLoader(source), map);
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createTemplateLoader(source) {
    return `
        const initialHTML = "${source.replace(/"/g, '\\"').replace(/\n/g, '')}";
        function evalInContext(code, context) {
            return (new Function("with(this) { return "+code+"; }")).call(context);
        }

        module.exports = { initialHTML, config: ${JSON.stringify(config)} };
    `
}