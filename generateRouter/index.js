const Glob = require('glob')
const pify = require('pify')
const path = require('path')
const fs = require('fs')
const glob = pify(Glob)

const defaultOptions = {
  src: './src',
  pages: 'views'
};

let options;
try {
  options = require(path.resolve(process.cwd(), './router.generater.json'));
} catch (e) { }

options = options || defaultOptions;
options = { ...defaultOptions, ...options };

generateRoutesAndFiles = async () => {
  const files = {};

  (await glob(`${options.pages}/**/*.{vue,js}`, {
    cwd: path.resolve(process.cwd(), options.src),
    ignore: ['**/*.test.*', '**/*.spec.*', '**/-*.*']
  })).forEach((f) => {
    const key = f.replace(/\.(js|vue)$/, '')
    if (/\.vue$/.test(f) || !files[key]) {
      files[key] = f.replace(/('|")/g, '\\$1')
    }
  });

  return createRoutes(Object.values(files), options.pages);
}

function createRoutes(files, pagesDir) {
  const routes = []
  const requireComponent = []
  files.forEach((file) => {
    const keys = file
      .replace(RegExp(`^${pagesDir}`), '')
      .replace(/\.(vue|js)$/, '')
      .replace(/\/{2,}/g, '/')
      .split('/')
      .slice(1)

    const route = {
      name: '',
      path: '',
      component: `views${camelCase(keys.join('-').replace('_', ''))}`
    }

    requireComponent.push(`const views${camelCase(keys.join('-').replace('_', ''))} = resolve => require(['../${options.pages}/${keys.join('/')}'], resolve)`)
    let parent = routes
    keys.forEach((key, i) => {
      route.name = key.startsWith('_') ? key.substr(1) : key
      route.name += key === '_' ? 'all' : ''
      const child = parent.find(parentRoute => parentRoute.name === route.name)
      if (child) {
        child.children = child.children || []
        parent = child.children
        route.path = ''
      } else if (key === 'index' && i + 1 === keys.length) {
        route.path += i > 0 ? '' : '/'
      } else {
        route.path = `/` + getRoutePathExtension(key)

        if (key.startsWith('_') && key.length > 1) {
          route.path += '?'
        }
      }
    })
    parent.push(route)
  })
  sortRoutes(routes)
  return {
    'routes': cleanChildrenRoutes(routes),
    'requireComponent': requireComponent
  }
}

const startsWithAlias = aliasArray => str => aliasArray.some(c => str.startsWith(c));
const reqSep = /\//g;
const sysSep = escapeRegExp(path.sep);
const normalize = string => string.replace(reqSep, sysSep);
const startsWithSrcAlias = startsWithAlias(['@', '~']);
const r = function r(...args) {
  const lastArg = args[args.length - 1];
  if (startsWithSrcAlias(lastArg)) {
    return wp(lastArg)
  }
  return wp(path.resolve(...args.map(normalize)))
};

function baseToString(value) {
  if (typeof value == 'string') {
    return value;
  }
  if (isArray_1(value)) {
    return _arrayMap(value, baseToString) + '';
  }
  if (isSymbol_1(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

function toString(value) {
  return value == null ? '' : baseToString(value);
}

function escapeRegExp(string) {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);
  string = toString(string);
  return (string && reHasRegExpChar.test(string)) ?
    string.replace(reRegExpChar, '\\$&') :
    string;
}
const isWindows = /^win/.test(process.platform);
const wp = function wp(p = '') {
  if (isWindows) {
    return p.replace(/\\/g, '\\\\')
  }
  return p
};
const getRoutePathExtension = (key) => {
  if (key === '_') {
    return '*'
  }

  if (key.startsWith('_')) {
    return `:${key.substr(1)}`
  }

  return key
};

const DYNAMIC_ROUTE_REGEX = /^\/(:|\*)/;

function sortRoutes(routes) {
  routes.sort((a, b) => {
    if (!a.path.length) {
      return -1
    }
    if (!b.path.length) {
      return 1
    }
    if (a.path === '/') {
      return DYNAMIC_ROUTE_REGEX.test(b.path) ? -1 : 1
    }
    if (b.path === '/') {
      return DYNAMIC_ROUTE_REGEX.test(a.path) ? 1 : -1
    }

    let i
    let res = 0
    let y = 0
    let z = 0
    const _a = a.path.split('/')
    const _b = b.path.split('/')
    for (i = 0; i < _a.length; i++) {
      if (res !== 0) {
        break
      }
      y = _a[i] === '*' ? 2 : _a[i].includes(':') ? 1 : 0
      z = _b[i] === '*' ? 2 : _b[i].includes(':') ? 1 : 0
      res = y - z
      // If a.length >= b.length
      if (i === _b.length - 1 && res === 0) {
        // unless * found sort by level, then alphabetically
        res = _a[i] === '*' ? -1 : (
          _a.length === _b.length ? a.path.localeCompare(b.path) : (_a.length - _b.length)
        )
      }
    }

    if (res === 0) {
      res = _a[i - 1] === '*' && _b[i] ? 1 : (
        _a.length === _b.length ? a.path.localeCompare(b.path) : (_a.length - _b.length)
      )
    }
    return res
  })

  routes.forEach((route) => {
    if (route.children) {
      sortRoutes(route.children)
    }
  })

  return routes
}

function cleanChildrenRoutes(routes, isChild = false) {
  let start = -1
  const routesIndex = []
  routes.forEach((route) => {
    if (/-index$/.test(route.name) || route.name === 'index') {
      const res = route.name.split('-')
      const s = res.indexOf('index')
      start = start === -1 || s < start ? s : start
      routesIndex.push(res)
    }
  })
  routes.forEach((route) => {
    route.path = isChild ? route.path.replace('/', '') : route.path
    if (route.path.includes('?')) {
      const names = route.name.split('-')
      const paths = route.path.split('/')
      if (!isChild) {
        paths.shift()
      }
      routesIndex.forEach((r) => {
        const i = r.indexOf('index') - start
        if (i < paths.length) {
          for (let a = 0; a <= i; a++) {
            if (a === i) {
              paths[a] = paths[a].replace('?', '')
            }
            if (a < i && names[a] !== r[a]) {
              break
            }
          }
        }
      })
      route.path = (isChild ? '' : '/') + paths.join('/')
    }
    route.name = route.name.replace(/-index$/, '')
    if (route.children) {
      if (route.children.find(child => child.path === '')) {
        delete route.name
      }
      route.children = cleanChildrenRoutes(route.children, true)
    }
  })
  return routes
}

function camelCase(string) {
  return string.replace(/-([a-z])/g, function (all, letter) {
    return letter.toUpperCase();
  });
}

module.exports.creatRouter = (flag = false) => {
  if (flag) return
  generateRoutesAndFiles().then(res => {
    let string = ''
    res.requireComponent.forEach(res => {
      string += `${res}\n`
    })

    string += `export default routes = ${JSON.stringify(res.routes, null, 2)}`
      .replace(/"component": "(\w+?)"/g, `"component": $1`)
      .replace(/"(\w+?)":/g, '$1:')
    fs.mkdir(path.resolve(process.cwd(), options.src, './router'), err => {
      if (err) {
        console.log('router文件已存在')
      }
    })
    fs.writeFile(path.resolve(process.cwd(), options.src, './router/route.js'), string, () => {
      console.log('router文件写入完毕')
    })
  })
}
