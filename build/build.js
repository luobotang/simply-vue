const path = require('path')
const rollup = require('rollup').rollup

rollup({
	input: path.resolve(__dirname, '../src/vue.js')
}).then((bundle) => {
	bundle.write({
		file: path.resolve(__dirname, '../dist/vue.js'),
		format: 'umd',
		name: 'Vue'
	})
}).catch((e) => {
	console.error(e)
})