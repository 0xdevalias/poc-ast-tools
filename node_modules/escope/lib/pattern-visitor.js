'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _estraverse = require('estraverse');

var _esrecurse = require('esrecurse');

var _esrecurse2 = _interopRequireDefault(_esrecurse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

function getLast(xs) {
    return xs[xs.length - 1] || null;
}

var PatternVisitor = function (_esrecurse$Visitor) {
    _inherits(PatternVisitor, _esrecurse$Visitor);

    _createClass(PatternVisitor, null, [{
        key: 'isPattern',
        value: function isPattern(node) {
            var nodeType = node.type;
            return nodeType === _estraverse.Syntax.Identifier || nodeType === _estraverse.Syntax.ObjectPattern || nodeType === _estraverse.Syntax.ArrayPattern || nodeType === _estraverse.Syntax.SpreadElement || nodeType === _estraverse.Syntax.RestElement || nodeType === _estraverse.Syntax.AssignmentPattern;
        }
    }]);

    function PatternVisitor(options, rootPattern, callback) {
        _classCallCheck(this, PatternVisitor);

        var _this = _possibleConstructorReturn(this, (PatternVisitor.__proto__ || Object.getPrototypeOf(PatternVisitor)).call(this, null, options));

        _this.rootPattern = rootPattern;
        _this.callback = callback;
        _this.assignments = [];
        _this.rightHandNodes = [];
        _this.restElements = [];
        return _this;
    }

    _createClass(PatternVisitor, [{
        key: 'Identifier',
        value: function Identifier(pattern) {
            var lastRestElement = getLast(this.restElements);
            this.callback(pattern, {
                topLevel: pattern === this.rootPattern,
                rest: lastRestElement != null && lastRestElement.argument === pattern,
                assignments: this.assignments
            });
        }
    }, {
        key: 'Property',
        value: function Property(property) {
            // Computed property's key is a right hand node.
            if (property.computed) {
                this.rightHandNodes.push(property.key);
            }

            // If it's shorthand, its key is same as its value.
            // If it's shorthand and has its default value, its key is same as its value.left (the value is AssignmentPattern).
            // If it's not shorthand, the name of new variable is its value's.
            this.visit(property.value);
        }
    }, {
        key: 'ArrayPattern',
        value: function ArrayPattern(pattern) {
            var i, iz, element;
            for (i = 0, iz = pattern.elements.length; i < iz; ++i) {
                element = pattern.elements[i];
                this.visit(element);
            }
        }
    }, {
        key: 'AssignmentPattern',
        value: function AssignmentPattern(pattern) {
            this.assignments.push(pattern);
            this.visit(pattern.left);
            this.rightHandNodes.push(pattern.right);
            this.assignments.pop();
        }
    }, {
        key: 'RestElement',
        value: function RestElement(pattern) {
            this.restElements.push(pattern);
            this.visit(pattern.argument);
            this.restElements.pop();
        }
    }, {
        key: 'MemberExpression',
        value: function MemberExpression(node) {
            // Computed property's key is a right hand node.
            if (node.computed) {
                this.rightHandNodes.push(node.property);
            }
            // the object is only read, write to its property.
            this.rightHandNodes.push(node.object);
        }

        //
        // ForInStatement.left and AssignmentExpression.left are LeftHandSideExpression.
        // By spec, LeftHandSideExpression is Pattern or MemberExpression.
        //   (see also: https://github.com/estree/estree/pull/20#issuecomment-74584758)
        // But espree 2.0 and esprima 2.0 parse to ArrayExpression, ObjectExpression, etc...
        //

    }, {
        key: 'SpreadElement',
        value: function SpreadElement(node) {
            this.visit(node.argument);
        }
    }, {
        key: 'ArrayExpression',
        value: function ArrayExpression(node) {
            node.elements.forEach(this.visit, this);
        }
    }, {
        key: 'AssignmentExpression',
        value: function AssignmentExpression(node) {
            this.assignments.push(node);
            this.visit(node.left);
            this.rightHandNodes.push(node.right);
            this.assignments.pop();
        }
    }, {
        key: 'CallExpression',
        value: function CallExpression(node) {
            var _this2 = this;

            // arguments are right hand nodes.
            node.arguments.forEach(function (a) {
                _this2.rightHandNodes.push(a);
            });
            this.visit(node.callee);
        }
    }]);

    return PatternVisitor;
}(_esrecurse2.default.Visitor);

/* vim: set sw=4 ts=4 et tw=80 : */


exports.default = PatternVisitor;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhdHRlcm4tdmlzaXRvci5qcyJdLCJuYW1lcyI6WyJnZXRMYXN0IiwieHMiLCJsZW5ndGgiLCJQYXR0ZXJuVmlzaXRvciIsIm5vZGUiLCJub2RlVHlwZSIsInR5cGUiLCJTeW50YXgiLCJJZGVudGlmaWVyIiwiT2JqZWN0UGF0dGVybiIsIkFycmF5UGF0dGVybiIsIlNwcmVhZEVsZW1lbnQiLCJSZXN0RWxlbWVudCIsIkFzc2lnbm1lbnRQYXR0ZXJuIiwib3B0aW9ucyIsInJvb3RQYXR0ZXJuIiwiY2FsbGJhY2siLCJhc3NpZ25tZW50cyIsInJpZ2h0SGFuZE5vZGVzIiwicmVzdEVsZW1lbnRzIiwicGF0dGVybiIsImxhc3RSZXN0RWxlbWVudCIsInRvcExldmVsIiwicmVzdCIsImFyZ3VtZW50IiwicHJvcGVydHkiLCJjb21wdXRlZCIsInB1c2giLCJrZXkiLCJ2aXNpdCIsInZhbHVlIiwiaSIsIml6IiwiZWxlbWVudCIsImVsZW1lbnRzIiwibGVmdCIsInJpZ2h0IiwicG9wIiwib2JqZWN0IiwiZm9yRWFjaCIsImFyZ3VtZW50cyIsImEiLCJjYWxsZWUiLCJlc3JlY3Vyc2UiLCJWaXNpdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQXdCQTs7QUFDQTs7Ozs7Ozs7OzsrZUF6QkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxTQUFTQSxPQUFULENBQWlCQyxFQUFqQixFQUFxQjtBQUNqQixXQUFPQSxHQUFHQSxHQUFHQyxNQUFILEdBQVksQ0FBZixLQUFxQixJQUE1QjtBQUNIOztJQUVvQkMsYzs7Ozs7a0NBQ0FDLEksRUFBTTtBQUNuQixnQkFBSUMsV0FBV0QsS0FBS0UsSUFBcEI7QUFDQSxtQkFDSUQsYUFBYUUsbUJBQU9DLFVBQXBCLElBQ0FILGFBQWFFLG1CQUFPRSxhQURwQixJQUVBSixhQUFhRSxtQkFBT0csWUFGcEIsSUFHQUwsYUFBYUUsbUJBQU9JLGFBSHBCLElBSUFOLGFBQWFFLG1CQUFPSyxXQUpwQixJQUtBUCxhQUFhRSxtQkFB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YUFBSztBQUFFLHVCQUFLckIsY0FBTCxDQUFvQlMsSUFBcEIsQ0FBeUJjLENBQXpCO0FBQThCLGFBQTVEO0FBQ0EsaUJBQUtaLEtBQUwsQ0FBV3pCLEtBQUtzQyxNQUFoQjtBQUNIOzs7O0VBbkd1Q0Msb0JBQVVDLE87O0FBc0d0RDs7O2tCQXRHcUJ6QyxjIiwiZmlsZSI6InBhdHRlcm4tdmlzaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gIENvcHlyaWdodCAoQykgMjAxNSBZdXN1a2UgU3V6dWtpIDx1dGF0YW5lLnRlYUBnbWFpbC5jb20+XG5cbiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXG4gIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuKi9cblxuaW1wb3J0IHsgU3ludGF4IH0gZnJvbSAnZXN0cmF2ZXJzZSc7XG5pbXBvcnQgZXNyZWN1cnNlIGZyb20gJ2VzcmVjdXJzZSc7XG5cbmZ1bmN0aW9uIGdldExhc3QoeHMpIHtcbiAgICByZXR1cm4geHNbeHMubGVuZ3RoIC0gMV0gfHwgbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGF0dGVyblZpc2l0b3IgZXh0ZW5kcyBlc3JlY3Vyc2UuVmlzaXRvciB7XG4gICAgc3RhdGljIGlzUGF0dGVybihub2RlKSB7XG4gICAgICAgIHZhciBub2RlVHlwZSA9IG5vZGUudHlwZTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIG5vZGVUeXBlID09PSBTeW50YXguSWRlbnRpZmllciB8fFxuICAgICAgICAgICAgbm9kZVR5cGUgPT09IFN5bnRheC5PYmplY3RQYXR0ZXJuIHx8XG4gICAgICAgICAgICBub2RlVHlwZSA9PT0gU3ludGF4LkFycmF5UGF0dGVybiB8fFxuICAgICAgICAgICAgbm9kZVR5cGUgPT09IFN5bnRheC5TcHJlYWRFbGVtZW50IHx8XG4gICAgICAgICAgICBub2RlVHlwZSA9PT0gU3ludGF4LlJlc3RFbGVtZW50IHx8XG4gICAgICAgICAgICBub2RlVHlwZSA9PT0gU3ludGF4LkFzc2lnbm1lbnRQYXR0ZXJuXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucywgcm9vdFBhdHRlcm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHN1cGVyKG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnJvb3RQYXR0ZXJuID0gcm9vdFBhdHRlcm47XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5hc3NpZ25tZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnJpZ2h0SGFuZE5vZGVzID0gW107XG4gICAgICAgIHRoaXMucmVzdEVsZW1lbnRzID0gW107XG4gICAgfVxuXG4gICAgSWRlbnRpZmllcihwYXR0ZXJuKSB7XG4gICAgICAgIGNvbnN0IGxhc3RSZXN0RWxlbWVudCA9IGdldExhc3QodGhpcy5yZXN0RWxlbWVudHMpO1xuICAgICAgICB0aGlzLmNhbGxiYWNrKHBhdHRlcm4sIHtcbiAgICAgICAgICAgIHRvcExldmVsOiBwYXR0ZXJuID09PSB0aGlzLnJvb3RQYXR0ZXJuLFxuICAgICAgICAgICAgcmVzdDogbGFzdFJlc3RFbGVtZW50ICE9IG51bGwgJiYgbGFzdFJlc3RFbGVtZW50LmFyZ3VtZW50ID09PSBwYXR0ZXJuLFxuICAgICAgICAgICAgYXNzaWdubWVudHM6IHRoaXMuYXNzaWdubWVudHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgUHJvcGVydHkocHJvcGVydHkpIHtcbiAgICAgICAgLy8gQ29tcHV0ZWQgcHJvcGVydHkncyBrZXkgaXMgYSByaWdodCBoYW5kIG5vZGUuXG4gICAgICAgIGlmIChwcm9wZXJ0eS5jb21wdXRlZCkge1xuICAgICAgICAgICAgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKHByb3BlcnR5LmtleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBpdCdzIHNob3J0aGFuZCwgaXRzIGtleSBpcyBzYW1lIGFzIGl0cyB2YWx1ZS5cbiAgICAgICAgLy8gSWYgaXQncyBzaG9ydGhhbmQgYW5kIGhhcyBpdHMgZGVmYXVsdCB2YWx1ZSwgaXRzIGtleSBpcyBzYW1lIGFzIGl0cyB2YWx1ZS5sZWZ0ICh0aGUgdmFsdWUgaXMgQXNzaWdubWVudFBhdHRlcm4pLlxuICAgICAgICAvLyBJZiBpdCdzIG5vdCBzaG9ydGhhbmQsIHRoZSBuYW1lIG9mIG5ldyB2YXJpYWJsZSBpcyBpdHMgdmFsdWUncy5cbiAgICAgICAgdGhpcy52aXNpdChwcm9wZXJ0eS52YWx1ZSk7XG4gICAgfVxuXG4gICAgQXJyYXlQYXR0ZXJuKHBhdHRlcm4pIHtcbiAgICAgICAgdmFyIGksIGl6LCBlbGVtZW50O1xuICAgICAgICBmb3IgKGkgPSAwLCBpeiA9IHBhdHRlcm4uZWxlbWVudHMubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IHBhdHRlcm4uZWxlbWVudHNbaV07XG4gICAgICAgICAgICB0aGlzLnZpc2l0KGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQXNzaWdubWVudFBhdHRlcm4ocGF0dGVybikge1xuICAgICAgICB0aGlzLmFzc2lnbm1lbnRzLnB1c2gocGF0dGVybik7XG4gICAgICAgIHRoaXMudmlzaXQocGF0dGVybi5sZWZ0KTtcbiAgICAgICAgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKHBhdHRlcm4ucmlnaHQpO1xuICAgICAgICB0aGlzLmFzc2lnbm1lbnRzLnBvcCgpO1xuICAgIH1cblxuICAgIFJlc3RFbGVtZW50KHBhdHRlcm4pIHtcbiAgICAgICAgdGhpcy5yZXN0RWxlbWVudHMucHVzaChwYXR0ZXJuKTtcbiAgICAgICAgdGhpcy52aXNpdChwYXR0ZXJuLmFyZ3VtZW50KTtcbiAgICAgICAgdGhpcy5yZXN0RWxlbWVudHMucG9wKCk7XG4gICAgfVxuXG4gICAgTWVtYmVyRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIC8vIENvbXB1dGVkIHByb3BlcnR5J3Mga2V5IGlzIGEgcmlnaHQgaGFuZCBub2RlLlxuICAgICAgICBpZiAobm9kZS5jb21wdXRlZCkge1xuICAgICAgICAgICAgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKG5vZGUucHJvcGVydHkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRoZSBvYmplY3QgaXMgb25seSByZWFkLCB3cml0ZSB0byBpdHMgcHJvcGVydHkuXG4gICAgICAgIHRoaXMucmlnaHRIYW5kTm9kZXMucHVzaChub2RlLm9iamVjdCk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBGb3JJblN0YXRlbWVudC5sZWZ0IGFuZCBBc3NpZ25tZW50RXhwcmVzc2lvbi5sZWZ0IGFyZSBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uLlxuICAgIC8vIEJ5IHNwZWMsIExlZnRIYW5kU2lkZUV4cHJlc3Npb24gaXMgUGF0dGVybiBvciBNZW1iZXJFeHByZXNzaW9uLlxuICAgIC8vICAgKHNlZSBhbHNvOiBodHRwczovL2dpdGh1Yi5jb20vZXN0cmVlL2VzdHJlZS9wdWxsLzIwI2lzc3VlY29tbWVudC03NDU4NDc1OClcbiAgICAvLyBCdXQgZXNwcmVlIDIuMCBhbmQgZXNwcmltYSAyLjAgcGFyc2UgdG8gQXJyYXlFeHByZXNzaW9uLCBPYmplY3RFeHByZXNzaW9uLCBldGMuLi5cbiAgICAvL1xuXG4gICAgU3ByZWFkRWxlbWVudChub2RlKSB7XG4gICAgICAgIHRoaXMudmlzaXQobm9kZS5hcmd1bWVudCk7XG4gICAgfVxuXG4gICAgQXJyYXlFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5mb3JFYWNoKHRoaXMudmlzaXQsIHRoaXMpO1xuICAgIH1cblxuICAgIEFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5hc3NpZ25tZW50cy5wdXNoKG5vZGUpO1xuICAgICAgICB0aGlzLnZpc2l0KG5vZGUubGVmdCk7XG4gICAgICAgIHRoaXMucmlnaHRIYW5kTm9kZXMucHVzaChub2RlLnJpZ2h0KTtcbiAgICAgICAgdGhpcy5hc3NpZ25tZW50cy5wb3AoKTtcbiAgICB9XG5cbiAgICBDYWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgICAgIC8vIGFyZ3VtZW50cyBhcmUgcmlnaHQgaGFuZCBub2Rlcy5cbiAgICAgICAgbm9kZS5hcmd1bWVudHMuZm9yRWFjaChhID0+IHsgdGhpcy5yaWdodEhhbmROb2Rlcy5wdXNoKGEpOyB9KTtcbiAgICAgICAgdGhpcy52aXNpdChub2RlLmNhbGxlZSk7XG4gICAgfVxufVxuXG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIl19
