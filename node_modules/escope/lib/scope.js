'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ClassScope = exports.ForScope = exports.FunctionScope = exports.SwitchScope = exports.BlockScope = exports.TDZScope = exports.WithScope = exports.CatchScope = exports.FunctionExpressionNameScope = exports.ModuleScope = exports.GlobalScope = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       Redistribution and use in source and binary forms, with or without
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       modification, are permitted provided that the following conditions are met:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         * Redistributions of source code must retain the above copyright
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           notice, this list of conditions and the following disclaimer.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         * Redistributions in binary form must reproduce the above copyright
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           notice, this list of conditions and the following disclaimer in the
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           documentation and/or other materials provided with the distribution.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _estraverse = require('estraverse');

var _reference = require('./reference');

var _reference2 = _interopRequireDefault(_reference);

var _variable = require('./variable');

var _variable2 = _interopRequireDefault(_variable);

var _definition = require('./definition');

var _definition2 = _interopRequireDefault(_definition);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isStrictScope(scope, block, isMethodDefinition, useDirective) {
    var body, i, iz, stmt, expr;

    // When upper scope is exists and strict, inner scope is also strict.
    if (scope.upper && scope.upper.isStrict) {
        return true;
    }

    // ArrowFunctionExpression's scope is always strict scope.
    if (block.type === _estraverse.Syntax.ArrowFunctionExpression) {
        return true;
    }

    if (isMethodDefinition) {
        return true;
    }

    if (scope.type === 'class' || scope.type === 'module') {
        return true;
    }

    if (scope.type === 'block' || scope.type === 'switch') {
        return false;
    }

    if (scope.type === 'function') {
        if (block.type === _estraverse.Syntax.Program) {
            body = block;
        } else {
            body = block.body;
        }
    } else if (scope.type === 'global') {
        body = block;
    } else {
        return false;
    }

    // Search 'use strict' directive.
    if (useDirective) {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== _estraverse.Syntax.DirectiveStatement) {
                break;
            }
            if (stmt.raw === '"use strict"' || stmt.raw === '\'use strict\'') {
                return true;
            }
        }
    } else {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== _estraverse.Syntax.ExpressionStatement) {
                break;
            }
            expr = stmt.expression;
            if (expr.type !== _estraverse.Syntax.Literal || typeof expr.value !== 'string') {
                break;
            }
            if (expr.raw != null) {
                if (expr.raw === '"use strict"' || expr.raw === '\'use strict\'') {
                    return true;
                }
            } else {
                if (expr.value === 'use strict') {
                    return true;
                }
            }
        }
    }
    return false;
}

function registerScope(scopeManager, scope) {
    var scopes;

    scopeManager.scopes.push(scope);

    scopes = scopeManager.__nodeToScope.get(scope.block);
    if (scopes) {
        scopes.push(scope);
    } else {
        scopeManager.__nodeToScope.set(scope.block, [scope]);
    }
}

function shouldBeStatically(def) {
    return def.type === _variable2.default.ClassName || def.type === _variable2.default.Variable && def.parent.kind !== 'var';
}

/**
 * @class Scope
 */

var Scope = function () {
    function Scope(scopeManager, type, upperScope, block, isMethodDefinition) {
        _classCallCheck(this, Scope);

        /**
         * One of 'TDZ', 'module', 'block', 'switch', 'function', 'catch', 'with', 'function', 'class', 'global'.
         * @member {String} Scope#type
         */
        this.type = type;
        /**
        * The scoped {@link Variable}s of this scope, as <code>{ Variable.name
        * : Variable }</code>.
        * @member {Map} Scope#set
        */
        this.set = new Map();
        /**
         * The tainted variables of this scope, as <code>{ Variable.name :
         * boolean }</code>.
         * @member {Map} Scope#taints */
        this.taints = new Map();
        /**
         * Generally, through the lexical scoping of JS you can always know
         * which variable an identifier in the source code refers to. There are
         * a few exceptions to this rule. With 'global' and 'with' scopes you
         * can only decide at runtime which variable a reference refers to.
         * Moreover, if 'eval()' is used in a scope, it might introduce new
         * bindings in this or its parent scopes.
         * All those scopes are considered 'dynamic'.
         * @member {boolean} Scope#dynamic
         */
        this.dynamic = this.type === 'global' || this.type === 'with';
        /**
         * A reference to the scope-defining syntax node.
         * @member {esprima.Node} Scope#block
         */
        this.block = block;
        /**
        * The {@link Reference|references} that are not resolved with this scope.
        * @member {Reference[]} Scope#through
        */
        this.through = [];
        /**
        * The scoped {@link Variable}s of this scope. In the case of a
        * 'function' scope this includes the automatic argument <em>arguments</em> as
        * its first element, as well as all further formal arguments.
        * @member {Variable[]} Scope#variables
        */
        this.variables = [];
        /**
        * Any variable {@link Reference|reference} found in this scope. This
        * includes occurrences of local variables as well as variables from
        * parent scopes (including the global scope). For local variables
        * this also includes defining occurrences (like in a 'var' statement).
        * In a 'function' scope this does not include the occurrences of the
        * formal parameter in the parameter list.
        * @member {Reference[]} Scope#references
        */
        this.references = [];

        /**
        * For 'global' and 'function' scopes, this is a self-reference. For
        * other scope types this is the <em>variableScope</em> value of the
        * parent scope.
        * @member {Scope} Scope#variableScope
        */
        this.variableScope = this.type === 'global' || this.type === 'function' || this.type === 'module' ? this : upperScope.variableScope;
        /**
        * Whether this scope is created by a FunctionExpression.
        * @member {boolean} Scope#functionExpressionScope
        */
        this.functionExpressionScope = false;
        /**
        * Whether this is a scope that contains an 'eval()' invocation.
        * @member {boolean} Scope#directCallToEvalScope
        */
        this.directCallToEvalScope = false;
        /**
        * @member {boolean} Scope#thisFound
        */
        this.thisFound = false;

        this.__left = [];

        /**
        * Reference to the parent {@link Scope|scope}.
        * @member {Scope} Scope#upper
        */
        this.upper = upperScope;
        /**
        * Whether 'use strict' is in effect in this scope.
        * @member {boolean} Scope#isStrict
        */
        this.isStrict = isStrictScope(this, block, isMethodDefinition, scopeManager.__useDirective());

        /**
        * List of nested {@link Scope}s.
        * @member {Scope[]} Scope#childScopes
        */
        this.childScopes = [];
        if (this.upper) {
            this.upper.childScopes.push(this);
        }

        this.__declaredVariables = scopeManager.__declaredVariables;

        registerScope(scopeManager, this);
    }

    _createClass(Scope, [{
        key: '__shouldStaticallyClose',
        value: function __shouldStaticallyClose(scopeManager) {
            return !this.dynamic || scopeManager.__isOptimistic();
        }
    }, {
        key: '__shouldStaticallyCloseForGlobal',
        value: function __shouldStaticallyCloseForGlobal(ref) {
            // On global scope, let/const/class declarations should be resolved statically.
            var name = ref.identifier.name;
            if (!this.set.has(name)) {
                return false;
            }

            var variable = this.set.get(name);
            var defs = variable.defs;
            return defs.length > 0 && defs.every(shouldBeStatically);
        }
    }, {
        key: '__staticCloseRef',
        value: function __staticCloseRef(ref) {
            if (!this.__resolve(ref)) {
                this.__delegateToUpperScope(ref);
            }
        }
    }, {
        key: '__dynamicCloseRef',
        value: function __dynamicCloseRef(ref) {
            // notify all names are through to global
            var current = this;
            do {
                current.through.push(ref);
                current = current.upper;
            } while (current);
        }
    }, {
        key: '__globalCloseRef',
        value: function __globalCloseRef(ref) {
            // let/const/class declarations should be resolved statically.
            // others should be resolved dynamically.
            if (this.__shouldStaticallyCloseForGlobal(ref)) {
                this.__staticCloseRef(ref);
            } else {
                this.__dynamicCloseRef(ref);
            }
        }
    }, {
        key: '__close',
        value: function __close(scopeManager) {
            var closeRef;
            if (this.__shouldStaticallyClose(scopeManager)) {
                closeRef = this.__staticCloseRef;
            } else if (this.type !== 'global') {
                closeRef = this.__dynamicCloseRef;
            } else {
                closeRef = this.__globalCloseRef;
            }

            // Try Resolving all references in this scope.
            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                closeRef.call(this, ref);
            }
            this.__left = null;

            return this.upper;
        }
    }, {
        key: '__resolve',
        value: function __resolve(ref) {
            var variable, name;
            name = ref.identifier.name;
            if (this.set.has(name)) {
                variable = this.set.get(name);
                variable.references.push(ref);
                variable.stack = variable.stack && ref.from.variableScope === this.variableScope;
                if (ref.tainted) {
                    variable.tainted = true;
                    this.taints.set(variable.name, true);
                }
                ref.resolved = variable;
                return true;
            }
            return false;
        }
    }, {
        key: '__delegateToUpperScope',
        value: function __delegateToUpperScope(ref) {
            if (this.upper) {
                this.upper.__left.push(ref);
            }
            this.through.push(ref);
        }
    }, {
        key: '__addDeclaredVariablesOfNode',
        value: function __addDeclaredVariablesOfNode(variable, node) {
            if (node == null) {
                return;
            }

            var variables = this.__declaredVariables.get(node);
            if (variables == null) {
                variables = [];
                this.__declaredVariables.set(node, variables);
            }
            if (variables.indexOf(variable) === -1) {
                variables.push(variable);
            }
        }
    }, {
        key: '__defineGeneric',
        value: function __defineGeneric(name, set, variables, node, def) {
            var variable;

            variable = set.get(name);
            if (!variable) {
                variable = new _variable2.default(name, this);
                set.set(name, variable);
                variables.push(variable);
            }

            if (def) {
                variable.defs.push(def);
                if (def.type !== _variable2.default.TDZ) {
                    this.__addDeclaredVariablesOfNode(variable, def.node);
                    this.__addDeclaredVariablesOfNode(variable, def.parent);
                }
            }
            if (node) {
                variable.identifiers.push(node);
            }
        }
    }, {
        key: '__define',
        value: function __define(node, def) {
            if (node && node.type === _estraverse.Syntax.Identifier) {
                this.__defineGeneric(node.name, this.set, this.variables, node, def);
            }
        }
    }, {
        key: '__referencing',
        value: function __referencing(node, assign, writeExpr, maybeImplicitGlobal, partial, init) {
            // because Array element may be null
            if (!node || node.type !== _estraverse.Syntax.Identifier) {
                return;
            }

            // Specially handle like `this`.
            if (node.name === 'super') {
                return;
            }

            var ref = new _reference2.default(node, this, assign || _reference2.default.READ, writeExpr, maybeImplicitGlobal, !!partial, !!init);
            this.references.push(ref);
            this.__left.push(ref);
        }
    }, {
        key: '__detectEval',
        value: function __detectEval() {
            var current;
            current = this;
            this.directCallToEvalScope = true;
            do {
                current.dynamic = true;
                current = current.upper;
            } while (current);
        }
    }, {
        key: '__detectThis',
        value: function __detectThis() {
            this.thisFound = true;
        }
    }, {
        key: '__isClosed',
        value: function __isClosed() {
            return this.__left === null;
        }

        /**
         * returns resolved {Reference}
         * @method Scope#resolve
         * @param {Esprima.Identifier} ident - identifier to be resolved.
         * @return {Reference}
         */

    }, {
        key: 'resolve',
        value: function resolve(ident) {
            var ref, i, iz;
            (0, _assert2.default)(this.__isClosed(), 'Scope should be closed.');
            (0, _assert2.default)(ident.type === _estraverse.Syntax.Identifier, 'Target should be identifier.');
            for (i = 0, iz = this.references.length; i < iz; ++i) {
                ref = this.references[i];
                if (ref.identifier === ident) {
                    return ref;
                }
            }
            return null;
        }

        /**
         * returns this scope is static
         * @method Scope#isStatic
         * @return {boolean}
         */

    }, {
        key: 'isStatic',
        value: function isStatic() {
            return !this.dynamic;
        }

        /**
         * returns this scope has materialized arguments
         * @method Scope#isArgumentsMaterialized
         * @return {boolean}
         */

    }, {
        key: 'isArgumentsMaterialized',
        value: function isArgumentsMaterialized() {
            return true;
        }

        /**
         * returns this scope has materialized `this` reference
         * @method Scope#isThisMaterialized
         * @return {boolean}
         */

    }, {
        key: 'isThisMaterialized',
        value: function isThisMaterialized() {
            return true;
        }
    }, {
        key: 'isUsedName',
        value: function isUsedName(name) {
            if (this.set.has(name)) {
                return true;
            }
            for (var i = 0, iz = this.through.length; i < iz; ++i) {
                if (this.through[i].identifier.name === name) {
                    return true;
                }
            }
            return false;
        }
    }]);

    return Scope;
}();

exports.default = Scope;

var GlobalScope = exports.GlobalScope = function (_Scope) {
    _inherits(GlobalScope, _Scope);

    function GlobalScope(scopeManager, block) {
        _classCallCheck(this, GlobalScope);

        var _this = _possibleConstructorReturn(this, (GlobalScope.__proto__ || Object.getPrototypeOf(GlobalScope)).call(this, scopeManager, 'global', null, block, false));

        _this.implicit = {
            set: new Map(),
            variables: [],
            /**
            * List of {@link Reference}s that are left to be resolved (i.e. which
            * need to be linked to the variable they refer to).
            * @member {Reference[]} Scope#implicit#left
            */
            left: []
        };
        return _this;
    }

    _createClass(GlobalScope, [{
        key: '__close',
        value: function __close(scopeManager) {
            var implicit = [];
            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                if (ref.__maybeImplicitGlobal && !this.set.has(ref.identifier.name)) {
                    implicit.push(ref.__maybeImplicitGlobal);
                }
            }

            // create an implicit global variable from assignment expression
            for (var _i = 0, _iz = implicit.length; _i < _iz; ++_i) {
                var info = implicit[_i];
                this.__defineImplicit(info.pattern, new _definition2.default(_variable2.default.ImplicitGlobalVariable, info.pattern, info.node, null, null, null));
            }

            this.implicit.left = this.__left;

            return _get(GlobalScope.prototype.__proto__ || Object.getPrototypeOf(GlobalScope.prototype), '__close', this).call(this, scopeManager);
        }
    }, {
        key: '__defineImplicit',
        value: function __defineImplicit(node, def) {
            if (node && node.type === _estraverse.Syntax.Identifier) {
                this.__defineGeneric(node.name, this.implicit.set, this.implicit.variables, node, def);
            }
        }
    }]);

    return GlobalScope;
}(Scope);

var ModuleScope = exports.ModuleScope = function (_Scope2) {
    _inherits(ModuleScope, _Scope2);

    function ModuleScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ModuleScope);

        return _possibleConstructorReturn(this, (ModuleScope.__proto__ || Object.getPrototypeOf(ModuleScope)).call(this, scopeManager, 'module', upperScope, block, false));
    }

    return ModuleScope;
}(Scope);

var FunctionExpressionNameScope = exports.FunctionExpressionNameScope = function (_Scope3) {
    _inherits(FunctionExpressionNameScope, _Scope3);

    function FunctionExpressionNameScope(scopeManager, upperScope, block) {
        _classCallCheck(this, FunctionExpressionNameScope);

        var _this3 = _possibleConstructorReturn(this, (FunctionExpressionNameScope.__proto__ || Object.getPrototypeOf(FunctionExpressionNameScope)).call(this, scopeManager, 'function-expression-name', upperScope, block, false));

        _this3.__define(block.id, new _definition2.default(_variable2.default.FunctionName, block.id, block, null, null, null));
        _this3.functionExpressionScope = true;
        return _this3;
    }

    return FunctionExpressionNameScope;
}(Scope);

var CatchScope = exports.CatchScope = function (_Scope4) {
    _inherits(CatchScope, _Scope4);

    function CatchScope(scopeManager, upperScope, block) {
        _classCallCheck(this, CatchScope);

        return _possibleConstructorReturn(this, (CatchScope.__proto__ || Object.getPrototypeOf(CatchScope)).call(this, scopeManager, 'catch', upperScope, block, false));
    }

    return CatchScope;
}(Scope);

var WithScope = exports.WithScope = function (_Scope5) {
    _inherits(WithScope, _Scope5);

    function WithScope(scopeManager, upperScope, block) {
        _classCallCheck(this, WithScope);

        return _possibleConstructorReturn(this, (WithScope.__proto__ || Object.getPrototypeOf(WithScope)).call(this, scopeManager, 'with', upperScope, block, false));
    }

    _createClass(WithScope, [{
        key: '__close',
        value: function __close(scopeManager) {
            if (this.__shouldStaticallyClose(scopeManager)) {
                return _get(WithScope.prototype.__proto__ || Object.getPrototypeOf(WithScope.prototype), '__close', this).call(this, scopeManager);
            }

            for (var i = 0, iz = this.__left.length; i < iz; ++i) {
                var ref = this.__left[i];
                ref.tainted = true;
                this.__delegateToUpperScope(ref);
            }
            this.__left = null;

            return this.upper;
        }
    }]);

    return WithScope;
}(Scope);

var TDZScope = exports.TDZScope = function (_Scope6) {
    _inherits(TDZScope, _Scope6);

    function TDZScope(scopeManager, upperScope, block) {
        _classCallCheck(this, TDZScope);

        return _possibleConstructorReturn(this, (TDZScope.__proto__ || Object.getPrototypeOf(TDZScope)).call(this, scopeManager, 'TDZ', upperScope, block, false));
    }

    return TDZScope;
}(Scope);

var BlockScope = exports.BlockScope = function (_Scope7) {
    _inherits(BlockScope, _Scope7);

    function BlockScope(scopeManager, upperScope, block) {
        _classCallCheck(this, BlockScope);

        return _possibleConstructorReturn(this, (BlockScope.__proto__ || Object.getPrototypeOf(BlockScope)).call(this, scopeManager, 'block', upperScope, block, false));
    }

    return BlockScope;
}(Scope);

var SwitchScope = exports.SwitchScope = function (_Scope8) {
    _inherits(SwitchScope, _Scope8);

    function SwitchScope(scopeManager, upperScope, block) {
        _classCallCheck(this, SwitchScope);

        return _possibleConstructorReturn(this, (SwitchScope.__proto__ || Object.getPrototypeOf(SwitchScope)).call(this, scopeManager, 'switch', upperScope, block, false));
    }

    return SwitchScope;
}(Scope);

var FunctionScope = exports.FunctionScope = function (_Scope9) {
    _inherits(FunctionScope, _Scope9);

    function FunctionScope(scopeManager, upperScope, block, isMethodDefinition) {
        _classCallCheck(this, FunctionScope);

        // section 9.2.13, FunctionDeclarationInstantiation.
        // NOTE Arrow functions never have an arguments objects.
        var _this9 = _possibleConstructorReturn(this, (FunctionScope.__proto__ || Object.getPrototypeOf(FunctionScope)).call(this, scopeManager, 'function', upperScope, block, isMethodDefinition));

        if (_this9.block.type !== _estraverse.Syntax.ArrowFunctionExpression) {
            _this9.__defineArguments();
        }
        return _this9;
    }

    _createClass(FunctionScope, [{
        key: 'isArgumentsMaterialized',
        value: function isArgumentsMaterialized() {
            // TODO(Constellation)
            // We can more aggressive on this condition like this.
            //
            // function t() {
            //     // arguments of t is always hidden.
            //     function arguments() {
            //     }
            // }
            if (this.block.type === _estraverse.Syntax.ArrowFunctionExpression) {
                return false;
            }

            if (!this.isStatic()) {
                return true;
            }

            var variable = this.set.get('arguments');
            (0, _assert2.default)(variable, 'Always have arguments variable.');
            return variable.tainted || variable.references.length !== 0;
        }
    }, {
        key: 'isThisMaterialized',
        value: function isThisMaterialized() {
            if (!this.isStatic()) {
                return true;
            }
            return this.thisFound;
        }
    }, {
        key: '__defineArguments',
        value: function __defineArguments() {
            this.__defineGeneric('arguments', this.set, this.variables, null, null);
            this.taints.set('arguments', true);
        }
    }]);

    return FunctionScope;
}(Scope);

var ForScope = exports.ForScope = function (_Scope10) {
    _inherits(ForScope, _Scope10);

    function ForScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ForScope);

        return _possibleConstructorReturn(this, (ForScope.__proto__ || Object.getPrototypeOf(ForScope)).call(this, scopeManager, 'for', upperScope, block, false));
    }

    return ForScope;
}(Scope);

var ClassScope = exports.ClassScope = function (_Scope11) {
    _inherits(ClassScope, _Scope11);

    function ClassScope(scopeManager, upperScope, block) {
        _classCallCheck(this, ClassScope);

        return _possibleConstructorReturn(this, (ClassScope.__proto__ || Object.getPrototypeOf(ClassScope)).call(this, scopeManager, 'class', upperScope, block, false));
    }

    return ClassScope;
}(Scope);

/* vim: set sw=4 ts=4 et tw=80 : */
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjb3BlLmpzIl0sIm5hbWVzIjpbImlzU3RyaWN0U2NvcGUiLCJzY29wZSIsImJsb2NrIiwiaXNNZXRob2REZWZpbml0aW9uIiwidXNlRGlyZWN0aXZlIiwiYm9keSIsImkiLCJpeiIsInN0bXQiLCJleHByIiwidXBwZXIiLCJpc1N0cmljdCIsInR5cGUiLCJTeW50YXgiLCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbiIsIlByb2dyYW0iLCJsZW5ndGgiLCJEaXJlY3RpdmVTdGF0ZW1lbnQiLCJyYXciLCJFeHByZXNzaW9uU3RhdGVtZW50IiwiZXhwcmVzc2lvbiIsIkxpdGVyYWwiLCJ2YWx1ZSIsInJlZ2lzdGVyU2NvcGUiLCJzY29wZU1hbmFnZXIiLCJzY29wZXMiLCJwdXNoIiwiX19ub2RlVG9TY29wZSIsImdldCIsInNldCIsInNob3VsZEJlU3RhdGljYWxseSIsImRlZiIsIlZhcmlhYmxlIiwiQ2xhc3NOYW1lIiwicGFyZW50Iiwia2luZCIsIlNjb3BlIiwidXBwZXJTY29wZSIsIk1hcCIsInRhaW50cyIsImR5bmFtaWMiLCJ0aHJvdWdoIiwidmFyaWFibGVzIiwicmVmZXJlbmNlcyIsInZhcmlhYmxlU2NvcGUiLCJmdW5jdGlvbkV4cHJlc3Npb25TY29wZSIsImRpcmVjdENhbGxUb0V2YWxTY29wZSIsInRoaXNGb3VuZCIsIl9fbGVmdCIsIl9fdXNlRGlyZWN0aXZlIiwiY2hpbGRTY29wZXMiLCJfX2RlY2xhcmVkVmFyaWFibGVzIiwiX19pc09wdGltaXN0aWMiLCJyZWYiLCJuYW1lIiwiaWRlbnRpZmllciIsImhhcyIsInZhcmlhYmxlIiwiZGVmcyIsImV2ZXJ5IiwiX19yZXNvbHZlIiwiX19kZWxlZ2F0ZVRvVXBwZXJTY29wZSIsImN1cnJlbnQiLCJfX3Nob3VsZFN0YXRpY2FsbHlDbG9zZUZvckdsb2JhbCIsIl9fc3RhdGljQ2xvc2VSZWYiLCJfX2R5bmFtaWNDbG9zZVJlZiIsImNsb3NlUmVmIiwiX19zaG91bGRTdGF0aWNhbGx5Q2xvc2UiLCJfX2dsb2JhbENsb3NlUmVmIiwiY2FsbCIsInN0YWNrIiwiZnJvbSIsInRhaW50ZWQiLCJyZXNvbHZlZCIsIm5vZGUiLCJpbmRleE9mIiwiVERaIiwiX19hZGREZWNsYXJlZFZhcmlhYmxlc09mTm9kZSIsImlkZW50aWZpZXJzIiwiSWRlbnRpZmllciIsIl9fZGVmaW5lR2VuZXJpYyIsImFzc2lnbiIsIndyaXRlRXhwciIsIm1heWJlSW1wbGljaXRHbG9iYWwiLCJwYXJ0aWFsIiwiaW5pdCIsIlJlZmVyZW5jZSIsIlJFQUQiLCJpZGVudCIsIl9faXNDbG9zZWQiLCJHbG9iYWxTY29wZSIsImltcGxpY2l0IiwibGVmdCIsIl9fbWF5YmVJbXBsaWNpdEdsb2JhbCIsImluZm8iLCJfX2RlZmluZUltcGxpY2l0IiwicGF0dGVybiIsIkRlZmluaXRpb24iLCJJbXBsaWNpdEdsb2JhbFZhcmlhYmxlIiwiTW9kdWxlU2NvcGUiLCJGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUiLCJfX2RlZmluZSIsImlkIiwiRnVuY3Rpb25OYW1lIiwiQ2F0Y2hTY29wZSIsIldpdGhTY29wZSIsIlREWlNjb3BlIiwiQmxvY2tTY29wZSIsIlN3aXRjaFNjb3BlIiwiRnVuY3Rpb25TY29wZSIsIl9fZGVmaW5lQXJndW1lbnRzIiwiaXNTdGF0aWMiLCJGb3JTY29wZSIsIkNsYXNzU2NvcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBRUEsU0FBU0EsYUFBVCxDQUF1QkMsS0FBdkIsRUFBOEJDLEtBQTlCLEVBQXFDQyxrQkFBckMsRUFBeURDLFlBQXpELEVBQXVFO0FBQ25FLFFBQUlDLElBQUosRUFBVUMsQ0FBVixFQUFhQyxFQUFiLEVBQWlCQyxJQUFqQixFQUF1QkMsSUFBdkI7O0FBRUE7QUFDQSxRQUFJUixNQUFNUyxLQUFOLElBQWVULE1BQU1TLEtBQU4sQ0FBWUMsUUFBL0IsRUFBeUM7QUFDckMsZUFBTyxJQUFQO0FBQ0g7O0FBRUQ7QUFDQSxRQUFJVCxNQUFNVSxJQUFOLEtBQWVDLG1CQUFPQyx1QkFBMUIsRUFBbUQ7QUFDL0MsZUFBTyxJQUFQO0FBQ0g7O0FBRUQsUUFBSVgsa0JBQUosRUFBd0I7QUFDcEIsZUFBTyxJQUFQO0FBQ0g7O0FBRUQsUUFBSUYsTUFBTVcsSUFBTixLQUFlLE9BQWYsSUFBMEJYLE1BQU1XLElBQU4sS0FBZSxRQUE3QyxFQUF1RDtBQUNuRCxlQUFPLElBQVA7QUFDSDs7QUFFRCxRQUFJWCxNQUFNVyxJQUFOLEtBQWUsT0FBZixJQUEwQlgsTUFBTVcsSUFBTixLQUFlLFFBQTdDLEVBQXVEO0FBQ25ELGVBQU8sS0FBUDtBQUNIOztBQUVELFFBQUlYLE1BQU1XLElBQU4sS0FBZSxVQUFuQixFQUErQjtBQUMzQixZQUFJVixNQUFNVSxJQUFOLEtBQWVDLG1CQUFPRSxPQUExQixFQUFtQztBQUMvQlYsbUJBQU9ILEtBQVA7QUFDSCxTQUZELE1BRU87QUFDSEcsbUJBQU9ILE1BQU1HLElBQWI7QUFDSDtBQUNKLEtBTkQsTUFNTyxJQUFJSixNQUFNVyxJQUFOLEtBQWUsUUFBbkIsRUFBNkI7QUFDaENQLGVBQU9ILEtBQVA7QUFDSCxLQUZNLE1BRUE7QUFDSCxlQUFPLEtBQVA7QUFDSDs7QUFFRDtBQUNBLFFBQUlFLFlBQUosRUFBa0I7QUFDZCxhQUFLRSxJQUFJLENBQUosRUFBT0MsS0FBS0YsS0FBS0EsSUFBTCxDQUFVVyxNQUEzQixFQUFtQ1YsSUFBSUMsRUFBdkMsRUFBMkMsRUFBRUQsQ0FBN0MsRUFBZ0Q7QUFDNUNFLG1CQUFPSCxLQUFLQSxJQUFMLENBQVVDLENBQVYsQ0FBUDtBQUNBLGdCQUFJRSxLQUFLSSxJQUFMLEtBQWNDLG1CQUFPSSxrQkFBekIsRUFBNkM7QUFDekM7QUFDSDtBQUNELGdCQUFJVCxLQUFLVSxHQUFMLEtBQWEsY0FBYixJQUErQlYsS0FBS1UsR0FBTCxLQUFhLGdCQUFoRCxFQUFrRTtBQUM5RCx1QkFBTyxJQUFQO0FBQ0g7QUFDSjtBQUNKLEtBVkQsTUFVTztBQUNILGFBQUtaLElBQUksQ0FBSixFQUFPQyxLQUFLRixLQUFLQSxJQUFMLENBQVVXLE1BQTNCLEVBQW1DVixJQUFJQyxFQUF2QyxFQUEyQyxFQUFFRCxDQUE3QyxFQUFnRDtBQUM1Q0UsbUJBQU9ILEtBQUtBLElBQUwsQ0FBVUMsQ0FBVixDQUFQO0FBQ0EsZ0JBQUlFLEtBQUtJLElBQUwsS0FBY0MsbUJBQU9NLG1CQUF6QixFQUE4QztBQUMxQztBQUNIO0FBQ0RWLG1CQUFPRCxLQUFLWSxVQUFaO0FBQ0EsZ0JBQUlYLEtBQUtHLElBQUwsS0FBY0MsbUJBQU9RLE9BQXJCLElBQWdDLE9BQU9aLEtBQUthLEtBQVosS0FBc0IsUUFBMUQsRUFBb0U7QUFDaEU7QUFDSDtBQUNELGdCQUFJYixLQUFLUyxHQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDbEIsb0JBQUlULEtBQUtTLEdBQUwsS0FBYSxjQUFiLElBQStCVCxLQUFLUyxHQUFMLEtBQWEsZ0JBQWhELEVBQWtFO0FBQzlELDJCQUFPLElBQVA7QUFDSDtBQUNKLGFBSkQsTUFJTztBQUNILG9CQUFJVCxLQUFLYSxLQUFMLEtBQWUsWUFBbkIsRUFBaUM7QUFDN0IsMkJBQU8sSUFBUDtBQUNIO0FBQ0o7QUFDSjtBQUNKO0FBQ0QsV0FBTyxLQUFQO0FBQ0g7O0FBRUQsU0FBU0MsYUFBVCxDQUF1QkMsWUFBdkIsRUFBcUN2QixLQUFyQyxFQUE0QztBQUN4QyxRQUFJd0IsTUFBSjs7QUFFQUQsaUJBQWFDLE1BQWIsQ0FBb0JDLElBQXBCLENBQXlCekIsS0FBekI7O0FBRUF3QixhQUFTRCxhQUFhRyxhQUFiLENBQTJCQyxHQUEzQixDQUErQjNCLE1BQU1DLEtBQXJDLENBQVQ7QUFDQSxRQUFJdUIsTUFBSixFQUFZO0FBQ1JBLGVBQU9DLElBQVAsQ0FBWXpCLEtBQVo7QUFDSCxLQUZELE1BRU87QUFDSHVCLHFCQUFhRyxhQUFiLENBQTJCRSxHQUEzQixDQUErQjVCLE1BQU1DLEtBQXJDLEVBQTRDLENBQUVELEtBQUYsQ0FBNUM7QUFDSDtBQUNKOztBQUVELFNBQVM2QixrQkFBVCxDQUE0QkMsR0FBNUIsRUFBaUM7QUFDN0IsV0FDS0EsSUFBSW5CLElBQUosS0FBYW9CLG1CQUFTQyxTQUF2QixJQUNDRixJQUFJbkIsSUFBSixLQUFhb0IsbUJBQVNBLFFBQXRCLElBQWtDRCxJQUFJRyxNQUFKLENBQVdDLElBQVgsS0FBb0IsS0FGM0Q7QUFJSDs7QUFFRDs7OztJQUdxQkMsSztBQUNqQixtQkFBWVosWUFBWixFQUEwQlosSUFBMUIsRUFBZ0N5QixVQUFoQyxFQUE0Q25DLEtBQTVDLEVBQW1EQyxrQkFBbkQsRUFBdUU7QUFBQTs7QUFDbkU7Ozs7QUFJQSxhQUFLUyxJQUFMLEdBQVlBLElBQVo7QUFDQzs7Ozs7QUFLRCxhQUFLaUIsR0FBTCxHQUFXLElBQUlTLEdBQUosRUFBWDtBQUNBOzs7O0FBSUEsYUFBS0MsTUFBTCxHQUFjLElBQUlELEdBQUosRUFBZDtBQUNBOzs7Ozs7Ozs7O0FBVUEsYUFBS0UsT0FBTCxHQUFlLEtBQUs1QixJQUFMLEtBQWMsUUFBZCxJQUEwQixLQUFLQSxJQUFMLEtBQWMsTUFBdkQ7QUFDQTs7OztBQUlBLGFBQUtWLEtBQUwsR0FBYUEsS0FBYjtBQUNDOzs7O0FBSUQsYUFBS3VDLE9BQUwsR0FBZSxFQUFmO0FBQ0M7Ozs7OztBQU1ELGFBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQzs7Ozs7Ozs7O0FBU0QsYUFBS0MsVUFBTCxHQUFrQixFQUFsQjs7QUFFQzs7Ozs7O0FBTUQsYUFBS0MsYUFBTCxHQUNLLEtBQUtoQyxJQUFMLEtBQWMsUUFBZCxJQUEwQixLQUFLQSxJQUFMLEtBQWMsVUFBeEMsSUFBc0QsS0FBS0EsSUFBTCxLQUFjLFFBQXJFLEdBQWlGLElBQWpGLEdBQXdGeUIsV0FBV08sYUFEdkc7QUFFQzs7OztBQUlELGFBQUtDLHVCQUFMLEdBQStCLEtBQS9CO0FBQ0M7Ozs7QUFJRCxhQUFLQyxxQkFBTCxHQUE2QixLQUE3QjtBQUNDOzs7QUFHRCxhQUFLQyxTQUFMLEdBQWlCLEtBQWpCOztBQUVBLGFBQUtDLE1BQUwsR0FBYyxFQUFkOztBQUVDOzs7O0FBSUQsYUFBS3RDLEtBQUwsR0FBYTJCLFVBQWI7QUFDQzs7OztBQUlELGFBQUsxQixRQUFMLEdBQWdCWCxjQUFjLElBQWQsRUFBb0JFLEtBQXBCLEVBQTJCQyxrQkFBM0IsRUFBK0NxQixhQUFheUIsY0FBYixFQUEvQyxDQUFoQjs7QUFFQzs7OztBQUlELGFBQUtDLFdBQUwsR0FBbUIsRUFBbkI7QUFDQSxZQUFJLEtBQUt4QyxLQUFULEVBQWdCO0FBQ1osaUJBQUtBLEtBQUwsQ0FBV3dDLFdBQVgsQ0FBdUJ4QixJQUF2QixDQUE0QixJQUE1QjtBQUNIOztBQUVELGFBQUt5QixtQkFBTCxHQUEyQjNCLGFBQWEyQixtQkFBeEM7O0FBRUE1QixzQkFBY0MsWUFBZCxFQUE0QixJQUE1QjtBQUNIOzs7O2dEQUV1QkEsWSxFQUFjO0FBQ2xDLG1CQUFRLENBQUMsS0FBS2dCLE9BQU4sSUFBaUJoQixhQUFhNEIsY0FBYixFQUF6QjtBQUNIOzs7eURBRWdDQyxHLEVBQUs7QUFDbEM7QUFDQSxnQkFBSUMsT0FBT0QsSUFBSUUsVUFBSixDQUFlRCxJQUExQjtBQUNBLGdCQUFJLENBQUMsS0FBS3pCLEdBQUwsQ0FBUzJCLEdBQVQsQ0FBYUYsSUFBYixDQUFMLEVBQXlCO0FBQ3JCLHVCQUFPLEtBQVA7QUFDSDs7QUFFRCxnQkFBSUcsV0FBVyxLQUFLNUIsR0FBTCxDQUFTRCxHQUFULENBQWEwQixJQUFiLENBQWY7QUFDQSxnQkFBSUksT0FBT0QsU0FBU0MsSUFBcEI7QUFDQSxtQkFBT0EsS0FBSzFDLE1BQUwsR0FBYyxDQUFkLElBQW1CMEMsS0FBS0MsS0FBTCxDQUFXN0Isa0JBQVgsQ0FBMUI7QUFDSDs7O3lDQUVnQnVCLEcsRUFBSztBQUNsQixnQkFBSSxDQUFDLEtBQUtPLFNBQUwsQ0FBZVAsR0FBZixDQUFMLEVBQTBCO0FBQ3RCLHFCQUFLUSxzQkFBTCxDQUE0QlIsR0FBNUI7QUFDSDtBQUNKOzs7MENBRWlCQSxHLEVBQUs7QUFDbkI7QUFDQSxnQkFBSVMsVUFBVSxJQUFkO0FBQ0EsZUFBRztBQUNDQSx3QkFBUXJCLE9BQVIsQ0FBZ0JmLElBQWhCLENBQXFCMkIsR0FBckI7QUFDQVMsMEJBQVVBLFFBQVFwRCxLQUFsQjtBQUNILGFBSEQsUUFHU29ELE9BSFQ7QUFJSDs7O3lDQUVnQlQsRyxFQUFLO0FBQ2xCO0FBQ0E7QUFDQSxnQkFBSSxLQUFLVSxnQ0FBTCxDQUFzQ1YsR0FBdEMsQ0FBSixFQUFnRDtBQUM1QyxxQkFBS1csZ0JBQUwsQ0FBc0JYLEdBQXRCO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUtZLGlCQUFMLENBQXVCWixHQUF2QjtBQUNIO0FBQ0o7OztnQ0FFTzdCLFksRUFBYztBQUNsQixnQkFBSTBDLFFBQUo7QUFDQSxnQkFBSSxLQUFLQyx1QkFBTCxDQUE2QjNDLFlBQTdCLENBQUosRUFBZ0Q7QUFDNUMwQywyQkFBVyxLQUFLRixnQkFBaEI7QUFDSCxhQUZELE1BRU8sSUFBSSxLQUFLcEQsSUFBTCxLQUFjLFFBQWxCLEVBQTRCO0FBQy9Cc0QsMkJBQVcsS0FBS0QsaUJBQWhCO0FBQ0gsYUFGTSxNQUVBO0FBQ0hDLDJCQUFXLEtBQUtFLGdCQUFoQjtBQUNIOztBQUVEO0FBQ0EsaUJBQUssSUFBSTlELElBQUksQ0FBUixFQUFXQyxLQUFLLEtBQUt5QyxNQUFMLENBQVloQyxNQUFqQyxFQUF5Q1YsSUFBSUMsRUFBN0MsRUFBaUQsRUFBRUQsQ0FBbkQsRUFBc0Q7QUFDbEQsb0JBQUkrQyxNQUFNLEtBQUtMLE1BQUwsQ0FBWTFDLENBQVosQ0FBVjtBQUNBNEQseUJBQVNHLElBQVQsQ0FBYyxJQUFkLEVBQW9CaEIsR0FBcEI7QUFDSDtBQUNELGlCQUFLTCxNQUFMLEdBQWMsSUFBZDs7QUFFQSxtQkFBTyxLQUFLdEMsS0FBWjtBQUNIOzs7a0NBRVMyQyxHLEVBQUs7QUFDWCxnQkFBSUksUUFBSixFQUFjSCxJQUFkO0FBQ0FBLG1CQUFPRCxJQUFJRSxVQUFKLENBQWVELElBQXRCO0FBQ0EsZ0JBQUksS0FBS3pCLEdBQUwsQ0FBUzJCLEdBQVQsQ0FBYUYsSUFBYixDQUFKLEVBQXdCO0FBQ3BCRywyQkFBVyxLQUFLNUIsR0FBTCxDQUFTRCxHQUFULENBQWEwQixJQUFiLENBQVg7QUFDQUcseUJBQVNkLFVBQVQsQ0FBb0JqQixJQUFwQixDQUF5QjJCLEdBQXpCO0FBQ0FJLHlCQUFTYSxLQUFULEdBQWlCYixTQUFTYSxLQUFULElBQWtCakIsSUFBSWtCLElBQUosQ0FBUzNCLGFBQVQsS0FBMkIsS0FBS0EsYUFBbkU7QUFDQSxvQkFBSVMsSUFBSW1CLE9BQVIsRUFBaUI7QUFDYmYsNkJBQVNlLE9BQVQsR0FBbUIsSUFBbkI7QUFDQSx5QkFBS2pDLE1BQUwsQ0FBWVYsR0FBWixDQUFnQjRCLFNBQVNILElBQXpCLEVBQStCLElBQS9CO0FBQ0g7QUFDREQsb0JBQUlvQixRQUFKLEdBQWVoQixRQUFmO0FBQ0EsdUJBQU8sSUFBUDtBQUNIO0FBQ0QsbUJBQU8sS0FBUDtBQUNIOzs7K0NBRXNCSixHLEVBQUs7QUFDeEIsZ0JBQUksS0FBSzNDLEtBQVQsRUFBZ0I7QUFDWixxQkFBS0EsS0FBTCxDQUFXc0MsTUFBWCxDQUFrQnRCLElBQWxCLENBQXVCMkIsR0FBdkI7QUFDSDtBQUNELGlCQUFLWixPQUFMLENBQWFmLElBQWIsQ0FBa0IyQixHQUFsQjtBQUNIOzs7cURBRTRCSSxRLEVBQVVpQixJLEVBQU07QUFDekMsZ0JBQUlBLFFBQVEsSUFBWixFQUFrQjtBQUNkO0FBQ0g7O0FBRUQsZ0JBQUloQyxZQUFZLEtBQUtTLG1CQUFMLENBQXlCdkIsR0FBekIsQ0FBNkI4QyxJQUE3QixDQUFoQjtBQUNBLGdCQUFJaEMsYUFBYSxJQUFqQixFQUF1QjtBQUNuQkEsNEJBQVksRUFBWjtBQUNBLHFCQUFLUyxtQkFBTCxDQUF5QnRCLEdBQXpCLENBQTZCNkMsSUFBN0IsRUFBbUNoQyxTQUFuQztBQUNIO0FBQ0QsZ0JBQUlBLFVBQVVpQyxPQUFWLENBQWtCbEIsUUFBbEIsTUFBZ0MsQ0FBQyxDQUFyQyxFQUF3QztBQUNwQ2YsMEJBQVVoQixJQUFWLENBQWUrQixRQUFmO0FBQ0g7QUFDSjs7O3dDQUVlSCxJLEVBQU16QixHLEVBQUthLFMsRUFBV2dDLEksRUFBTTNDLEcsRUFBSztBQUM3QyxnQkFBSTBCLFFBQUo7O0FBRUFBLHVCQUFXNUIsSUFBSUQsR0FBSixDQUFRMEIsSUFBUixDQUFYO0FBQ0EsZ0JBQUksQ0FBQ0csUUFBTCxFQUFlO0FBQ1hBLDJCQUFXLElBQUl6QixrQkFBSixDQUFhc0IsSUFBYixFQUFtQixJQUFuQixDQUFYO0FBQ0F6QixvQkFBSUEsR0FBSixDQUFReUIsSUFBUixFQUFjRyxRQUFkO0FBQ0FmLDBCQUFVaEIsSUFBVixDQUFlK0IsUUFBZjtBQUNIOztBQUVELGdCQUFJMUIsR0FBSixFQUFTO0FBQ0wwQix5QkFBU0MsSUFBVCxDQUFjaEMsSUFBZCxDQUFtQkssR0FBbkI7QUFDQSxvQkFBSUEsSUFBSW5CLElBQUosS0FBYW9CLG1CQUFTNEMsR0FBMUIsRUFBK0I7QUFDM0IseUJBQUtDLDRCQUFMLENBQWtDcEIsUUFBbEMsRUFBNEMxQixJQUFJMkMsSUFBaEQ7QUFDQSx5QkFBS0csNEJBQUwsQ0FBa0NwQixRQUFsQyxFQUE0QzFCLElBQUlHLE1BQWhEO0FBQ0g7QUFDSjtBQUNELGdCQUFJd0MsSUFBSixFQUFVO0FBQ05qQix5QkFBU3FCLFdBQVQsQ0FBcUJwRCxJQUFyQixDQUEwQmdELElBQTFCO0FBQ0g7QUFDSjs7O2lDQUVRQSxJLEVBQU0zQyxHLEVBQUs7QUFDaEIsZ0JBQUkyQyxRQUFRQSxLQUFLOUQsSUFBTCxLQUFjQyxtQkFBT2tFLFVBQWpDLEVBQTZDO0FBQ3pDLHFCQUFLQyxlQUFMLENBQ1FOLEtBQUtwQixJQURiLEVBRVEsS0FBS3pCLEdBRmIsRUFHUSxLQUFLYSxTQUhiLEVBSVFnQyxJQUpSLEVBS1EzQyxHQUxSO0FBTUg7QUFDSjs7O3NDQUVhMkMsSSxFQUFNTyxNLEVBQVFDLFMsRUFBV0MsbUIsRUFBcUJDLE8sRUFBU0MsSSxFQUFNO0FBQ3ZFO0FBQ0EsZ0JBQUksQ0FBQ1gsSUFBRCxJQUFTQSxLQUFLOUQsSUFBTCxLQUFjQyxtQkFBT2tFLFVBQWxDLEVBQThDO0FBQzFDO0FBQ0g7O0FBRUQ7QUFDQSxnQkFBSUwsS0FBS3BCLElBQUwsS0FBYyxPQUFsQixFQUEyQjtBQUN2QjtBQUNIOztBQUVELGdCQUFJRCxNQUFNLElBQUlpQyxtQkFBSixDQUFjWixJQUFkLEVBQW9CLElBQXBCLEVBQTBCTyxVQUFVSyxvQkFBVUMsSUFBOUMsRUFBb0RMLFNBQXBELEVBQStEQyxtQkFBL0QsRUFBb0YsQ0FBQyxDQUFDQyxPQUF0RixFQUErRixDQUFDLENBQUNDLElBQWpHLENBQVY7QUFDQSxpQkFBSzFDLFVBQUwsQ0FBZ0JqQixJQUFoQixDQUFxQjJCLEdBQXJCO0FBQ0EsaUJBQUtMLE1BQUwsQ0FBWXRCLElBQVosQ0FBaUIyQixHQUFqQjtBQUNIOzs7dUNBRWM7QUFDWCxnQkFBSVMsT0FBSjtBQUNBQSxzQkFBVSxJQUFWO0FBQ0EsaUJBQUtoQixxQkFBTCxHQUE2QixJQUE3QjtBQUNBLGVBQUc7QUFDQ2dCLHdCQUFRdEIsT0FBUixHQUFrQixJQUFsQjtBQUNBc0IsMEJBQVVBLFFBQVFwRCxLQUFsQjtBQUNILGFBSEQsUUFHU29ELE9BSFQ7QUFJSDs7O3VDQUVjO0FBQ1gsaUJBQUtmLFNBQUwsR0FBaUIsSUFBakI7QUFDSDs7O3FDQUVZO0FBQ1QsbUJBQU8sS0FBS0MsTUFBTCxLQUFnQixJQUF2QjtBQUNIOztBQUVEOzs7Ozs7Ozs7Z0NBTVF3QyxLLEVBQU87QUFDWCxnQkFBSW5DLEdBQUosRUFBUy9DLENBQVQsRUFBWUMsRUFBWjtBQUNBLGtDQUFPLEtBQUtrRixVQUFMLEVBQVAsRUFBMEIseUJBQTFCO0FBQ0Esa0NBQU9ELE1BQU01RSxJQUFOLEtBQWVDLG1CQUFPa0UsVUFBN0IsRUFBeUMsOEJBQXpDO0FBQ0EsaUJBQUt6RSxJQUFJLENBQUosRUFBT0MsS0FBSyxLQUFLb0MsVUFBTCxDQUFnQjNCLE1BQWpDLEVBQXlDVixJQUFJQyxFQUE3QyxFQUFpRCxFQUFFRCxDQUFuRCxFQUFzRDtBQUNsRCtDLHNCQUFNLEtBQUtWLFVBQUwsQ0FBZ0JyQyxDQUFoQixDQUFOO0FBQ0Esb0JBQUkrQyxJQUFJRSxVQUFKLEtBQW1CaUMsS0FBdkIsRUFBOEI7QUFDMUIsMkJBQU9uQyxHQUFQO0FBQ0g7QUFDSjtBQUNELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7bUNBS1c7QUFDUCxtQkFBTyxDQUFDLEtBQUtiLE9BQWI7QUFDSDs7QUFFRDs7Ozs7Ozs7a0RBSzBCO0FBQ3RCLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NkNBS3FCO0FBQ2pCLG1CQUFPLElBQVA7QUFDSDs7O21DQUVVYyxJLEVBQU07QUFDYixnQkFBSSxLQUFLekIsR0FBTCxDQUFTMkIsR0FBVCxDQUFhRixJQUFiLENBQUosRUFBd0I7QUFDcEIsdUJBQU8sSUFBUDtBQUNIO0FBQ0QsaUJBQUssSUFBSWhELElBQUksQ0FBUixFQUFXQyxLQUFLLEtBQUtrQyxPQUFMLENBQWF6QixNQUFsQyxFQUEwQ1YsSUFBSUMsRUFBOUMsRUFBa0QsRUFBRUQsQ0FBcEQsRUFBdUQ7QUFDbkQsb0JBQUksS0FBS21DLE9BQUwsQ0FBYW5DLENBQWIsRUFBZ0JpRCxVQUFoQixDQUEyQkQsSUFBM0IsS0FBb0NBLElBQXhDLEVBQThDO0FBQzFDLDJCQUFPLElBQVA7QUFDSDtBQUNKO0FBQ0QsbUJBQU8sS0FBUDtBQUNIOzs7Ozs7a0JBMVVnQmxCLEs7O0lBNlVSc0QsVyxXQUFBQSxXOzs7QUFDVCx5QkFBWWxFLFlBQVosRUFBMEJ0QixLQUExQixFQUFpQztBQUFBOztBQUFBLDhIQUN2QnNCLFlBRHVCLEVBQ1QsUUFEUyxFQUNDLElBREQsRUFDT3RCLEtBRFAsRUFDYyxLQURkOztBQUU3QixjQUFLeUYsUUFBTCxHQUFnQjtBQUNaOUQsaUJBQUssSUFBSVMsR0FBSixFQURPO0FBRVpJLHVCQUFXLEVBRkM7QUFHWjs7Ozs7QUFLQWtELGtCQUFNO0FBUk0sU0FBaEI7QUFGNkI7QUFZaEM7Ozs7Z0NBRU9wRSxZLEVBQWM7QUFDbEIsZ0JBQUltRSxXQUFXLEVBQWY7QUFDQSxpQkFBSyxJQUFJckYsSUFBSSxDQUFSLEVBQVdDLEtBQUssS0FBS3lDLE1BQUwsQ0FBWWhDLE1BQWpDLEVBQXlDVixJQUFJQyxFQUE3QyxFQUFpRCxFQUFFRCxDQUFuRCxFQUFzRDtBQUNsRCxvQkFBSStDLE1BQU0sS0FBS0wsTUFBTCxDQUFZMUMsQ0FBWixDQUFWO0FBQ0Esb0JBQUkrQyxJQUFJd0MscUJBQUosSUFBNkIsQ0FBQyxLQUFLaEUsR0FBTCxDQUFTMkIsR0FBVCxDQUFhSCxJQUFJRSxVQUFKLENBQWVELElBQTVCLENBQWxDLEVBQXFFO0FBQ2pFcUMsNkJBQVNqRSxJQUFULENBQWMyQixJQUFJd0MscUJBQWxCO0FBQ0g7QUFDSjs7QUFFRDtBQUNBLGlCQUFLLElBQUl2RixLQUFJLENBQVIsRUFBV0MsTUFBS29GLFNBQVMzRSxNQUE5QixFQUFzQ1YsS0FBSUMsR0FBMUMsRUFBOEMsRUFBRUQsRUFBaEQsRUFBbUQ7QUFDL0Msb0JBQUl3RixPQUFPSCxTQUFTckYsRUFBVCxDQUFYO0FBQ0EscUJBQUt5RixnQkFBTCxDQUFzQkQsS0FBS0UsT0FBM0IsRUFDUSxJQUFJQyxvQkFBSixDQUNJakUsbUJBQVNrRSxzQkFEYixFQUVJSixLQUFLRSxPQUZULEVBR0lGLEtBQUtwQixJQUhULEVBSUksSUFKSixFQUtJLElBTEosRUFNSSxJQU5KLENBRFI7QUFVSDs7QUFFRCxpQkFBS2lCLFFBQUwsQ0FBY0MsSUFBZCxHQUFxQixLQUFLNUMsTUFBMUI7O0FBRUEscUlBQXFCeEIsWUFBckI7QUFDSDs7O3lDQUVnQmtELEksRUFBTTNDLEcsRUFBSztBQUN4QixnQkFBSTJDLFFBQVFBLEtBQUs5RCxJQUFMLEtBQWNDLG1CQUFPa0UsVUFBakMsRUFBNkM7QUFDekMscUJBQUtDLGVBQUwsQ0FDUU4sS0FBS3BCLElBRGIsRUFFUSxLQUFLcUMsUUFBTCxDQUFjOUQsR0FGdEIsRUFHUSxLQUFLOEQsUUFBTCxDQUFjakQsU0FIdEIsRUFJUWdDLElBSlIsRUFLUTNDLEdBTFI7QUFNSDtBQUNKOzs7O0VBckQ0QkssSzs7SUF3RHBCK0QsVyxXQUFBQSxXOzs7QUFDVCx5QkFBWTNFLFlBQVosRUFBMEJhLFVBQTFCLEVBQXNDbkMsS0FBdEMsRUFBNkM7QUFBQTs7QUFBQSx5SEFDbkNzQixZQURtQyxFQUNyQixRQURxQixFQUNYYSxVQURXLEVBQ0NuQyxLQURELEVBQ1EsS0FEUjtBQUU1Qzs7O0VBSDRCa0MsSzs7SUFNcEJnRSwyQixXQUFBQSwyQjs7O0FBQ1QseUNBQVk1RSxZQUFaLEVBQTBCYSxVQUExQixFQUFzQ25DLEtBQXRDLEVBQTZDO0FBQUE7O0FBQUEsK0pBQ25Dc0IsWUFEbUMsRUFDckIsMEJBRHFCLEVBQ09hLFVBRFAsRUFDbUJuQyxLQURuQixFQUMwQixLQUQxQjs7QUFFekMsZUFBS21HLFFBQUwsQ0FBY25HLE1BQU1vRyxFQUFwQixFQUNRLElBQUlMLG9CQUFKLENBQ0lqRSxtQkFBU3VFLFlBRGIsRUFFSXJHLE1BQU1vRyxFQUZWLEVBR0lwRyxLQUhKLEVBSUksSUFKSixFQUtJLElBTEosRUFNSSxJQU5KLENBRFI7QUFTQSxlQUFLMkMsdUJBQUwsR0FBK0IsSUFBL0I7QUFYeUM7QUFZNUM7OztFQWI0Q1QsSzs7SUFnQnBDb0UsVSxXQUFBQSxVOzs7QUFDVCx3QkFBWWhGLFlBQVosRUFBMEJhLFVBQTFCLEVBQXNDbkMsS0FBdEMsRUFBNkM7QUFBQTs7QUFBQSx1SEFDbkNzQixZQURtQyxFQUNyQixPQURxQixFQUNaYSxVQURZLEVBQ0FuQyxLQURBLEVBQ08sS0FEUDtBQUU1Qzs7O0VBSDJCa0MsSzs7SUFNbkJxRSxTLFdBQUFBLFM7OztBQUNULHVCQUFZakYsWUFBWixFQUEwQmEsVUFBMUIsRUFBc0NuQyxLQUF0QyxFQUE2QztBQUFBOztBQUFBLHFIQUNuQ3NCLFlBRG1DLEVBQ3JCLE1BRHFCLEVBQ2JhLFVBRGEsRUFDRG5DLEtBREMsRUFDTSxLQUROO0FBRTVDOzs7O2dDQUVPc0IsWSxFQUFjO0FBQ2xCLGdCQUFJLEtBQUsyQyx1QkFBTCxDQUE2QjNDLFlBQTdCLENBQUosRUFBZ0Q7QUFDNUMscUlBQXFCQSxZQUFyQjtBQUNIOztBQUVELGlCQUFLLElBQUlsQixJQUFJLENBQVIsRUFBV0MsS0FBSyxLQUFLeUMsTUFBTCxDQUFZaEMsTUFBakMsRUFBeUNWLElBQUlDLEVBQTdDLEVBQWlELEVBQUVELENBQW5ELEVBQXNEO0FBQ2xELG9CQUFJK0MsTUFBTSxLQUFLTCxNQUFMLENBQVkxQyxDQUFaLENBQVY7QUFDQStDLG9CQUFJbUIsT0FBSixHQUFjLElBQWQ7QUFDQSxxQkFBS1gsc0JBQUwsQ0FBNEJSLEdBQTVCO0FBQ0g7QUFDRCxpQkFBS0wsTUFBTCxHQUFjLElBQWQ7O0FBRUEsbUJBQU8sS0FBS3RDLEtBQVo7QUFDSDs7OztFQWxCMEIwQixLOztJQXFCbEJzRSxRLFdBQUFBLFE7OztBQUNULHNCQUFZbEYsWUFBWixFQUEwQmEsVUFBMUIsRUFBc0NuQyxLQUF0QyxFQUE2QztBQUFBOztBQUFBLG1IQUNuQ3NCLFlBRG1DLEVBQ3JCLEtBRHFCLEVBQ2RhLFVBRGMsRUFDRm5DLEtBREUsRUFDSyxLQURMO0FBRTVDOzs7RUFIeUJrQyxLOztJQU1qQnVFLFUsV0FBQUEsVTs7O0FBQ1Qsd0JBQVluRixZQUFaLEVBQTBCYSxVQUExQixFQUFzQ25DLEtBQXRDLEVBQTZDO0FBQUE7O0FBQUEsdUhBQ25Dc0IsWUFEbUMsRUFDckIsT0FEcUIsRUFDWmEsVUFEWSxFQUNBbkMsS0FEQSxFQUNPLEtBRFA7QUFFNUM7OztFQUgyQmtDLEs7O0lBTW5Cd0UsVyxXQUFBQSxXOzs7QUFDVCx5QkFBWXBGLFlBQVosRUFBMEJhLFVBQTFCLEVBQXNDbkMsS0FBdEMsRUFBNkM7QUFBQTs7QUFBQSx5SEFDbkNzQixZQURtQyxFQUNyQixRQURxQixFQUNYYSxVQURXLEVBQ0NuQyxLQURELEVBQ1EsS0FEUjtBQUU1Qzs7O0VBSDRCa0MsSzs7SUFNcEJ5RSxhLFdBQUFBLGE7OztBQUNULDJCQUFZckYsWUFBWixFQUEwQmEsVUFBMUIsRUFBc0NuQyxLQUF0QyxFQUE2Q0Msa0JBQTdDLEVBQWlFO0FBQUE7O0FBRzdEO0FBQ0E7QUFKNkQsbUlBQ3ZEcUIsWUFEdUQsRUFDekMsVUFEeUMsRUFDN0JhLFVBRDZCLEVBQ2pCbkMsS0FEaUIsRUFDVkMsa0JBRFU7O0FBSzdELFlBQUksT0FBS0QsS0FBTCxDQUFXVSxJQUFYLEtBQW9CQyxtQkFBT0MsdUJBQS9CLEVBQXdEO0FBQ3BELG1CQUFLZ0csaUJBQUw7QUFDSDtBQVA0RDtBQVFoRTs7OztrREFFeUI7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFJLEtBQUs1RyxLQUFMLENBQVdVLElBQVgsS0FBb0JDLG1CQUFPQyx1QkFBL0IsRUFBd0Q7QUFDcEQsdUJBQU8sS0FBUDtBQUNIOztBQUVELGdCQUFJLENBQUMsS0FBS2lHLFFBQUwsRUFBTCxFQUFzQjtBQUNsQix1QkFBTyxJQUFQO0FBQ0g7O0FBRUQsZ0JBQUl0RCxXQUFXLEtBQUs1QixHQUFMLENBQVNELEdBQVQsQ0FBYSxXQUFiLENBQWY7QUFDQSxrQ0FBTzZCLFFBQVAsRUFBaUIsaUNBQWpCO0FBQ0EsbUJBQU9BLFNBQVNlLE9BQVQsSUFBb0JmLFNBQVNkLFVBQVQsQ0FBb0IzQixNQUFwQixLQUFnQyxDQUEzRDtBQUNIOzs7NkNBRW9CO0FBQ2pCLGdCQUFJLENBQUMsS0FBSytGLFFBQUwsRUFBTCxFQUFzQjtBQUNsQix1QkFBTyxJQUFQO0FBQ0g7QUFDRCxtQkFBTyxLQUFLaEUsU0FBWjtBQUNIOzs7NENBRW1CO0FBQ2hCLGlCQUFLaUMsZUFBTCxDQUNRLFdBRFIsRUFFUSxLQUFLbkQsR0FGYixFQUdRLEtBQUthLFNBSGIsRUFJUSxJQUpSLEVBS1EsSUFMUjtBQU1BLGlCQUFLSCxNQUFMLENBQVlWLEdBQVosQ0FBZ0IsV0FBaEIsRUFBNkIsSUFBN0I7QUFDSDs7OztFQWhEOEJPLEs7O0lBbUR0QjRFLFEsV0FBQUEsUTs7O0FBQ1Qsc0JBQVl4RixZQUFaLEVBQTBCYSxVQUExQixFQUFzQ25DLEtBQXRDLEVBQTZDO0FBQUE7O0FBQUEsbUhBQ25Dc0IsWUFEbUMsRUFDckIsS0FEcUIsRUFDZGEsVUFEYyxFQUNGbkMsS0FERSxFQUNLLEtBREw7QUFFNUM7OztFQUh5QmtDLEs7O0lBTWpCNkUsVSxXQUFBQSxVOzs7QUFDVCx3QkFBWXpGLFlBQVosRUFBMEJhLFVBQTFCLEVBQXNDbkMsS0FBdEMsRUFBNkM7QUFBQTs7QUFBQSx1SEFDbkNzQixZQURtQyxFQUNyQixPQURxQixFQUNaYSxVQURZLEVBQ0FuQyxLQURBLEVBQ08sS0FEUDtBQUU1Qzs7O0VBSDJCa0MsSzs7QUFNaEMiLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICBDb3B5cmlnaHQgKEMpIDIwMTUgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuXG4gIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIDxDT1BZUklHSFQgSE9MREVSPiBCRSBMSUFCTEUgRk9SIEFOWVxuICBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0ZcbiAgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiovXG5cbmltcG9ydCB7IFN5bnRheCB9IGZyb20gJ2VzdHJhdmVyc2UnO1xuXG5pbXBvcnQgUmVmZXJlbmNlIGZyb20gJy4vcmVmZXJlbmNlJztcbmltcG9ydCBWYXJpYWJsZSBmcm9tICcuL3ZhcmlhYmxlJztcbmltcG9ydCBEZWZpbml0aW9uIGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmZ1bmN0aW9uIGlzU3RyaWN0U2NvcGUoc2NvcGUsIGJsb2NrLCBpc01ldGhvZERlZmluaXRpb24sIHVzZURpcmVjdGl2ZSkge1xuICAgIHZhciBib2R5LCBpLCBpeiwgc3RtdCwgZXhwcjtcblxuICAgIC8vIFdoZW4gdXBwZXIgc2NvcGUgaXMgZXhpc3RzIGFuZCBzdHJpY3QsIGlubmVyIHNjb3BlIGlzIGFsc28gc3RyaWN0LlxuICAgIGlmIChzY29wZS51cHBlciAmJiBzY29wZS51cHBlci5pc1N0cmljdCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbidzIHNjb3BlIGlzIGFsd2F5cyBzdHJpY3Qgc2NvcGUuXG4gICAgaWYgKGJsb2NrLnR5cGUgPT09IFN5bnRheC5BcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNNZXRob2REZWZpbml0aW9uKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzY29wZS50eXBlID09PSAnY2xhc3MnIHx8IHNjb3BlLnR5cGUgPT09ICdtb2R1bGUnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzY29wZS50eXBlID09PSAnYmxvY2snIHx8IHNjb3BlLnR5cGUgPT09ICdzd2l0Y2gnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoc2NvcGUudHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gU3ludGF4LlByb2dyYW0pIHtcbiAgICAgICAgICAgIGJvZHkgPSBibG9jaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJvZHkgPSBibG9jay5ib2R5O1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChzY29wZS50eXBlID09PSAnZ2xvYmFsJykge1xuICAgICAgICBib2R5ID0gYmxvY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFNlYXJjaCAndXNlIHN0cmljdCcgZGlyZWN0aXZlLlxuICAgIGlmICh1c2VEaXJlY3RpdmUpIHtcbiAgICAgICAgZm9yIChpID0gMCwgaXogPSBib2R5LmJvZHkubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgc3RtdCA9IGJvZHkuYm9keVtpXTtcbiAgICAgICAgICAgIGlmIChzdG10LnR5cGUgIT09IFN5bnRheC5EaXJlY3RpdmVTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdG10LnJhdyA9PT0gJ1widXNlIHN0cmljdFwiJyB8fCBzdG10LnJhdyA9PT0gJ1xcJ3VzZSBzdHJpY3RcXCcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IGJvZHkuYm9keS5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBzdG10ID0gYm9keS5ib2R5W2ldO1xuICAgICAgICAgICAgaWYgKHN0bXQudHlwZSAhPT0gU3ludGF4LkV4cHJlc3Npb25TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cHIgPSBzdG10LmV4cHJlc3Npb247XG4gICAgICAgICAgICBpZiAoZXhwci50eXBlICE9PSBTeW50YXguTGl0ZXJhbCB8fCB0eXBlb2YgZXhwci52YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHByLnJhdyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4cHIucmF3ID09PSAnXCJ1c2Ugc3RyaWN0XCInIHx8IGV4cHIucmF3ID09PSAnXFwndXNlIHN0cmljdFxcJycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwci52YWx1ZSA9PT0gJ3VzZSBzdHJpY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyU2NvcGUoc2NvcGVNYW5hZ2VyLCBzY29wZSkge1xuICAgIHZhciBzY29wZXM7XG5cbiAgICBzY29wZU1hbmFnZXIuc2NvcGVzLnB1c2goc2NvcGUpO1xuXG4gICAgc2NvcGVzID0gc2NvcGVNYW5hZ2VyLl9fbm9kZVRvU2NvcGUuZ2V0KHNjb3BlLmJsb2NrKTtcbiAgICBpZiAoc2NvcGVzKSB7XG4gICAgICAgIHNjb3Blcy5wdXNoKHNjb3BlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY29wZU1hbmFnZXIuX19ub2RlVG9TY29wZS5zZXQoc2NvcGUuYmxvY2ssIFsgc2NvcGUgXSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRCZVN0YXRpY2FsbHkoZGVmKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgKGRlZi50eXBlID09PSBWYXJpYWJsZS5DbGFzc05hbWUpIHx8XG4gICAgICAgIChkZWYudHlwZSA9PT0gVmFyaWFibGUuVmFyaWFibGUgJiYgZGVmLnBhcmVudC5raW5kICE9PSAndmFyJylcbiAgICApO1xufVxuXG4vKipcbiAqIEBjbGFzcyBTY29wZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB0eXBlLCB1cHBlclNjb3BlLCBibG9jaywgaXNNZXRob2REZWZpbml0aW9uKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPbmUgb2YgJ1REWicsICdtb2R1bGUnLCAnYmxvY2snLCAnc3dpdGNoJywgJ2Z1bmN0aW9uJywgJ2NhdGNoJywgJ3dpdGgnLCAnZnVuY3Rpb24nLCAnY2xhc3MnLCAnZ2xvYmFsJy5cbiAgICAgICAgICogQG1lbWJlciB7U3RyaW5nfSBTY29wZSN0eXBlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzY29wZWQge0BsaW5rIFZhcmlhYmxlfXMgb2YgdGhpcyBzY29wZSwgYXMgPGNvZGU+eyBWYXJpYWJsZS5uYW1lXG4gICAgICAgICAqIDogVmFyaWFibGUgfTwvY29kZT4uXG4gICAgICAgICAqIEBtZW1iZXIge01hcH0gU2NvcGUjc2V0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNldCA9IG5ldyBNYXAoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB0YWludGVkIHZhcmlhYmxlcyBvZiB0aGlzIHNjb3BlLCBhcyA8Y29kZT57IFZhcmlhYmxlLm5hbWUgOlxuICAgICAgICAgKiBib29sZWFuIH08L2NvZGU+LlxuICAgICAgICAgKiBAbWVtYmVyIHtNYXB9IFNjb3BlI3RhaW50cyAqL1xuICAgICAgICB0aGlzLnRhaW50cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdlbmVyYWxseSwgdGhyb3VnaCB0aGUgbGV4aWNhbCBzY29waW5nIG9mIEpTIHlvdSBjYW4gYWx3YXlzIGtub3dcbiAgICAgICAgICogd2hpY2ggdmFyaWFibGUgYW4gaWRlbnRpZmllciBpbiB0aGUgc291cmNlIGNvZGUgcmVmZXJzIHRvLiBUaGVyZSBhcmVcbiAgICAgICAgICogYSBmZXcgZXhjZXB0aW9ucyB0byB0aGlzIHJ1bGUuIFdpdGggJ2dsb2JhbCcgYW5kICd3aXRoJyBzY29wZXMgeW91XG4gICAgICAgICAqIGNhbiBvbmx5IGRlY2lkZSBhdCBydW50aW1lIHdoaWNoIHZhcmlhYmxlIGEgcmVmZXJlbmNlIHJlZmVycyB0by5cbiAgICAgICAgICogTW9yZW92ZXIsIGlmICdldmFsKCknIGlzIHVzZWQgaW4gYSBzY29wZSwgaXQgbWlnaHQgaW50cm9kdWNlIG5ld1xuICAgICAgICAgKiBiaW5kaW5ncyBpbiB0aGlzIG9yIGl0cyBwYXJlbnQgc2NvcGVzLlxuICAgICAgICAgKiBBbGwgdGhvc2Ugc2NvcGVzIGFyZSBjb25zaWRlcmVkICdkeW5hbWljJy5cbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn0gU2NvcGUjZHluYW1pY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5keW5hbWljID0gdGhpcy50eXBlID09PSAnZ2xvYmFsJyB8fCB0aGlzLnR5cGUgPT09ICd3aXRoJztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBzY29wZS1kZWZpbmluZyBzeW50YXggbm9kZS5cbiAgICAgICAgICogQG1lbWJlciB7ZXNwcmltYS5Ob2RlfSBTY29wZSNibG9ja1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ibG9jayA9IGJsb2NrO1xuICAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB7QGxpbmsgUmVmZXJlbmNlfHJlZmVyZW5jZXN9IHRoYXQgYXJlIG5vdCByZXNvbHZlZCB3aXRoIHRoaXMgc2NvcGUuXG4gICAgICAgICAqIEBtZW1iZXIge1JlZmVyZW5jZVtdfSBTY29wZSN0aHJvdWdoXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRocm91Z2ggPSBbXTtcbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgc2NvcGVkIHtAbGluayBWYXJpYWJsZX1zIG9mIHRoaXMgc2NvcGUuIEluIHRoZSBjYXNlIG9mIGFcbiAgICAgICAgICogJ2Z1bmN0aW9uJyBzY29wZSB0aGlzIGluY2x1ZGVzIHRoZSBhdXRvbWF0aWMgYXJndW1lbnQgPGVtPmFyZ3VtZW50czwvZW0+IGFzXG4gICAgICAgICAqIGl0cyBmaXJzdCBlbGVtZW50LCBhcyB3ZWxsIGFzIGFsbCBmdXJ0aGVyIGZvcm1hbCBhcmd1bWVudHMuXG4gICAgICAgICAqIEBtZW1iZXIge1ZhcmlhYmxlW119IFNjb3BlI3ZhcmlhYmxlc1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy52YXJpYWJsZXMgPSBbXTtcbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBBbnkgdmFyaWFibGUge0BsaW5rIFJlZmVyZW5jZXxyZWZlcmVuY2V9IGZvdW5kIGluIHRoaXMgc2NvcGUuIFRoaXNcbiAgICAgICAgICogaW5jbHVkZXMgb2NjdXJyZW5jZXMgb2YgbG9jYWwgdmFyaWFibGVzIGFzIHdlbGwgYXMgdmFyaWFibGVzIGZyb21cbiAgICAgICAgICogcGFyZW50IHNjb3BlcyAoaW5jbHVkaW5nIHRoZSBnbG9iYWwgc2NvcGUpLiBGb3IgbG9jYWwgdmFyaWFibGVzXG4gICAgICAgICAqIHRoaXMgYWxzbyBpbmNsdWRlcyBkZWZpbmluZyBvY2N1cnJlbmNlcyAobGlrZSBpbiBhICd2YXInIHN0YXRlbWVudCkuXG4gICAgICAgICAqIEluIGEgJ2Z1bmN0aW9uJyBzY29wZSB0aGlzIGRvZXMgbm90IGluY2x1ZGUgdGhlIG9jY3VycmVuY2VzIG9mIHRoZVxuICAgICAgICAgKiBmb3JtYWwgcGFyYW1ldGVyIGluIHRoZSBwYXJhbWV0ZXIgbGlzdC5cbiAgICAgICAgICogQG1lbWJlciB7UmVmZXJlbmNlW119IFNjb3BlI3JlZmVyZW5jZXNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVmZXJlbmNlcyA9IFtdO1xuXG4gICAgICAgICAvKipcbiAgICAgICAgICogRm9yICdnbG9iYWwnIGFuZCAnZnVuY3Rpb24nIHNjb3BlcywgdGhpcyBpcyBhIHNlbGYtcmVmZXJlbmNlLiBGb3JcbiAgICAgICAgICogb3RoZXIgc2NvcGUgdHlwZXMgdGhpcyBpcyB0aGUgPGVtPnZhcmlhYmxlU2NvcGU8L2VtPiB2YWx1ZSBvZiB0aGVcbiAgICAgICAgICogcGFyZW50IHNjb3BlLlxuICAgICAgICAgKiBAbWVtYmVyIHtTY29wZX0gU2NvcGUjdmFyaWFibGVTY29wZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy52YXJpYWJsZVNjb3BlID1cbiAgICAgICAgICAgICh0aGlzLnR5cGUgPT09ICdnbG9iYWwnIHx8IHRoaXMudHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0aGlzLnR5cGUgPT09ICdtb2R1bGUnKSA/IHRoaXMgOiB1cHBlclNjb3BlLnZhcmlhYmxlU2NvcGU7XG4gICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGlzIHNjb3BlIGlzIGNyZWF0ZWQgYnkgYSBGdW5jdGlvbkV4cHJlc3Npb24uXG4gICAgICAgICAqIEBtZW1iZXIge2Jvb2xlYW59IFNjb3BlI2Z1bmN0aW9uRXhwcmVzc2lvblNjb3BlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZ1bmN0aW9uRXhwcmVzc2lvblNjb3BlID0gZmFsc2U7XG4gICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGlzIGlzIGEgc2NvcGUgdGhhdCBjb250YWlucyBhbiAnZXZhbCgpJyBpbnZvY2F0aW9uLlxuICAgICAgICAgKiBAbWVtYmVyIHtib29sZWFufSBTY29wZSNkaXJlY3RDYWxsVG9FdmFsU2NvcGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZGlyZWN0Q2FsbFRvRXZhbFNjb3BlID0gZmFsc2U7XG4gICAgICAgICAvKipcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn0gU2NvcGUjdGhpc0ZvdW5kXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRoaXNGb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX19sZWZ0ID0gW107XG5cbiAgICAgICAgIC8qKlxuICAgICAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIHBhcmVudCB7QGxpbmsgU2NvcGV8c2NvcGV9LlxuICAgICAgICAgKiBAbWVtYmVyIHtTY29wZX0gU2NvcGUjdXBwZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBwZXIgPSB1cHBlclNjb3BlO1xuICAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgJ3VzZSBzdHJpY3QnIGlzIGluIGVmZmVjdCBpbiB0aGlzIHNjb3BlLlxuICAgICAgICAgKiBAbWVtYmVyIHtib29sZWFufSBTY29wZSNpc1N0cmljdFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1N0cmljdCA9IGlzU3RyaWN0U2NvcGUodGhpcywgYmxvY2ssIGlzTWV0aG9kRGVmaW5pdGlvbiwgc2NvcGVNYW5hZ2VyLl9fdXNlRGlyZWN0aXZlKCkpO1xuXG4gICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBvZiBuZXN0ZWQge0BsaW5rIFNjb3BlfXMuXG4gICAgICAgICAqIEBtZW1iZXIge1Njb3BlW119IFNjb3BlI2NoaWxkU2NvcGVzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNoaWxkU2NvcGVzID0gW107XG4gICAgICAgIGlmICh0aGlzLnVwcGVyKSB7XG4gICAgICAgICAgICB0aGlzLnVwcGVyLmNoaWxkU2NvcGVzLnB1c2godGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fZGVjbGFyZWRWYXJpYWJsZXMgPSBzY29wZU1hbmFnZXIuX19kZWNsYXJlZFZhcmlhYmxlcztcblxuICAgICAgICByZWdpc3RlclNjb3BlKHNjb3BlTWFuYWdlciwgdGhpcyk7XG4gICAgfVxuXG4gICAgX19zaG91bGRTdGF0aWNhbGx5Q2xvc2Uoc2NvcGVNYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiAoIXRoaXMuZHluYW1pYyB8fCBzY29wZU1hbmFnZXIuX19pc09wdGltaXN0aWMoKSk7XG4gICAgfVxuXG4gICAgX19zaG91bGRTdGF0aWNhbGx5Q2xvc2VGb3JHbG9iYWwocmVmKSB7XG4gICAgICAgIC8vIE9uIGdsb2JhbCBzY29wZSwgbGV0L2NvbnN0L2NsYXNzIGRlY2xhcmF0aW9ucyBzaG91bGQgYmUgcmVzb2x2ZWQgc3RhdGljYWxseS5cbiAgICAgICAgdmFyIG5hbWUgPSByZWYuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICBpZiAoIXRoaXMuc2V0LmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhcmlhYmxlID0gdGhpcy5zZXQuZ2V0KG5hbWUpO1xuICAgICAgICB2YXIgZGVmcyA9IHZhcmlhYmxlLmRlZnM7XG4gICAgICAgIHJldHVybiBkZWZzLmxlbmd0aCA+IDAgJiYgZGVmcy5ldmVyeShzaG91bGRCZVN0YXRpY2FsbHkpO1xuICAgIH1cblxuICAgIF9fc3RhdGljQ2xvc2VSZWYocmVmKSB7XG4gICAgICAgIGlmICghdGhpcy5fX3Jlc29sdmUocmVmKSkge1xuICAgICAgICAgICAgdGhpcy5fX2RlbGVnYXRlVG9VcHBlclNjb3BlKHJlZik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfX2R5bmFtaWNDbG9zZVJlZihyZWYpIHtcbiAgICAgICAgLy8gbm90aWZ5IGFsbCBuYW1lcyBhcmUgdGhyb3VnaCB0byBnbG9iYWxcbiAgICAgICAgbGV0IGN1cnJlbnQgPSB0aGlzO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBjdXJyZW50LnRocm91Z2gucHVzaChyZWYpO1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQudXBwZXI7XG4gICAgICAgIH0gd2hpbGUgKGN1cnJlbnQpO1xuICAgIH1cblxuICAgIF9fZ2xvYmFsQ2xvc2VSZWYocmVmKSB7XG4gICAgICAgIC8vIGxldC9jb25zdC9jbGFzcyBkZWNsYXJhdGlvbnMgc2hvdWxkIGJlIHJlc29sdmVkIHN0YXRpY2FsbHkuXG4gICAgICAgIC8vIG90aGVycyBzaG91bGQgYmUgcmVzb2x2ZWQgZHluYW1pY2FsbHkuXG4gICAgICAgIGlmICh0aGlzLl9fc2hvdWxkU3RhdGljYWxseUNsb3NlRm9yR2xvYmFsKHJlZikpIHtcbiAgICAgICAgICAgIHRoaXMuX19zdGF0aWNDbG9zZVJlZihyZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fX2R5bmFtaWNDbG9zZVJlZihyZWYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX19jbG9zZShzY29wZU1hbmFnZXIpIHtcbiAgICAgICAgdmFyIGNsb3NlUmVmO1xuICAgICAgICBpZiAodGhpcy5fX3Nob3VsZFN0YXRpY2FsbHlDbG9zZShzY29wZU1hbmFnZXIpKSB7XG4gICAgICAgICAgICBjbG9zZVJlZiA9IHRoaXMuX19zdGF0aWNDbG9zZVJlZjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgIT09ICdnbG9iYWwnKSB7XG4gICAgICAgICAgICBjbG9zZVJlZiA9IHRoaXMuX19keW5hbWljQ2xvc2VSZWY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbG9zZVJlZiA9IHRoaXMuX19nbG9iYWxDbG9zZVJlZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRyeSBSZXNvbHZpbmcgYWxsIHJlZmVyZW5jZXMgaW4gdGhpcyBzY29wZS5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGl6ID0gdGhpcy5fX2xlZnQubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgbGV0IHJlZiA9IHRoaXMuX19sZWZ0W2ldO1xuICAgICAgICAgICAgY2xvc2VSZWYuY2FsbCh0aGlzLCByZWYpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19sZWZ0ID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gdGhpcy51cHBlcjtcbiAgICB9XG5cbiAgICBfX3Jlc29sdmUocmVmKSB7XG4gICAgICAgIHZhciB2YXJpYWJsZSwgbmFtZTtcbiAgICAgICAgbmFtZSA9IHJlZi5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgIGlmICh0aGlzLnNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHZhcmlhYmxlID0gdGhpcy5zZXQuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgdmFyaWFibGUucmVmZXJlbmNlcy5wdXNoKHJlZik7XG4gICAgICAgICAgICB2YXJpYWJsZS5zdGFjayA9IHZhcmlhYmxlLnN0YWNrICYmIHJlZi5mcm9tLnZhcmlhYmxlU2NvcGUgPT09IHRoaXMudmFyaWFibGVTY29wZTtcbiAgICAgICAgICAgIGlmIChyZWYudGFpbnRlZCkge1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlLnRhaW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMudGFpbnRzLnNldCh2YXJpYWJsZS5uYW1lLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZi5yZXNvbHZlZCA9IHZhcmlhYmxlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIF9fZGVsZWdhdGVUb1VwcGVyU2NvcGUocmVmKSB7XG4gICAgICAgIGlmICh0aGlzLnVwcGVyKSB7XG4gICAgICAgICAgICB0aGlzLnVwcGVyLl9fbGVmdC5wdXNoKHJlZik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aHJvdWdoLnB1c2gocmVmKTtcbiAgICB9XG5cbiAgICBfX2FkZERlY2xhcmVkVmFyaWFibGVzT2ZOb2RlKHZhcmlhYmxlLCBub2RlKSB7XG4gICAgICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YXJpYWJsZXMgPSB0aGlzLl9fZGVjbGFyZWRWYXJpYWJsZXMuZ2V0KG5vZGUpO1xuICAgICAgICBpZiAodmFyaWFibGVzID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhcmlhYmxlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fX2RlY2xhcmVkVmFyaWFibGVzLnNldChub2RlLCB2YXJpYWJsZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YXJpYWJsZXMuaW5kZXhPZih2YXJpYWJsZSkgPT09IC0xKSB7XG4gICAgICAgICAgICB2YXJpYWJsZXMucHVzaCh2YXJpYWJsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfX2RlZmluZUdlbmVyaWMobmFtZSwgc2V0LCB2YXJpYWJsZXMsIG5vZGUsIGRlZikge1xuICAgICAgICB2YXIgdmFyaWFibGU7XG5cbiAgICAgICAgdmFyaWFibGUgPSBzZXQuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoIXZhcmlhYmxlKSB7XG4gICAgICAgICAgICB2YXJpYWJsZSA9IG5ldyBWYXJpYWJsZShuYW1lLCB0aGlzKTtcbiAgICAgICAgICAgIHNldC5zZXQobmFtZSwgdmFyaWFibGUpO1xuICAgICAgICAgICAgdmFyaWFibGVzLnB1c2godmFyaWFibGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlZikge1xuICAgICAgICAgICAgdmFyaWFibGUuZGVmcy5wdXNoKGRlZik7XG4gICAgICAgICAgICBpZiAoZGVmLnR5cGUgIT09IFZhcmlhYmxlLlREWikge1xuICAgICAgICAgICAgICAgIHRoaXMuX19hZGREZWNsYXJlZFZhcmlhYmxlc09mTm9kZSh2YXJpYWJsZSwgZGVmLm5vZGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19hZGREZWNsYXJlZFZhcmlhYmxlc09mTm9kZSh2YXJpYWJsZSwgZGVmLnBhcmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHZhcmlhYmxlLmlkZW50aWZpZXJzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfX2RlZmluZShub2RlLCBkZWYpIHtcbiAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhpcy5fX2RlZmluZUdlbmVyaWMoXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFyaWFibGVzLFxuICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICBkZWYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX19yZWZlcmVuY2luZyhub2RlLCBhc3NpZ24sIHdyaXRlRXhwciwgbWF5YmVJbXBsaWNpdEdsb2JhbCwgcGFydGlhbCwgaW5pdCkge1xuICAgICAgICAvLyBiZWNhdXNlIEFycmF5IGVsZW1lbnQgbWF5IGJlIG51bGxcbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUudHlwZSAhPT0gU3ludGF4LklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNwZWNpYWxseSBoYW5kbGUgbGlrZSBgdGhpc2AuXG4gICAgICAgIGlmIChub2RlLm5hbWUgPT09ICdzdXBlcicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZWYgPSBuZXcgUmVmZXJlbmNlKG5vZGUsIHRoaXMsIGFzc2lnbiB8fCBSZWZlcmVuY2UuUkVBRCwgd3JpdGVFeHByLCBtYXliZUltcGxpY2l0R2xvYmFsLCAhIXBhcnRpYWwsICEhaW5pdCk7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlcy5wdXNoKHJlZik7XG4gICAgICAgIHRoaXMuX19sZWZ0LnB1c2gocmVmKTtcbiAgICB9XG5cbiAgICBfX2RldGVjdEV2YWwoKSB7XG4gICAgICAgIHZhciBjdXJyZW50O1xuICAgICAgICBjdXJyZW50ID0gdGhpcztcbiAgICAgICAgdGhpcy5kaXJlY3RDYWxsVG9FdmFsU2NvcGUgPSB0cnVlO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBjdXJyZW50LmR5bmFtaWMgPSB0cnVlO1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQudXBwZXI7XG4gICAgICAgIH0gd2hpbGUgKGN1cnJlbnQpO1xuICAgIH1cblxuICAgIF9fZGV0ZWN0VGhpcygpIHtcbiAgICAgICAgdGhpcy50aGlzRm91bmQgPSB0cnVlO1xuICAgIH1cblxuICAgIF9faXNDbG9zZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbGVmdCA9PT0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIHJlc29sdmVkIHtSZWZlcmVuY2V9XG4gICAgICogQG1ldGhvZCBTY29wZSNyZXNvbHZlXG4gICAgICogQHBhcmFtIHtFc3ByaW1hLklkZW50aWZpZXJ9IGlkZW50IC0gaWRlbnRpZmllciB0byBiZSByZXNvbHZlZC5cbiAgICAgKiBAcmV0dXJuIHtSZWZlcmVuY2V9XG4gICAgICovXG4gICAgcmVzb2x2ZShpZGVudCkge1xuICAgICAgICB2YXIgcmVmLCBpLCBpejtcbiAgICAgICAgYXNzZXJ0KHRoaXMuX19pc0Nsb3NlZCgpLCAnU2NvcGUgc2hvdWxkIGJlIGNsb3NlZC4nKTtcbiAgICAgICAgYXNzZXJ0KGlkZW50LnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyLCAnVGFyZ2V0IHNob3VsZCBiZSBpZGVudGlmaWVyLicpO1xuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IHRoaXMucmVmZXJlbmNlcy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICByZWYgPSB0aGlzLnJlZmVyZW5jZXNbaV07XG4gICAgICAgICAgICBpZiAocmVmLmlkZW50aWZpZXIgPT09IGlkZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIHRoaXMgc2NvcGUgaXMgc3RhdGljXG4gICAgICogQG1ldGhvZCBTY29wZSNpc1N0YXRpY1xuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNTdGF0aWMoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5keW5hbWljO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgdGhpcyBzY29wZSBoYXMgbWF0ZXJpYWxpemVkIGFyZ3VtZW50c1xuICAgICAqIEBtZXRob2QgU2NvcGUjaXNBcmd1bWVudHNNYXRlcmlhbGl6ZWRcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzQXJndW1lbnRzTWF0ZXJpYWxpemVkKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIHRoaXMgc2NvcGUgaGFzIG1hdGVyaWFsaXplZCBgdGhpc2AgcmVmZXJlbmNlXG4gICAgICogQG1ldGhvZCBTY29wZSNpc1RoaXNNYXRlcmlhbGl6ZWRcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzVGhpc01hdGVyaWFsaXplZCgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaXNVc2VkTmFtZShuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLnNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpeiA9IHRoaXMudGhyb3VnaC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aHJvdWdoW2ldLmlkZW50aWZpZXIubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHbG9iYWxTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ2dsb2JhbCcsIG51bGwsIGJsb2NrLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuaW1wbGljaXQgPSB7XG4gICAgICAgICAgICBzZXQ6IG5ldyBNYXAoKSxcbiAgICAgICAgICAgIHZhcmlhYmxlczogW10sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogTGlzdCBvZiB7QGxpbmsgUmVmZXJlbmNlfXMgdGhhdCBhcmUgbGVmdCB0byBiZSByZXNvbHZlZCAoaS5lLiB3aGljaFxuICAgICAgICAgICAgKiBuZWVkIHRvIGJlIGxpbmtlZCB0byB0aGUgdmFyaWFibGUgdGhleSByZWZlciB0bykuXG4gICAgICAgICAgICAqIEBtZW1iZXIge1JlZmVyZW5jZVtdfSBTY29wZSNpbXBsaWNpdCNsZWZ0XG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgbGVmdDogW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfX2Nsb3NlKHNjb3BlTWFuYWdlcikge1xuICAgICAgICBsZXQgaW1wbGljaXQgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGl6ID0gdGhpcy5fX2xlZnQubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgbGV0IHJlZiA9IHRoaXMuX19sZWZ0W2ldO1xuICAgICAgICAgICAgaWYgKHJlZi5fX21heWJlSW1wbGljaXRHbG9iYWwgJiYgIXRoaXMuc2V0LmhhcyhyZWYuaWRlbnRpZmllci5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGltcGxpY2l0LnB1c2gocmVmLl9fbWF5YmVJbXBsaWNpdEdsb2JhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgYW4gaW1wbGljaXQgZ2xvYmFsIHZhcmlhYmxlIGZyb20gYXNzaWdubWVudCBleHByZXNzaW9uXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpeiA9IGltcGxpY2l0Lmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIGxldCBpbmZvID0gaW1wbGljaXRbaV07XG4gICAgICAgICAgICB0aGlzLl9fZGVmaW5lSW1wbGljaXQoaW5mby5wYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRGVmaW5pdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIFZhcmlhYmxlLkltcGxpY2l0R2xvYmFsVmFyaWFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnBhdHRlcm4sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW1wbGljaXQubGVmdCA9IHRoaXMuX19sZWZ0O1xuXG4gICAgICAgIHJldHVybiBzdXBlci5fX2Nsb3NlKHNjb3BlTWFuYWdlcik7XG4gICAgfVxuXG4gICAgX19kZWZpbmVJbXBsaWNpdChub2RlLCBkZWYpIHtcbiAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhpcy5fX2RlZmluZUdlbmVyaWMoXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbXBsaWNpdC5zZXQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW1wbGljaXQudmFyaWFibGVzLFxuICAgICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAgICBkZWYpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTW9kdWxlU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB1cHBlclNjb3BlLCBibG9jaykge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICdtb2R1bGUnLCB1cHBlclNjb3BlLCBibG9jaywgZmFsc2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZ1bmN0aW9uRXhwcmVzc2lvbk5hbWVTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ2Z1bmN0aW9uLWV4cHJlc3Npb24tbmFtZScsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuX19kZWZpbmUoYmxvY2suaWQsXG4gICAgICAgICAgICAgICAgbmV3IERlZmluaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIFZhcmlhYmxlLkZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suaWQsXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgIHRoaXMuZnVuY3Rpb25FeHByZXNzaW9uU2NvcGUgPSB0cnVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhdGNoU2NvcGUgZXh0ZW5kcyBTY29wZSB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGVNYW5hZ2VyLCB1cHBlclNjb3BlLCBibG9jaykge1xuICAgICAgICBzdXBlcihzY29wZU1hbmFnZXIsICdjYXRjaCcsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgV2l0aFNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnd2l0aCcsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgX19jbG9zZShzY29wZU1hbmFnZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX19zaG91bGRTdGF0aWNhbGx5Q2xvc2Uoc2NvcGVNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLl9fY2xvc2Uoc2NvcGVNYW5hZ2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpeiA9IHRoaXMuX19sZWZ0Lmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIGxldCByZWYgPSB0aGlzLl9fbGVmdFtpXTtcbiAgICAgICAgICAgIHJlZi50YWludGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX19kZWxlZ2F0ZVRvVXBwZXJTY29wZShyZWYpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19sZWZ0ID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gdGhpcy51cHBlcjtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURFpTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ1REWicsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmxvY2tTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ2Jsb2NrJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hTY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlTWFuYWdlciwgJ3N3aXRjaCcsIHVwcGVyU2NvcGUsIGJsb2NrLCBmYWxzZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnVuY3Rpb25TY29wZSBleHRlbmRzIFNjb3BlIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZU1hbmFnZXIsIHVwcGVyU2NvcGUsIGJsb2NrLCBpc01ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnZnVuY3Rpb24nLCB1cHBlclNjb3BlLCBibG9jaywgaXNNZXRob2REZWZpbml0aW9uKTtcblxuICAgICAgICAvLyBzZWN0aW9uIDkuMi4xMywgRnVuY3Rpb25EZWNsYXJhdGlvbkluc3RhbnRpYXRpb24uXG4gICAgICAgIC8vIE5PVEUgQXJyb3cgZnVuY3Rpb25zIG5ldmVyIGhhdmUgYW4gYXJndW1lbnRzIG9iamVjdHMuXG4gICAgICAgIGlmICh0aGlzLmJsb2NrLnR5cGUgIT09IFN5bnRheC5BcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbikge1xuICAgICAgICAgICAgdGhpcy5fX2RlZmluZUFyZ3VtZW50cygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNBcmd1bWVudHNNYXRlcmlhbGl6ZWQoKSB7XG4gICAgICAgIC8vIFRPRE8oQ29uc3RlbGxhdGlvbilcbiAgICAgICAgLy8gV2UgY2FuIG1vcmUgYWdncmVzc2l2ZSBvbiB0aGlzIGNvbmRpdGlvbiBsaWtlIHRoaXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIGZ1bmN0aW9uIHQoKSB7XG4gICAgICAgIC8vICAgICAvLyBhcmd1bWVudHMgb2YgdCBpcyBhbHdheXMgaGlkZGVuLlxuICAgICAgICAvLyAgICAgZnVuY3Rpb24gYXJndW1lbnRzKCkge1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLnR5cGUgPT09IFN5bnRheC5BcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzU3RhdGljKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHZhcmlhYmxlID0gdGhpcy5zZXQuZ2V0KCdhcmd1bWVudHMnKTtcbiAgICAgICAgYXNzZXJ0KHZhcmlhYmxlLCAnQWx3YXlzIGhhdmUgYXJndW1lbnRzIHZhcmlhYmxlLicpO1xuICAgICAgICByZXR1cm4gdmFyaWFibGUudGFpbnRlZCB8fCB2YXJpYWJsZS5yZWZlcmVuY2VzLmxlbmd0aCAgIT09IDA7XG4gICAgfVxuXG4gICAgaXNUaGlzTWF0ZXJpYWxpemVkKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNTdGF0aWMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudGhpc0ZvdW5kO1xuICAgIH1cblxuICAgIF9fZGVmaW5lQXJndW1lbnRzKCkge1xuICAgICAgICB0aGlzLl9fZGVmaW5lR2VuZXJpYyhcbiAgICAgICAgICAgICAgICAnYXJndW1lbnRzJyxcbiAgICAgICAgICAgICAgICB0aGlzLnNldCxcbiAgICAgICAgICAgICAgICB0aGlzLnZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB0aGlzLnRhaW50cy5zZXQoJ2FyZ3VtZW50cycsIHRydWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZvclNjb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnZm9yJywgdXBwZXJTY29wZSwgYmxvY2ssIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDbGFzc1Njb3BlIGV4dGVuZHMgU2NvcGUge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlTWFuYWdlciwgdXBwZXJTY29wZSwgYmxvY2spIHtcbiAgICAgICAgc3VwZXIoc2NvcGVNYW5hZ2VyLCAnY2xhc3MnLCB1cHBlclNjb3BlLCBibG9jaywgZmFsc2UpO1xuICAgIH1cbn1cblxuLyogdmltOiBzZXQgc3c9NCB0cz00IGV0IHR3PTgwIDogKi9cbiJdfQ==
