'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _scope = require('./scope');

var _scope2 = _interopRequireDefault(_scope);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class ScopeManager
 */
var ScopeManager = function () {
    function ScopeManager(options) {
        _classCallCheck(this, ScopeManager);

        this.scopes = [];
        this.globalScope = null;
        this.__nodeToScope = new WeakMap();
        this.__currentScope = null;
        this.__options = options;
        this.__declaredVariables = new WeakMap();
    }

    _createClass(ScopeManager, [{
        key: '__useDirective',
        value: function __useDirective() {
            return this.__options.directive;
        }
    }, {
        key: '__isOptimistic',
        value: function __isOptimistic() {
            return this.__options.optimistic;
        }
    }, {
        key: '__ignoreEval',
        value: function __ignoreEval() {
            return this.__options.ignoreEval;
        }
    }, {
        key: '__isNodejsScope',
        value: function __isNodejsScope() {
            return this.__options.nodejsScope;
        }
    }, {
        key: 'isModule',
        value: function isModule() {
            return this.__options.sourceType === 'module';
        }
    }, {
        key: 'isImpliedStrict',
        value: function isImpliedStrict() {
            return this.__options.impliedStrict;
        }
    }, {
        key: 'isStrictModeSupported',
        value: function isStrictModeSupported() {
            return this.__options.ecmaVersion >= 5;
        }

        // Returns appropriate scope for this node.

    }, {
        key: '__get',
        value: function __get(node) {
            return this.__nodeToScope.get(node);
        }

        /**
         * Get variables that are declared by the node.
         *
         * "are declared by the node" means the node is same as `Variable.defs[].node` or `Variable.defs[].parent`.
         * If the node declares nothing, this method returns an empty array.
         * CAUTION: This API is experimental. See https://github.com/estools/escope/pull/69 for more details.
         *
         * @param {Esprima.Node} node - a node to get.
         * @returns {Variable[]} variables that declared by the node.
         */

    }, {
        key: 'getDeclaredVariables',
        value: function getDeclaredVariables(node) {
            return this.__declaredVariables.get(node) || [];
        }

        /**
         * acquire scope from node.
         * @method ScopeManager#acquire
         * @param {Esprima.Node} node - node for the acquired scope.
         * @param {boolean=} inner - look up the most inner scope, default value is false.
         * @return {Scope?}
         */

    }, {
        key: 'acquire',
        value: function acquire(node, inner) {
            var scopes, scope, i, iz;

            function predicate(scope) {
                if (scope.type === 'function' && scope.functionExpressionScope) {
                    return false;
                }
                if (scope.type === 'TDZ') {
                    return false;
                }
                return true;
            }

            scopes = this.__get(node);
            if (!scopes || scopes.length === 0) {
                return null;
            }

            // Heuristic selection from all scopes.
            // If you would like to get all scopes, please use ScopeManager#acquireAll.
            if (scopes.length === 1) {
                return scopes[0];
            }

            if (inner) {
                for (i = scopes.length - 1; i >= 0; --i) {
                    scope = scopes[i];
                    if (predicate(scope)) {
                        return scope;
                    }
                }
            } else {
                for (i = 0, iz = scopes.length; i < iz; ++i) {
                    scope = scopes[i];
                    if (predicate(scope)) {
                        return scope;
                    }
                }
            }

            return null;
        }

        /**
         * acquire all scopes from node.
         * @method ScopeManager#acquireAll
         * @param {Esprima.Node} node - node for the acquired scope.
         * @return {Scope[]?}
         */

    }, {
        key: 'acquireAll',
        value: function acquireAll(node) {
            return this.__get(node);
        }

        /**
         * release the node.
         * @method ScopeManager#release
         * @param {Esprima.Node} node - releasing node.
         * @param {boolean=} inner - look up the most inner scope, default value is false.
         * @return {Scope?} upper scope for the node.
         */

    }, {
        key: 'release',
        value: function release(node, inner) {
            var scopes, scope;
            scopes = this.__get(node);
            if (scopes && scopes.length) {
                scope = scopes[0].upper;
                if (!scope) {
                    return null;
                }
                return this.acquire(scope.block, inner);
            }
            return null;
        }
    }, {
        key: 'attach',
        value: function attach() {}
    }, {
        key: 'detach',
        value: function detach() {}
    }, {
        key: '__nestScope',
        value: function __nestScope(scope) {
            if (scope instanceof _scope.GlobalScope) {
                (0, _assert2.default)(this.__currentScope === null);
                this.globalScope = scope;
            }
            this.__currentScope = scope;
            return scope;
        }
    }, {
        key: '__nestGlobalScope',
        value: function __nestGlobalScope(node) {
            return this.__nestScope(new _scope.GlobalScope(this, node));
        }
    }, {
        key: '__nestBlockScope',
        value: function __nestBlockScope(node, isMethodDefinition) {
            return this.__nestScope(new _scope.BlockScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestFunctionScope',
        value: function __nestFunctionScope(node, isMethodDefinition) {
            return this.__nestScope(new _scope.FunctionScope(this, this.__currentScope, node, isMethodDefinition));
        }
    }, {
        key: '__nestForScope',
        value: function __nestForScope(node) {
            return this.__nestScope(new _scope.ForScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestCatchScope',
        value: function __nestCatchScope(node) {
            return this.__nestScope(new _scope.CatchScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestWithScope',
        value: function __nestWithScope(node) {
            return this.__nestScope(new _scope.WithScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestClassScope',
        value: function __nestClassScope(node) {
            return this.__nestScope(new _scope.ClassScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestSwitchScope',
        value: function __nestSwitchScope(node) {
            return this.__nestScope(new _scope.SwitchScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestModuleScope',
        value: function __nestModuleScope(node) {
            return this.__nestScope(new _scope.ModuleScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestTDZScope',
        value: function __nestTDZScope(node) {
            return this.__nestScope(new _scope.TDZScope(this, this.__currentScope, node));
        }
    }, {
        key: '__nestFunctionExpressionNameScope',
        value: function __nestFunctionExpressionNameScope(node) {
            return this.__nestScope(new _scope.FunctionExpressionNameScope(this, this.__currentScope, node));
        }
    }, {
        key: '__isES6',
        value: function __isES6() {
            return this.__options.ecmaVersion >= 6;
        }
    }]);

    return ScopeManager;
}();

/* vim: set sw=4 ts=4 et tw=80 : */


exports.default = ScopeManager;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjb3BlLW1hbmFnZXIuanMiXSwibmFtZXMiOlsiU2NvcGVNYW5hZ2VyIiwib3B0aW9ucyIsInNjb3BlcyIsImdsb2JhbFNjb3BlIiwiX19ub2RlVG9TY29wZSIsIldlYWtNYXAiLCJfX2N1cnJlbnRTY29wZSIsIl9fb3B0aW9ucyIsIl9fZGVjbGFyZWRWYXJpYWJsZXMiLCJkaXJlY3RpdmUiLCJvcHRpbWlzdGljIiwiaWdub3JlRXZhbCIsIm5vZGVqc1Njb3BlIiwic291cmNlVHlwZSIsImltcGxpZWRTdHJpY3QiLCJlY21hVmVyc2lvbiIsIm5vZGUiLCJnZXQiLCJpbm5lciIsInNjb3BlIiwiaSIsIml6IiwicHJlZGljYXRlIiwidHlwZSIsImZ1bmN0aW9uRXhwcmVzc2lvblNjb3BlIiwiX19nZXQiLCJsZW5ndGgiLCJ1cHBlciIsImFjcXVpcmUiLCJibG9jayIsIkdsb2JhbFNjb3BlIiwiX19uZXN0U2NvcGUiLCJpc01ldGhvZERlZmluaXRpb24iLCJCbG9ja1Njb3BlIiwiRnVuY3Rpb25TY29wZSIsIkZvclNjb3BlIiwiQ2F0Y2hTY29wZSIsIldpdGhTY29wZSIsIkNsYXNzU2NvcGUiLCJTd2l0Y2hTY29wZSIsIk1vZHVsZVNjb3BlIiwiVERaU2NvcGUiLCJGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUiXSwibWFwcGluZ3MiOiI7Ozs7OztxakJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQTs7OztBQUNBOzs7Ozs7OztBQWdCQTs7O0lBR3FCQSxZO0FBQ2pCLDBCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQ2pCLGFBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0EsYUFBS0MsV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUtDLGFBQUwsR0FBcUIsSUFBSUMsT0FBSixFQUFyQjtBQUNBLGFBQUtDLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxhQUFLQyxTQUFMLEdBQWlCTixPQUFqQjtBQUNBLGFBQUtPLG1CQUFMLEdBQTJCLElBQUlILE9BQUosRUFB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QUtlLFdBQUwsQ0FBaUIsSUFBSU0sZ0JBQUosQ0FBYyxJQUFkLEVBQW9CLEtBQUsvQixjQUF6QixFQUF5Q1UsSUFBekMsQ0FBakIsQ0FBUDtBQUNIOzs7eUNBRWdCQSxJLEVBQU07QUFDbkIsbUJBQU8sS0FBS2UsV0FBTCxDQUFpQixJQUFJTyxpQkFBSixDQUFlLElBQWYsRUFBcUIsS0FBS2hDLGNBQTFCLEVBQTBDVSxJQUExQyxDQUFqQixDQUFQO0FBQ0g7OzswQ0FFaUJBLEksRUFBTTtBQUNwQixtQkFBTyxLQUFLZSxXQUFMLENBQWlCLElBQUlRLGtCQUFKLENBQWdCLElBQWhCLEVBQXNCLEtBQUtqQyxjQUEzQixFQUEyQ1UsSUFBM0MsQ0FBakIsQ0FBUDtBQUNIOzs7MENBRWlCQSxJLEVBQU07QUFDcEIsbUJBQU8sS0FBS2UsV0FBTCxDQUFpQixJQUFJUyxrQkFBSixDQUFnQixJQUFoQixFQUFzQixLQUFLbEMsY0FBM0IsRUFBMkNVLElBQTNDLENBQWpCLENBQVA7QUFDSDs7O3VDQUVjQSxJLEVBQU07QUFDakIsbUJBQU8sS0FBS2UsV0FBTCxDQUFpQixJQUFJVSxlQUFKLENBQWEsSUFBYixFQUFtQixLQUFLbkMsY0FBeEIsRUFBd0NVLElBQXhDLENBQWpCLENBQVA7QUFDSDs7OzBEQUVpQ0EsSSxFQUFNO0FBQ3BDLG1CQUFPLEtBQUtlLFdBQUwsQ0FBaUIsSUFBSVcsa0NBQUosQ0FBZ0MsSUFBaEMsRUFBc0MsS0FBS3BDLGNBQTNDLEVBQTJEVSxJQUEzRCxDQUFqQixDQUFQO0FBQ0g7OztrQ0FFUztBQUNOLG1CQUFPLEtBQUtULFNBQUwsQ0FBZVEsV0FBZixJQUE4QixDQUFyQztBQUNIOzs7Ozs7QUFHTDs7O2tCQXZNcUJmLFkiLCJmaWxlIjoic2NvcGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gIENvcHlyaWdodCAoQykgMjAxNSBZdXN1a2UgU3V6dWtpIDx1dGF0YW5lLnRlYUBnbWFpbC5jb20+XG5cbiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXG4gIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuKi9cblxuaW1wb3J0IFNjb3BlIGZyb20gJy4vc2NvcGUnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5pbXBvcnQge1xuICAgIEdsb2JhbFNjb3BlLFxuICAgIENhdGNoU2NvcGUsXG4gICAgV2l0aFNjb3BlLFxuICAgIE1vZHVsZVNjb3BlLFxuICAgIENsYXNzU2NvcGUsXG4gICAgU3dpdGNoU2NvcGUsXG4gICAgRnVuY3Rpb25TY29wZSxcbiAgICBGb3JTY29wZSxcbiAgICBURFpTY29wZSxcbiAgICBGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUsXG4gICAgQmxvY2tTY29wZVxufSBmcm9tICcuL3Njb3BlJztcblxuLyoqXG4gKiBAY2xhc3MgU2NvcGVNYW5hZ2VyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjb3BlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNjb3BlcyA9IFtdO1xuICAgICAgICB0aGlzLmdsb2JhbFNjb3BlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX25vZGVUb1Njb3BlID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRTY29wZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX19vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5fX2RlY2xhcmVkVmFyaWFibGVzID0gbmV3IFdlYWtNYXAoKTtcbiAgICB9XG5cbiAgICBfX3VzZURpcmVjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmRpcmVjdGl2ZTtcbiAgICB9XG5cbiAgICBfX2lzT3B0aW1pc3RpYygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLm9wdGltaXN0aWM7XG4gICAgfVxuXG4gICAgX19pZ25vcmVFdmFsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuaWdub3JlRXZhbDtcbiAgICB9XG5cbiAgICBfX2lzTm9kZWpzU2NvcGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb3B0aW9ucy5ub2RlanNTY29wZTtcbiAgICB9XG5cbiAgICBpc01vZHVsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLnNvdXJjZVR5cGUgPT09ICdtb2R1bGUnO1xuICAgIH1cblxuICAgIGlzSW1wbGllZFN0cmljdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vcHRpb25zLmltcGxpZWRTdHJpY3Q7XG4gICAgfVxuXG4gICAgaXNTdHJpY3RNb2RlU3VwcG9ydGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuZWNtYVZlcnNpb24gPj0gNTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIGFwcHJvcHJpYXRlIHNjb3BlIGZvciB0aGlzIG5vZGUuXG4gICAgX19nZXQobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25vZGVUb1Njb3BlLmdldChub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmFyaWFibGVzIHRoYXQgYXJlIGRlY2xhcmVkIGJ5IHRoZSBub2RlLlxuICAgICAqXG4gICAgICogXCJhcmUgZGVjbGFyZWQgYnkgdGhlIG5vZGVcIiBtZWFucyB0aGUgbm9kZSBpcyBzYW1lIGFzIGBWYXJpYWJsZS5kZWZzW10ubm9kZWAgb3IgYFZhcmlhYmxlLmRlZnNbXS5wYXJlbnRgLlxuICAgICAqIElmIHRoZSBub2RlIGRlY2xhcmVzIG5vdGhpbmcsIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAgICogQ0FVVElPTjogVGhpcyBBUEkgaXMgZXhwZXJpbWVudGFsLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VzdG9vbHMvZXNjb3BlL3B1bGwvNjkgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXNwcmltYS5Ob2RlfSBub2RlIC0gYSBub2RlIHRvIGdldC5cbiAgICAgKiBAcmV0dXJucyB7VmFyaWFibGVbXX0gdmFyaWFibGVzIHRoYXQgZGVjbGFyZWQgYnkgdGhlIG5vZGUuXG4gICAgICovXG4gICAgZ2V0RGVjbGFyZWRWYXJpYWJsZXMobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2RlY2xhcmVkVmFyaWFibGVzLmdldChub2RlKSB8fCBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhY3F1aXJlIHNjb3BlIGZyb20gbm9kZS5cbiAgICAgKiBAbWV0aG9kIFNjb3BlTWFuYWdlciNhY3F1aXJlXG4gICAgICogQHBhcmFtIHtFc3ByaW1hLk5vZGV9IG5vZGUgLSBub2RlIGZvciB0aGUgYWNxdWlyZWQgc2NvcGUuXG4gICAgICogQHBhcmFtIHtib29sZWFuPX0gaW5uZXIgLSBsb29rIHVwIHRoZSBtb3N0IGlubmVyIHNjb3BlLCBkZWZhdWx0IHZhbHVlIGlzIGZhbHNlLlxuICAgICAqIEByZXR1cm4ge1Njb3BlP31cbiAgICAgKi9cbiAgICBhY3F1aXJlKG5vZGUsIGlubmVyKSB7XG4gICAgICAgIHZhciBzY29wZXMsIHNjb3BlLCBpLCBpejtcblxuICAgICAgICBmdW5jdGlvbiBwcmVkaWNhdGUoc2NvcGUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZS50eXBlID09PSAnZnVuY3Rpb24nICYmIHNjb3BlLmZ1bmN0aW9uRXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjb3BlLnR5cGUgPT09ICdURFonKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZXMgPSB0aGlzLl9fZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoIXNjb3BlcyB8fCBzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhldXJpc3RpYyBzZWxlY3Rpb24gZnJvbSBhbGwgc2NvcGVzLlxuICAgICAgICAvLyBJZiB5b3Ugd291bGQgbGlrZSB0byBnZXQgYWxsIHNjb3BlcywgcGxlYXNlIHVzZSBTY29wZU1hbmFnZXIjYWNxdWlyZUFsbC5cbiAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZXNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IHNjb3Blcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIHNjb3BlID0gc2NvcGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoc2NvcGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IHNjb3Blcy5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUgPSBzY29wZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShzY29wZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFjcXVpcmUgYWxsIHNjb3BlcyBmcm9tIG5vZGUuXG4gICAgICogQG1ldGhvZCBTY29wZU1hbmFnZXIjYWNxdWlyZUFsbFxuICAgICAqIEBwYXJhbSB7RXNwcmltYS5Ob2RlfSBub2RlIC0gbm9kZSBmb3IgdGhlIGFjcXVpcmVkIHNjb3BlLlxuICAgICAqIEByZXR1cm4ge1Njb3BlW10/fVxuICAgICAqL1xuICAgIGFjcXVpcmVBbGwobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2dldChub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZWxlYXNlIHRoZSBub2RlLlxuICAgICAqIEBtZXRob2QgU2NvcGVNYW5hZ2VyI3JlbGVhc2VcbiAgICAgKiBAcGFyYW0ge0VzcHJpbWEuTm9kZX0gbm9kZSAtIHJlbGVhc2luZyBub2RlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbj19IGlubmVyIC0gbG9vayB1cCB0aGUgbW9zdCBpbm5lciBzY29wZSwgZGVmYXVsdCB2YWx1ZSBpcyBmYWxzZS5cbiAgICAgKiBAcmV0dXJuIHtTY29wZT99IHVwcGVyIHNjb3BlIGZvciB0aGUgbm9kZS5cbiAgICAgKi9cbiAgICByZWxlYXNlKG5vZGUsIGlubmVyKSB7XG4gICAgICAgIHZhciBzY29wZXMsIHNjb3BlO1xuICAgICAgICBzY29wZXMgPSB0aGlzLl9fZ2V0KG5vZGUpO1xuICAgICAgICBpZiAoc2NvcGVzICYmIHNjb3Blcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNjb3BlID0gc2NvcGVzWzBdLnVwcGVyO1xuICAgICAgICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWNxdWlyZShzY29wZS5ibG9jaywgaW5uZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGF0dGFjaCgpIHsgfVxuXG4gICAgZGV0YWNoKCkgeyB9XG5cbiAgICBfX25lc3RTY29wZShzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUgaW5zdGFuY2VvZiBHbG9iYWxTY29wZSkge1xuICAgICAgICAgICAgYXNzZXJ0KHRoaXMuX19jdXJyZW50U2NvcGUgPT09IG51bGwpO1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxTY29wZSA9IHNjb3BlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19jdXJyZW50U2NvcGUgPSBzY29wZTtcbiAgICAgICAgcmV0dXJuIHNjb3BlO1xuICAgIH1cblxuICAgIF9fbmVzdEdsb2JhbFNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IEdsb2JhbFNjb3BlKHRoaXMsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RCbG9ja1Njb3BlKG5vZGUsIGlzTWV0aG9kRGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgQmxvY2tTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0RnVuY3Rpb25TY29wZShub2RlLCBpc01ldGhvZERlZmluaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IEZ1bmN0aW9uU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSwgaXNNZXRob2REZWZpbml0aW9uKSk7XG4gICAgfVxuXG4gICAgX19uZXN0Rm9yU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgRm9yU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdENhdGNoU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgQ2F0Y2hTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0V2l0aFNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IFdpdGhTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0Q2xhc3NTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBDbGFzc1Njb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RTd2l0Y2hTY29wZShub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmVzdFNjb3BlKG5ldyBTd2l0Y2hTY29wZSh0aGlzLCB0aGlzLl9fY3VycmVudFNjb3BlLCBub2RlKSk7XG4gICAgfVxuXG4gICAgX19uZXN0TW9kdWxlU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgTW9kdWxlU2NvcGUodGhpcywgdGhpcy5fX2N1cnJlbnRTY29wZSwgbm9kZSkpO1xuICAgIH1cblxuICAgIF9fbmVzdFREWlNjb3BlKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uZXN0U2NvcGUobmV3IFREWlNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX25lc3RGdW5jdGlvbkV4cHJlc3Npb25OYW1lU2NvcGUobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25lc3RTY29wZShuZXcgRnVuY3Rpb25FeHByZXNzaW9uTmFtZVNjb3BlKHRoaXMsIHRoaXMuX19jdXJyZW50U2NvcGUsIG5vZGUpKTtcbiAgICB9XG5cbiAgICBfX2lzRVM2KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29wdGlvbnMuZWNtYVZlcnNpb24gPj0gNjtcbiAgICB9XG59XG5cbi8qIHZpbTogc2V0IHN3PTQgdHM9NCBldCB0dz04MCA6ICovXG4iXX0=
