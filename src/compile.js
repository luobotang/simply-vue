import directives from './directives/index'
import { toArray, replace } from './utils'

var regTag = /{{([^{}]+)}}/g

export function compileRoot(el, options) { // eslint-disable-line no-unused-vars
	return function rootLinkFn(vm, el) { // eslint-disable-line no-unused-vars
		// TODO
	}
}

export function compile(el, options) {
	var nodeLinkFn = compileNode(el, options)
	var childLinkFn = el.hasChildNodes() ? compileNodeList(el.childNodes, options) : null

	return function compositeLinkFn(vm, el) {
		var childNodes = [].slice.call(el.childNodes)
		linkAndCapture(function compositeLinkCapturer() {
			if (nodeLinkFn) nodeLinkFn(vm, el)
			if (childLinkFn) childLinkFn(vm, childNodes)
		}, vm)
	}
}

function linkAndCapture(linker, vm) {
	var originalDirCount = vm._directives.length
	linker()
	var dirs = vm._directives.slice(originalDirCount)
	dirs.forEach(function (dir) { dir._bind() })
	return dirs
}

function compileNode(node, options) {
	if (node.nodeType === 1) {
		return compileElement(node, options)
	} else if (node.nodeType === 3) {
		return compileTextNode(node, options)
	} else {
		return null
	}
}

function compileNodeList(nodeList, options) {
	var linkFns = []
	var nodeLinkFn, childLinkFn, node
	for (var i = 0, l = nodeList.length; i < l; i++) {
		node = nodeList[i]
		nodeLinkFn = compileNode(node, options)
		childLinkFn = node.hasChildNodes() ? compileNodeList(node.childNodes, options) : null
		linkFns.push(nodeLinkFn, childLinkFn)
	}
	return linkFns.length ? makeChildLinkFn(linkFns) : null
}

function makeChildLinkFn(linkFns) {
	return function childLinkFn(vm, nodes) {
		var node, nodeLinkFn, childrenLinkFn
		for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
			node = nodes[n]
			nodeLinkFn = linkFns[i++]
			childrenLinkFn = linkFns[i++]
			if (nodeLinkFn) nodeLinkFn(vm, node)
			if (childrenLinkFn) childrenLinkFn(vm, toArray(node.childNodes))
		}
	}
}

function compileElement(el, options) { // eslint-disable-line no-unused-vars
	// 只处理 input[type="text"][v-model]
	if (el.tagName === 'INPUT' && el.hasAttribute('v-model')) {
		var exp = el.getAttribute('v-model').trim()
		return makeNodeLinkFn({
			name: 'model',
			exp: exp,
			def: directives.model
		})
	} else {
		return null
	}
}

function compileTextNode(node, options) { // eslint-disable-line no-unused-vars
	var tokens = parseText(node.wholeText)
	if (tokens) {
		var frag = document.createDocumentFragment()
		tokens.forEach(function (token) {
			var el = token.tag ? processTextToken(token) : document.createTextNode(token.value)
			frag.appendChild(el)
		})
		return makeTextNodeLinkFn(tokens, frag)
	}
}

function processTextToken(token) {
  var el = document.createTextNode(' ')
	// 简化，双向绑定，text 模式
	token.descriptor = {
		name: 'text',
		exp: token.value,
		def: directives.text
	}
	return el
}

function makeNodeLinkFn(dir) {
	return function nodeLinkFn(vm, el) {
		vm._bindDir(dir, el)
	}
}

function makeTextNodeLinkFn(tokens, frag) {
	return function textNodeLinkFn(vm, el) {
		var fragClone = frag.cloneNode(true)
		var childNodes = toArray(fragClone.childNodes)
		tokens.forEach(function (token, i) {
			if (token.tag) {
				var node = childNodes[i]
				vm._bindDir(token.descriptor, node)
			}
		})
		replace(el, fragClone)
	}
}

function parseText(text) {
  if (regTag.test(text)) {
    // just copy from vue, and simplify
    var tokens = []
    var lastIndex = regTag.lastIndex = 0
    var match, index, value

    while ((match = regTag.exec(text))) {

      index = match.index
      // push text token
      if (index > lastIndex) {
        tokens.push({
          value: text.slice(lastIndex, index)
        })
      }

      value = match[1]

      tokens.push({
        tag: true,
        value: value.trim()
      })
      lastIndex = index + match[0].length
    }
    if (lastIndex < text.length) {
      tokens.push({
        value: text.slice(lastIndex)
      })
    }
    return tokens
  } else {
    return null
  }
}