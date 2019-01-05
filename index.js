// Service 插件会在一个 Service 实例被创建时自动加载—— 比如每次 vue - cli - service 命令在项目中被调用时。
import creatRouter from './generateRouter/index'

module.exports = (api, projectOptions) => {
    api.registerCommand('test', args => {
        console.log(projectOptions.pluginOptions.foo, '---projectOptions.pluginOptions.foo')
        creatRouter(true)
    })
}